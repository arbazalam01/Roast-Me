"use client";

import { create } from "zustand";
import { 
  checkUsernameAvailability, 
  createUsername, 
  getUserUsername, 
  getUsernameByUsername,
  createAnonymousMessage,
  getUserMessages,
  subscribeToUserMessages,
  checkRateLimit,
  reportMessage,
  type Username, 
  type AnonymousMessage,
  type CreateUsernameData,
  type CreateMessageData
} from "@/lib/usernames";

interface UsernameState {
  // Current user's username data
  currentUsername: Username | null;
  currentUsernameLoading: boolean;
  
  // Public page data
  publicUsername: Username | null;
  publicMessages: AnonymousMessage[];
  publicMessagesLoading: boolean;
  
  // Form states
  usernameInput: string;
  messageInput: string;
  isSubmitting: boolean;
  
  // Actions
  setUsernameInput: (username: string) => void;
  setMessageInput: (message: string) => void;
  checkAvailability: (username: string) => Promise<boolean>;
  createUserUsername: (data: CreateUsernameData) => Promise<void>;
  loadCurrentUsername: (userId: string) => Promise<void>;
  loadPublicPage: (username: string) => Promise<void>;
  subscribeToPublicMessages: (usernameId: string) => () => void;
  submitAnonymousMessage: (data: CreateMessageData) => Promise<void>;
  reportPublicMessage: (messageId: string) => Promise<void>;
  reset: () => void;
}

export const useUsernameStore = create<UsernameState>((set, get) => ({
  // Initial state
  currentUsername: null,
  currentUsernameLoading: false,
  publicUsername: null,
  publicMessages: [],
  publicMessagesLoading: false,
  usernameInput: '',
  messageInput: '',
  isSubmitting: false,
  
  // Actions
  setUsernameInput: (username) => set({ usernameInput: username }),
  
  setMessageInput: (message) => set({ messageInput: message }),
  
  checkAvailability: async (username) => {
    try {
      return await checkUsernameAvailability(username);
    } catch (error) {
      console.error("Error checking username availability:", error);
      return false;
    }
  },
  
  createUserUsername: async (data) => {
    try {
      set({ isSubmitting: true });
      const usernameId = await createUsername(data);
      
      // Load the created username
      await get().loadCurrentUsername(data.userId);
      
      set({ usernameInput: '' });
    } catch (error) {
      console.error("Error creating username:", error);
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },
  
  loadCurrentUsername: async (userId) => {
    try {
      set({ currentUsernameLoading: true });
      const username = await getUserUsername(userId);
      set({ currentUsername: username });
    } catch (error) {
      console.error("Error loading current username:", error);
      set({ currentUsername: null });
    } finally {
      set({ currentUsernameLoading: false });
    }
  },
  
  loadPublicPage: async (username) => {
    try {
      set({ publicMessagesLoading: true, publicUsername: null, publicMessages: [] });
      
      const usernameData = await getUsernameByUsername(username);
      if (!usernameData) {
        set({ publicUsername: null, publicMessages: [] });
        return;
      }
      
      set({ publicUsername: usernameData });
      
      // Load messages
      const messages = await getUserMessages(usernameData.id);
      set({ publicMessages: messages });
    } catch (error) {
      console.error("Error loading public page:", error);
      set({ publicUsername: null, publicMessages: [] });
    } finally {
      set({ publicMessagesLoading: false });
    }
  },
  
  subscribeToPublicMessages: (usernameId) => {
    const unsubscribe = subscribeToUserMessages(usernameId, (messages) => {
      set({ publicMessages: messages });
    });
    
    return unsubscribe;
  },
  
  submitAnonymousMessage: async (data) => {
    try {
      set({ isSubmitting: true });
      
      // Check rate limit first
      if (data.ipHash) {
        const canSubmit = await checkRateLimit(data.ipHash);
        if (!canSubmit) {
          throw new Error("Rate limit exceeded. Please wait before sending another message.");
        }
      }
      
      await createAnonymousMessage(data);
      set({ messageInput: '' });
    } catch (error) {
      console.error("Error submitting message:", error);
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },
  
  reportPublicMessage: async (messageId) => {
    try {
      await reportMessage(messageId);
      
      // Update the local state to reflect the report
      const { publicMessages } = get();
      const updatedMessages = publicMessages.map(msg => 
        msg.id === messageId 
          ? { ...msg, reported: true, reportCount: (msg.reportCount || 0) + 1 }
          : msg
      );
      set({ publicMessages: updatedMessages });
    } catch (error) {
      console.error("Error reporting message:", error);
      throw error;
    }
  },
  
  reset: () => set({
    currentUsername: null,
    currentUsernameLoading: false,
    publicUsername: null,
    publicMessages: [],
    publicMessagesLoading: false,
    usernameInput: '',
    messageInput: '',
    isSubmitting: false,
  })
}));