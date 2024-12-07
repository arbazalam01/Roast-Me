import { db } from "./firebase";
import { collection, doc, setDoc, getDoc, query, where, getDocs, deleteDoc, Timestamp } from "firebase/firestore";
import { nanoid } from "nanoid";

// 30 minutes in milliseconds
const LINK_EXPIRATION_TIME = 30 * 60 * 1000;

export interface LinkData {
  userId: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  active: boolean;
  displayName: string;
  photoURL: string;
}

export async function generateUniqueLink(userId: string, displayName: string, photoURL: string) {
  const shortId = nanoid(8);
  const linksRef = collection(db, "links");
  const linkDoc = doc(linksRef, shortId);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + LINK_EXPIRATION_TIME);

  const linkData: LinkData = {
    userId,
    displayName,
    photoURL,
    createdAt: Timestamp.fromDate(now),
    expiresAt: Timestamp.fromDate(expiresAt),
    active: true
  };

  await setDoc(linkDoc, linkData);
  return shortId;
}

export async function getLinkData(linkId: string) {
  const linkDoc = doc(db, "links", linkId);
  const linkSnap = await getDoc(linkDoc);
  
  if (!linkSnap.exists()) {
    return null;
  }

  const linkData = linkSnap.data() as LinkData;
  const expiresAt = linkData.expiresAt instanceof Timestamp ? linkData.expiresAt.toDate() : new Date(linkData.expiresAt);
  const now = new Date();
  
  if (now > expiresAt) {
    await checkAndHandleExpiredLink(linkData);
    return null;
  }
  
  return {
    id: linkSnap.id,
    ...linkData
  };
}

export async function getUserLinks(userId: string) {
  const linksRef = collection(db, "links");
  const q = query(linksRef, where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  
  const links = await Promise.all(
    querySnapshot.docs.map(async (doc) => {
      const data = doc.data() as LinkData;
      const linkData = {
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt
      };
      const isExpired = await checkAndHandleExpiredLink(linkData);
      return isExpired ? null : linkData;
    })
  );

  return links.filter(link => link !== null);
}

export async function updateLinkStatus(linkId: string, active: boolean) {
  const linkDoc = doc(db, "links", linkId);
  const linkSnap = await getDoc(linkDoc);
  
  if (!linkSnap.exists()) {
    return;
  }

  const linkData = linkSnap.data() as LinkData;
  
  // If deactivating, also cleanup chat sessions
  if (!active) {
    await cleanupChatSessions(linkId);
  }

  await setDoc(linkDoc, { 
    active,
    // If deactivating, set expiration to now
    ...(active ? {} : { expiresAt: Timestamp.fromDate(new Date()) })
  }, { merge: true });
}

async function checkAndHandleExpiredLink(linkData: LinkData): Promise<boolean> {
  const expiresAt = linkData.expiresAt instanceof Timestamp ? linkData.expiresAt.toDate() : new Date(linkData.expiresAt);
  const now = new Date();
  
  if (now > expiresAt || !linkData.active) {
    const linkDoc = doc(db, "links", linkData.id);
    
    // Delete all chat sessions
    const chatSessionsRef = collection(db, "chatSessions");
    const q = query(chatSessionsRef, where("linkId", "==", linkData.id));
    const sessionsSnapshot = await getDocs(q);
    
    const deletePromises = sessionsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    // Delete the link
    await deleteDoc(linkDoc);
    
    return true;
  }
  
  return false;
}

async function cleanupChatSessions(linkId: string) {
  // Delete associated chat sessions
  const chatSessionsRef = collection(db, "chatSessions");
  const q = query(chatSessionsRef, where("linkId", "==", linkId));
  const sessionsSnapshot = await getDocs(q);

  // Delete all chat sessions for this link
  const deletePromises = sessionsSnapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
}