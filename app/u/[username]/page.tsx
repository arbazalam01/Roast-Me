"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Send, Heart, Flag, Copy, Clock, Loader2 } from "lucide-react";
import { useUsernameStore } from "@/store/username-store";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { moderateContent, suggestPositiveAlternatives } from "@/lib/moderation";

// Simple hash function for IP-like identifier (client-side only for demo)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

export default function PublicUsernamePage() {
  const { username } = useParams();
  const { toast } = useToast();
  const {
    publicUsername,
    publicMessages,
    publicMessagesLoading,
    messageInput,
    isSubmitting,
    setMessageInput,
    loadPublicPage,
    subscribeToPublicMessages,
    submitAnonymousMessage,
    reportPublicMessage,
    reset
  } = useUsernameStore();

  const [wordCount, setWordCount] = useState(0);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);
  const [contentValidation, setContentValidation] = useState<{
    isValid: boolean;
    message?: string;
    suggestions?: string[];
  }>({ isValid: true });
  const [userSessionId] = useState(() => {
    // Generate a simple session identifier for rate limiting
    const randomId = Math.random().toString(36).substring(2);
    return simpleHash(randomId + Date.now().toString());
  });

  useEffect(() => {
    if (username && typeof username === 'string') {
      loadPublicPage(username);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      reset();
    };
  }, [username, loadPublicPage, reset]);

  useEffect(() => {
    if (publicUsername?.id) {
      const unsub = subscribeToPublicMessages(publicUsername.id);
      setUnsubscribe(() => unsub);
      
      return () => unsub();
    }
  }, [publicUsername?.id, subscribeToPublicMessages]);

  useEffect(() => {
    const words = messageInput.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    
    // Real-time content validation
    if (messageInput.trim()) {
      const moderationResult = moderateContent(messageInput);
      if (!moderationResult.isAllowed) {
        setContentValidation({
          isValid: false,
          message: moderationResult.reason,
          suggestions: suggestPositiveAlternatives()
        });
      } else {
        setContentValidation({ isValid: true });
      }
    } else {
      setContentValidation({ isValid: true });
    }
  }, [messageInput]);

  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!publicUsername || !messageInput.trim()) return;
    
    if (wordCount > 30) {
      toast({
        title: "Message too long",
        description: "Please keep your message to 30 words or less.",
        variant: "destructive",
      });
      return;
    }

    if (!contentValidation.isValid) {
      toast({
        title: "Message not allowed",
        description: contentValidation.message || "Please revise your message.",
        variant: "destructive",
      });
      return;
    }

    try {
      await submitAnonymousMessage({
        usernameId: publicUsername.id,
        content: messageInput.trim(),
        ipHash: userSessionId
      });

      toast({
        title: "Message sent! 🎉",
        description: "Your anonymous message has been posted.",
      });
    } catch (error) {
      toast({
        title: "Error sending message",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    }
  };

  const handleReportMessage = async (messageId: string) => {
    try {
      await reportPublicMessage(messageId);
      toast({
        title: "Message reported",
        description: "Thank you for helping keep this space safe.",
      });
    } catch (error) {
      toast({
        title: "Error reporting message",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const copyPageLink = () => {
    const link = `${window.location.origin}/u/${username}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied!",
      description: "Share this link to get anonymous messages.",
    });
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (publicMessagesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading page...</p>
        </div>
      </div>
    );
  }

  if (!publicUsername) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">User Not Found</CardTitle>
            <CardDescription>
              The username "{username}" doesn't exist or isn't active.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => window.location.href = '/'}>
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16 border-2 border-primary/20">
                <AvatarImage src={publicUsername.photoURL} />
                <AvatarFallback className="text-xl font-semibold">
                  {publicUsername.displayName[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">{publicUsername.displayName}</h1>
                <p className="text-muted-foreground">@{publicUsername.username}</p>
                <Badge variant="secondary" className="text-xs">
                  {publicMessages.length} message{publicMessages.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={copyPageLink}>
              <Copy className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        {/* Message Form */}
        <Card className="sticky top-4 shadow-lg z-10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Send Anonymous Message
            </CardTitle>
            <CardDescription>
              Share your thoughts anonymously. Keep it to 30 words or less.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitMessage} className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  placeholder="Write your message here..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className={cn(
                    "min-h-[100px] resize-none transition-colors",
                    !contentValidation.isValid && messageInput.trim() && "border-red-500 focus-visible:ring-red-500"
                  )}
                  disabled={isSubmitting}
                />
                
                {/* Validation feedback */}
                {!contentValidation.isValid && messageInput.trim() && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
                    <p className="text-sm text-red-600">
                      {contentValidation.message}
                    </p>
                    {contentValidation.suggestions && contentValidation.suggestions.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs text-red-500">Try using positive words like:</p>
                        <div className="flex flex-wrap gap-1">
                          {contentValidation.suggestions.map((suggestion, index) => (
                            <Badge key={index} variant="outline" className="text-xs cursor-pointer"
                              onClick={() => setMessageInput(`${messageInput} ${suggestion}`)}>
                              {suggestion}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center space-x-2">
                    <span className={cn(
                      "text-muted-foreground",
                      wordCount > 30 && "text-red-500"
                    )}>
                      {wordCount}/30 words
                    </span>
                    {contentValidation.isValid && messageInput.trim() && (
                      <Badge variant="secondary" className="text-xs">
                        ✓ Looks good
                      </Badge>
                    )}
                  </div>
                  <Button
                    type="submit"
                    disabled={!messageInput.trim() || wordCount > 30 || !contentValidation.isValid || isSubmitting}
                    size="sm"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Send Message
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Messages */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messages
          </h2>
          
          {publicMessages.length === 0 ? (
            <Card className="p-8 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No messages yet</h3>
              <p className="text-muted-foreground">
                Be the first to send an anonymous message to {publicUsername.displayName}!
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {publicMessages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="p-4 hover:shadow-md transition-shadow">
                    <div className="space-y-3">
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTimeAgo(message.createdAt.toDate())}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReportMessage(message.id)}
                          className="text-muted-foreground hover:text-red-500"
                        >
                          <Flag className="h-3 w-3 mr-1" />
                          Report
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-xs text-muted-foreground">
            Want your own anonymous message page?{" "}
            <a href="/" className="underline hover:text-primary">
              Create your account
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}