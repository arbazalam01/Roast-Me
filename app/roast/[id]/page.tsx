"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { MessageSquare, Send, User, Clock, Check, Loader2, Menu, Pencil, Sparkles } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import useRoastStore from "@/store/roast-store";
import { useAuthStore } from '@/store/auth-store';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import useThemeStore from '@/store/theme-store';
import { useTheme } from 'next-themes';
import { getLinkData } from '@/lib/links';

export default function RoastPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [localCodename, setLocalCodename] = useState('');
  const [sessionExpired, setSessionExpired] = useState(false);
  const {
    codename,
    message,
    messages,
    isJoined,
    setCodename,
    setMessage,
    setIsJoined,
    subscribeToMessages,
    sendMessage,
    users,
    joinSession,
    subscribeToUsers,
    setTypingStatus,
    creator,
  } = useRoastStore();
  const { user } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!id) return;

    const checkSessionValidity = async () => {
      try {
        const linkData = await getLinkData(id as string);
        if (!linkData) {
          setSessionExpired(true);
          return;
        }

        const unsubscribeMessages = subscribeToMessages(id as string);
        const unsubscribeUsers = subscribeToUsers(id as string);

        return () => {
          unsubscribeMessages();
          unsubscribeUsers();
        };
      } catch (error) {
        console.error("Failed to check session validity:", error);
        setSessionExpired(true);
      }
    };

    checkSessionValidity();
  }, [id, subscribeToMessages, subscribeToUsers]);

  useEffect(() => {
    if (!id) return;
    const unsubscribeMessages = subscribeToMessages(id as string);
    const unsubscribeUsers = subscribeToUsers(id as string);
    return () => {
      unsubscribeMessages();
      unsubscribeUsers();
    };
  }, [id, subscribeToMessages, subscribeToUsers]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isJoined) {
      setIsJoinModalOpen(true);
    }
  }, [isJoined]);

  useEffect(() => {
    // Clear typing status when component unmounts
    return () => {
      if (id && codename) {
        setTypingStatus(id as string, false);
      }
    };
  }, [id, codename]);

  const handleJoin = async () => {
    if (!localCodename.trim()) {
      toast({
        title: "Oops! 🤔",
        description: "Your secret identity needs a name, roaster!",
        variant: "destructive",
      });
      return;
    }

    try {
      setCodename(localCodename); // Set the global codename only when joining
      await joinSession(id as string, localCodename);
      toast({
        title: "Roast Master Activated! 🔥",
        description: `${localCodename} is ready to bring the heat!`,
      });
      setIsJoinModalOpen(false);
      setIsJoined(true);
    } catch (error) {
      toast({
        title: "Roast Blocked! 🚫",
        description: "Failed to join the roasting arena",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async () => {
    if (!id || !message.trim() || sending) return;

    try {
      setSending(true);
      await sendMessage(id as string);
      setMessage('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);

    if (!isJoined || !codename) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set typing status to true only if there's text
    if (e.target.value.trim()) {
      setTypingStatus(id as string, true);

      // Set a timeout to clear typing status after 2 seconds of no typing
      typingTimeoutRef.current = setTimeout(() => {
        setTypingStatus(id as string, false);
      }, 2000);
    } else {
      // If the input is empty, set typing status to false immediately
      setTypingStatus(id as string, false);
    }
  };

  if (sessionExpired) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Chat Session Expired</CardTitle>
            <CardDescription>
              This chat session has expired or been deleted. Please request a new link to start a new chat session.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Join Roast Session Modal */}
      <Dialog open={isJoinModalOpen} onOpenChange={setIsJoinModalOpen}>
        <DialogContent className="sm:max-w-[475px] w-[95%] max-w-[475px] rounded-lg bg-gradient-to-br from-background via-background to-primary/10 p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <DialogHeader className="text-center space-y-2">
              <DialogTitle className="text-2xl sm:text-3xl font-bold text-primary flex items-center justify-center gap-2">
                <span>🔥</span>
                <span>Roast Arena Awaits!</span>
                <span>🔥</span>
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                Get ready to unleash your inner roast master! Choose a legendary alias and prepare for a battle of wits!
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Input
                value={localCodename}
                onChange={(e) => setLocalCodename(e.target.value)}
                placeholder="Enter your legendary roast name..."
                className="w-full text-sm sm:text-lg"
              />
              <Button
                onClick={() => handleJoin()}
                className="w-full bg-primary hover:bg-primary/90 transition-all text-sm sm:text-base"
              >
                Unleash Your Roast Fury!
              </Button>
            </div>

            <div className="text-center text-xs text-muted-foreground">
              Remember, with great roast power comes great responsibility... and a whole lot of laughter! 😂
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Create Roast Link CTA */}
      <div className="fixed top-20 left-0 right-0 px-4 z-50">
        <div className="bg-primary/10 backdrop-blur-sm rounded-full px-4 py-2 flex items-center justify-center gap-3">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            Want to create your own roasting session?
          </span>
          <Button
            variant="default"
            size="sm"
            className="rounded-full"
            onClick={() => window.location.href = '/dashboard'}
          >
            Create Link
          </Button>
        </div>
      </div>

      {isJoined && (
        <div className="h-[100dvh] flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium">Roasting as {codename}</div>
                  <div className="text-xs text-muted-foreground">
                    {users.length} user{users.length > 1 ? 's' : ''} in session
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button onClick={toggleTheme} variant="ghost" size="icon" className="rounded-full">
                  <Sun className={theme === 'dark' ? 'hidden' : 'h-5 w-5'} />
                  <Moon className={theme === 'light' ? 'hidden' : 'h-5 w-5'} />
                </Button>
                <div className="flex flex-col items-center justify-center">
                  <Avatar className="w-10 h-10 mb-1">
                    <AvatarImage src={creator?.photoURL || undefined} />
                    <AvatarFallback>{creator?.displayName?.[0] || 'R'}</AvatarFallback>
                  </Avatar>
                  <div className="text-xs text-muted-foreground">
                    {creator?.displayName || 'Roast Creator'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-br from-background/50 to-primary/5">
              {messages.map((msg) => {
                const isCurrentUser = msg.codename === codename;
                const messageTime = msg.createdAt?.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                });

                // Generate distinct colors for different users
                const getMessageColor = () => {
                  if (isCurrentUser) return 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900';

                  const lightColors = [
                    'bg-blue-100 text-blue-900',
                    'bg-green-100 text-green-900',
                    'bg-purple-100 text-purple-900',
                    'bg-pink-100 text-pink-900',
                    'bg-orange-100 text-orange-900',
                    'bg-teal-100 text-teal-900',
                    'bg-cyan-100 text-cyan-900',
                    'bg-rose-100 text-rose-900'
                  ];

                  const darkColors = [
                    'dark:bg-blue-900 dark:text-blue-100',
                    'dark:bg-green-900 dark:text-green-100',
                    'dark:bg-purple-900 dark:text-purple-100',
                    'dark:bg-pink-900 dark:text-pink-100',
                    'dark:bg-orange-900 dark:text-orange-100',
                    'dark:bg-teal-900 dark:text-teal-100',
                    'dark:bg-cyan-900 dark:text-cyan-100',
                    'dark:bg-rose-900 dark:text-rose-100'
                  ];

                  const colorIndex = msg.codename.split('').reduce(
                    (acc, char) => acc + char.charCodeAt(0), 0
                  ) % lightColors.length;

                  return `${lightColors[colorIndex]} ${darkColors[colorIndex]}`;
                };

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      "flex",
                      isCurrentUser ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "flex flex-col max-w-[75%] rounded-lg px-4 py-2.5 shadow-sm",
                        getMessageColor()
                      )}
                    >
                      {!isCurrentUser && (
                        <span className="text-[11px] font-medium mb-1 opacity-80">
                          {msg.codename}
                        </span>
                      )}
                      <p className="text-sm break-words leading-relaxed">
                        {msg.content}
                      </p>
                      <div className="flex items-center gap-1.5 justify-start mt-1">
                        <span className="text-[10px] opacity-70">
                          {messageTime}
                        </span>
                        {isCurrentUser && <Check className="h-3 w-3 opacity-70" />}
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Typing Indicators */}
              <div className="flex flex-wrap gap-2 px-4">
                {users
                  .filter((u) => u.isTyping && u.codename !== codename && codename)
                  .map((user) => (
                    <motion.div
                      key={`${user.codename}-typing`}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                      >
                        <Pencil size={14} />
                      </motion.div>
                      <span>{user.codename} is typing...</span>
                    </motion.div>
                  ))}
              </div>

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t bg-background/95 backdrop-blur p-4">
              <div className="flex gap-2 items-center">
                <Input
                  placeholder="Type your message..."
                  value={message}
                  onChange={handleMessageChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={!isJoined}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || sending || !isJoined}
                  className="hover:bg-primary/90"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}