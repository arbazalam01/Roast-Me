"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Check, X, Loader2, User, Share2 } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useUsernameStore } from "@/store/username-store";
import { cn } from "@/lib/utils";

interface UsernameSetupProps {
  onUsernameCreated?: () => void;
}

export default function UsernameSetup({ onUsernameCreated }: UsernameSetupProps) {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const {
    usernameInput,
    isSubmitting,
    setUsernameInput,
    checkAvailability,
    createUserUsername
  } = useUsernameStore();

  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [showHelper, setShowHelper] = useState(false);

  useEffect(() => {
    const checkUsernameAvailability = async () => {
      if (!usernameInput || usernameInput.length < 3) {
        setIsAvailable(null);
        return;
      }

      setIsChecking(true);
      try {
        const available = await checkAvailability(usernameInput);
        setIsAvailable(available);
      } catch (error) {
        console.error("Error checking availability:", error);
        setIsAvailable(false);
      } finally {
        setIsChecking(false);
      }
    };

    const timeoutId = setTimeout(checkUsernameAvailability, 500);
    return () => clearTimeout(timeoutId);
  }, [usernameInput, checkAvailability]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !usernameInput || !isAvailable) {
      return;
    }

    try {
      await createUserUsername({
        userId: user.uid,
        username: usernameInput,
        displayName: user.displayName || 'Anonymous User',
        photoURL: user.photoURL || ''
      });

      toast({
        title: "Username created! 🎉",
        description: `Your public page is now available at /u/${usernameInput}`,
      });

      onUsernameCreated?.();
    } catch (error) {
      toast({
        title: "Error creating username",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    }
  };

  const getInputStatus = () => {
    if (!usernameInput || usernameInput.length < 3) return 'default';
    if (isChecking) return 'checking';
    if (isAvailable === true) return 'available';
    if (isAvailable === false) return 'unavailable';
    return 'default';
  };

  const getStatusIcon = () => {
    const status = getInputStatus();
    switch (status) {
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
      case 'available':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'unavailable':
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const isValidFormat = (username: string) => {
    return /^[a-zA-Z0-9_-]+$/.test(username);
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="p-3 rounded-full bg-primary/10">
            <User className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="space-y-1.5">
          <CardTitle className="text-xl font-bold">Create Your Username</CardTitle>
          <CardDescription className="text-sm">
            Choose a unique username for your public roast page
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <Input
                id="username"
                type="text"
                placeholder="your-awesome-username"
                value={usernameInput}
                onChange={(e) => {
                  const value = e.target.value.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '');
                  setUsernameInput(value);
                }}
                onFocus={() => setShowHelper(true)}
                onBlur={() => setShowHelper(false)}
                className={cn(
                  "pr-10 transition-colors",
                  getInputStatus() === 'available' && "border-green-500 focus-visible:ring-green-500",
                  getInputStatus() === 'unavailable' && "border-red-500 focus-visible:ring-red-500"
                )}
                maxLength={20}
                disabled={isSubmitting}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {getStatusIcon()}
              </div>
            </div>
            
            {/* Validation Messages */}
            {usernameInput && (
              <div className="text-xs space-y-1">
                {usernameInput.length < 3 && (
                  <p className="text-red-600">Username must be at least 3 characters</p>
                )}
                {usernameInput.length >= 3 && !isValidFormat(usernameInput) && (
                  <p className="text-red-600">Only letters, numbers, hyphens, and underscores allowed</p>
                )}
                {isAvailable === false && isValidFormat(usernameInput) && usernameInput.length >= 3 && (
                  <p className="text-red-600">Username is already taken</p>
                )}
                {isAvailable === true && (
                  <p className="text-green-600">Username is available!</p>
                )}
              </div>
            )}
            
            {/* Helper Text */}
            {(showHelper || usernameInput) && (
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Your public page will be: <span className="font-mono">/u/{usernameInput || 'username'}</span></p>
                <p>• 3-20 characters • Letters, numbers, - and _ only</p>
              </div>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={!isAvailable || isSubmitting || isChecking}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Username...
              </>
            ) : (
              <>
                <Share2 className="mr-2 h-4 w-4" />
                Create My Public Page
              </>
            )}
          </Button>
        </form>

        {/* Benefits */}
        <div className="bg-muted/30 rounded-lg p-3 space-y-2">
          <h4 className="text-sm font-medium">What you'll get:</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• A shareable public page for anonymous messages</li>
            <li>• Messages limited to 30 words for quality content</li>
            <li>• Built-in spam protection and moderation</li>
            <li>• Real-time message updates</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}