"use client";

import { create } from "zustand";
import { db } from "@/lib/firebase";
import { 
    addDoc, 
    collection, 
    onSnapshot, 
    orderBy, 
    query, 
    serverTimestamp, 
    doc, 
    setDoc, 
    deleteDoc,
    getDoc
} from "firebase/firestore";
import { getLinkData } from "@/lib/links";
import type { LinkData } from "@/lib/links";

interface UserInSession {
    codename: string;
    joinedAt: Date;
    isTyping?: boolean;
}

interface CreatorInfo {
    displayName: string;
    photoURL: string;
}

interface RoastState {
    codename: string;
    message: string;
    messages: Array<{ id: string; codename: string; content: string; createdAt: Date; }>;
    users: UserInSession[];
    isJoined: boolean;
    creator: CreatorInfo | null;
    setCodename: (codename: string) => void;
    setMessage: (message: string) => void;
    setMessages: (messages: Array<{ id: string; codename: string; content: string; createdAt: Date; }>) => void;
    setUsers: (users: UserInSession[]) => void;
    setIsJoined: (isJoined: boolean) => void;
    setCreator: (creator: CreatorInfo | null) => void;
    subscribeToMessages: (id: string) => () => void;
    subscribeToUsers: (id: string) => () => void;
    sendMessage: (id: string) => Promise<void>;
    joinSession: (id: string, codename: string) => Promise<void>;
    leaveSession: (id: string) => Promise<void>;
    setTypingStatus: (id: string, isTyping: boolean) => Promise<void>;
}

const useRoastStore = create<RoastState>((set, get) => ({
    codename: '',
    message: '',
    messages: [],
    users: [],
    isJoined: false,
    creator: null,
    setCodename: (codename) => set({ codename }),
    setMessage: (message) => set({ message }),
    setMessages: (messages) => set({ messages }),
    setUsers: (users) => set({ users }),
    setIsJoined: (isJoined) => set({ isJoined }),
    setCreator: (creator) => set({ creator }),
    subscribeToMessages: (id) => {
        const messagesRef = collection(db, "roastSessions", id, "messages");
        const q = query(messagesRef, orderBy("createdAt", "asc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newMessages = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
            })) as Array<{ id: string; codename: string; content: string; createdAt: Date; }>;
            set({ messages: newMessages });
        });

        return unsubscribe;
    },
    subscribeToUsers: (id) => {
        const unsubscribe = onSnapshot(collection(db, `roastSessions/${id}/users`), async (snapshot) => {
            const users = snapshot.docs.map(doc => ({
                ...doc.data(),
                joinedAt: doc.data().joinedAt?.toDate(),
            })) as UserInSession[];
            set({ users });

            // Get creator info from link data
            try {
                const linkData = await getLinkData(id);
                if (linkData) {
                    set({ 
                        creator: {
                            displayName: linkData.displayName,
                            photoURL: linkData.photoURL
                        }
                    });
                }
            } catch (error) {
                console.error("Failed to fetch creator info:", error);
            }
        });
        return unsubscribe;
    },
    sendMessage: async (id) => {
        const state = get();
        if (!state.message.trim() || !id) return;

        try {
            const messagesRef = collection(db, "roastSessions", id, "messages");
            await addDoc(messagesRef, {
                content: state.message,
                codename: state.codename,
                createdAt: serverTimestamp(),
                votes: 0,
            });

            set({ message: "" });
        } catch (error) {
            console.error("Failed to send message:", error);
            throw error;
        }
    },
    joinSession: async (id, codename) => {
        try {
            const userRef = doc(db, "roastSessions", id, "users", codename);
            await setDoc(userRef, {
                codename,
                joinedAt: serverTimestamp(),
                isTyping: false
            });

            set({ 
                codename, 
                isJoined: true 
            });
        } catch (error) {
            console.error("Failed to join session:", error);
            throw error;
        }
    },
    leaveSession: async (id) => {
        const state = get();
        if (!state.codename) return;

        try {
            const userRef = doc(db, "roastSessions", id, "users", state.codename);
            await deleteDoc(userRef);

            set({ 
                codename: '', 
                isJoined: false 
            });
        } catch (error) {
            console.error("Failed to leave session:", error);
            throw error;
        }
    },
    setTypingStatus: async (id: string, isTyping: boolean) => {
        const { codename } = get();
        if (!codename) return;
        
        const userRef = doc(db, `roastSessions/${id}/users/${codename}`);
        await setDoc(userRef, { isTyping }, { merge: true });
    },
}));

export default useRoastStore;
