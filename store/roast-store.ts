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

interface UserInSession {
    codename: string;
    joinedAt: Date;
}

interface RoastState {
    codename: string;
    message: string;
    messages: Array<{ id: string; codename: string; content: string; createdAt: Date; }>;
    users: UserInSession[];
    isJoined: boolean;
    setCodename: (codename: string) => void;
    setMessage: (message: string) => void;
    setMessages: (messages: Array<{ id: string; codename: string; content: string; createdAt: Date; }>) => void;
    setUsers: (users: UserInSession[]) => void;
    setIsJoined: (isJoined: boolean) => void;
    subscribeToMessages: (id: string) => () => void;
    subscribeToUsers: (id: string) => () => void;
    sendMessage: (id: string) => Promise<void>;
    joinSession: (id: string, codename: string) => Promise<void>;
    leaveSession: (id: string) => Promise<void>;
}

const useRoastStore = create<RoastState>((set, get) => ({
    codename: '',
    message: '',
    messages: [],
    users: [],
    isJoined: false,
    setCodename: (codename) => set({ codename }),
    setMessage: (message) => set({ message }),
    setMessages: (messages) => set({ messages }),
    setUsers: (users) => set({ users }),
    setIsJoined: (isJoined) => set({ isJoined }),
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
        const usersRef = collection(db, "roastSessions", id, "users");

        const unsubscribe = onSnapshot(usersRef, (snapshot) => {
            const newUsers = snapshot.docs.map((doc) => ({
                codename: doc.id,
                joinedAt: doc.data().joinedAt?.toDate(),
            })) as UserInSession[];
            set({ users: newUsers });
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
                joinedAt: serverTimestamp(),
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
}));

export default useRoastStore;
