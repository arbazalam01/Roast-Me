import { db } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  onSnapshot
} from "firebase/firestore";
import { moderateContent, calculateContentScore } from "./moderation";

export interface Username {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  photoURL: string;
  createdAt: Timestamp;
  active: boolean;
}

export interface AnonymousMessage {
  id: string;
  usernameId: string;
  content: string;
  createdAt: Timestamp;
  approved: boolean;
  reported: boolean;
  reportCount: number;
  contentScore: number; // Quality score from 0-100
  ipHash?: string; // For rate limiting
}

export interface CreateUsernameData {
  userId: string;
  username: string;
  displayName: string;
  photoURL: string;
}

export interface CreateMessageData {
  usernameId: string;
  content: string;
  ipHash?: string;
}

// Username Management
export async function checkUsernameAvailability(username: string): Promise<boolean> {
  const normalizedUsername = username.toLowerCase().trim();
  
  // Basic validation
  if (!normalizedUsername || normalizedUsername.length < 3 || normalizedUsername.length > 20) {
    return false;
  }
  
  // Check for valid characters (alphanumeric, underscore, hyphen)
  const validUsernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!validUsernameRegex.test(normalizedUsername)) {
    return false;
  }
  
  // Check if username exists
  const usernamesRef = collection(db, "usernames");
  const q = query(usernamesRef, where("username", "==", normalizedUsername));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.empty;
}

export async function createUsername(data: CreateUsernameData): Promise<string> {
  const normalizedUsername = data.username.toLowerCase().trim();
  
  // Double-check availability
  const isAvailable = await checkUsernameAvailability(normalizedUsername);
  if (!isAvailable) {
    throw new Error("Username is not available");
  }
  
  // Check if user already has a username
  const existingUsername = await getUserUsername(data.userId);
  if (existingUsername) {
    throw new Error("User already has a username");
  }
  
  const usernameData: Omit<Username, 'id'> = {
    userId: data.userId,
    username: normalizedUsername,
    displayName: data.displayName,
    photoURL: data.photoURL,
    createdAt: Timestamp.now(),
    active: true
  };
  
  const usernamesRef = collection(db, "usernames");
  const docRef = await addDoc(usernamesRef, usernameData);
  
  return docRef.id;
}

export async function getUserUsername(userId: string): Promise<Username | null> {
  const usernamesRef = collection(db, "usernames");
  const q = query(usernamesRef, where("userId", "==", userId), where("active", "==", true));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return null;
  }
  
  const doc = querySnapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data()
  } as Username;
}

export async function getUsernameByUsername(username: string): Promise<Username | null> {
  const normalizedUsername = username.toLowerCase().trim();
  
  const usernamesRef = collection(db, "usernames");
  const q = query(
    usernamesRef, 
    where("username", "==", normalizedUsername), 
    where("active", "==", true)
  );
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return null;
  }
  
  const doc = querySnapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data()
  } as Username;
}

// Anonymous Messages Management
export async function createAnonymousMessage(data: CreateMessageData): Promise<string> {
  // Validate message content
  const content = data.content.trim();
  if (!content) {
    throw new Error("Message content cannot be empty");
  }
  
  // Check word count (30 words max)
  const wordCount = content.split(/\s+/).length;
  if (wordCount > 30) {
    throw new Error("Message must be 30 words or less");
  }
  
  // Enhanced content moderation
  const moderationResult = moderateContent(content);
  if (!moderationResult.isAllowed) {
    throw new Error(moderationResult.reason || "Message contains inappropriate content");
  }
  
  // Calculate content quality score
  const contentScore = calculateContentScore(content);
  
  // Use filtered content if available
  const finalContent = moderationResult.filteredContent || content;
  
  const messageData: Omit<AnonymousMessage, 'id'> = {
    usernameId: data.usernameId,
    content: finalContent,
    createdAt: Timestamp.now(),
    approved: true, // Auto-approve for now, can add manual moderation later
    reported: false,
    reportCount: 0,
    contentScore: contentScore,
    ipHash: data.ipHash
  };
  
  const messagesRef = collection(db, "anonymousMessages");
  const docRef = await addDoc(messagesRef, messageData);
  
  return docRef.id;
}

export async function getUserMessages(usernameId: string, limitCount: number = 50): Promise<AnonymousMessage[]> {
  const messagesRef = collection(db, "anonymousMessages");
  const q = query(
    messagesRef,
    where("usernameId", "==", usernameId),
    where("approved", "==", true),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );
  
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as AnonymousMessage[];
}

export function subscribeToUserMessages(
  usernameId: string, 
  callback: (messages: AnonymousMessage[]) => void,
  limitCount: number = 50
): () => void {
  const messagesRef = collection(db, "anonymousMessages");
  const q = query(
    messagesRef,
    where("usernameId", "==", usernameId),
    where("approved", "==", true),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AnonymousMessage[];
    
    callback(messages);
  });
}

// Rate Limiting Helper
export async function checkRateLimit(ipHash: string, windowMinutes: number = 5, maxMessages: number = 3): Promise<boolean> {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);
  
  const messagesRef = collection(db, "anonymousMessages");
  const q = query(
    messagesRef,
    where("ipHash", "==", ipHash),
    where("createdAt", ">=", Timestamp.fromDate(windowStart))
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.size < maxMessages;
}

// Moderation helpers
export async function reportMessage(messageId: string): Promise<void> {
  const messageRef = doc(db, "anonymousMessages", messageId);
  const messageDoc = await getDoc(messageRef);
  
  if (!messageDoc.exists()) {
    throw new Error("Message not found");
  }
  
  const currentData = messageDoc.data() as AnonymousMessage;
  const newReportCount = (currentData.reportCount || 0) + 1;
  
  await setDoc(messageRef, {
    reportCount: newReportCount,
    reported: true,
    // Auto-hide if too many reports
    approved: newReportCount < 5
  }, { merge: true });
}