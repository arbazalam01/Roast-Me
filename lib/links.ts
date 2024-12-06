import { db } from "./firebase";
import { collection, doc, setDoc, getDoc, query, where, getDocs } from "firebase/firestore";
import { nanoid } from "nanoid";

export async function generateUniqueLink(userId: string) {
  const shortId = nanoid(8);
  const linksRef = collection(db, "links");
  const linkDoc = doc(linksRef, shortId);

  await setDoc(linkDoc, {
    userId,
    createdAt: new Date().toISOString(),
    active: true
  });

  return shortId;
}

export async function getLinkData(linkId: string) {
  const linkDoc = doc(db, "links", linkId);
  const linkSnap = await getDoc(linkDoc);
  
  if (!linkSnap.exists()) {
    return null;
  }
  
  return {
    id: linkSnap.id,
    ...linkSnap.data()
  };
}

export async function getUserLinks(userId: string) {
  const linksRef = collection(db, "links");
  const q = query(linksRef, where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

export async function updateLinkStatus(linkId: string, active: boolean) {
  const linkDoc = doc(db, "links", linkId);
  await setDoc(linkDoc, { active }, { merge: true });
}