"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { generateUniqueLink, getUserLinks, updateLinkStatus } from "@/lib/links";
import { Copy, Flame, RefreshCw, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from 'next-themes';
import Header from '../../components/Header';
import { useAuthStore } from "@/store/auth-store";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Link {
  id: string;
  createdAt: string;
  active: boolean;
}

export default function DashboardPage() {
  const { user, loading, initialized, logout: handleLogout } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [links, setLinks] = useState<Link[]>([]);
  const [regenerating, setRegenerating] = useState<string | null>(null);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    if (initialized && !loading && !user) {
      router.replace("/");
    }
  }, [user, loading, initialized, router]);

  useEffect(() => {
    if (user?.uid) {
      fetchUserLinks();
    }
  }, [user?.uid]);

  const fetchUserLinks = async () => {
    try {
      const userLinks = await getUserLinks(user!.uid);
      setLinks(userLinks as Link[]);
    } catch (error) {
      toast({
        title: "Error fetching links",
        description: "Failed to load your links",
        variant: "destructive",
      });
    }
  };

  const handleGenerateLink = async () => {
    try {
      const newLinkId = await generateUniqueLink(user!.uid);
      await fetchUserLinks();
      toast({
        title: "Link generated!",
        description: "Your roasting link is ready to share.",
      });
    } catch (error) {
      toast({
        title: "Error generating link",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const handleRegenerateLink = async (linkId: string) => {
    try {
      setRegenerating(linkId);
      // Deactivate old link
      await updateLinkStatus(linkId, false);
      // Generate new link
      await handleGenerateLink();
    } catch (error) {
      toast({
        title: "Error regenerating link",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setRegenerating(null);
    }
  };

  const copyLink = (linkId: string) => {
    const link = `${window.location.origin}/roast/${linkId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied!",
      description: "Share it with others to get roasted.",
    });
  };

  if (!initialized) {
    return <div className="flex min-h-screen items-center justify-center">
      <div className="animate-pulse text-lg">Loading...</div>
    </div>;
  }

  return (
    <div>
      <Header 
        toggleTheme={toggleTheme} 
        isLoggedIn={!!user} 
        onLogin={() => {}}
        onLogout={async () => {
          try {
            await handleLogout();
            router.replace("/");
          } catch (error) {
            toast({
              title: "Error logging out",
              description: "Please try again later",
              variant: "destructive",
            });
          }
        }} 
      />
      <div className="container mx-auto px-4 py-6 max-w-md sm:max-w-xl md:max-w-2xl">
        <div className="flex flex-col items-center mb-8 space-y-4">
          <div className="flex items-center gap-3 bg-secondary/20 rounded-full px-4 py-2">
            <Flame className="h-7 w-7 text-destructive" />
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          </div>
          <p className="text-muted-foreground text-center text-sm max-w-xs">
            Get ready to unleash your inner roaster! This is your personalized link management hub.
          </p>
        </div>

        <div className="space-y-6">
          <Card className="p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex flex-col items-center space-y-4">
              <h2 className="text-xl font-semibold text-center">
                Hey {user?.displayName?.split(' ')[0] || 'Roaster'}! Let's get this roast party started!
              </h2>
              
              <Button 
                onClick={handleGenerateLink} 
                className="w-full max-w-xs bg-primary hover:bg-primary/90 transition-colors duration-300 group"
              >
                <Flame className="mr-2 h-5 w-5 text-white group-hover:scale-110 transition-transform" />
                Spark a New Roast
              </Button>
            </div>
          </Card>

          <Card className="p-4 shadow-sm">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-center">Your Roasting Links</h3>
              
              {links.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  <p>No links generated yet</p>
                  <p className="text-xs mt-2">Click "Spark a New Roast" to create your first link and get the roasting started!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {links.map((link) => (
                    <div 
                      key={link.id} 
                      className="bg-secondary/10 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0 sm:space-x-4"
                    >
                      <div className="flex-1 text-center sm:text-left truncate w-full sm:w-auto">
                        <p className="font-medium text-sm truncate">
                          {`${window.location.origin}/roast/${link.id}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Created: {new Date(link.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
                        <Badge
                          variant={link.active ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {link.active ? "Active" : "Inactive"}
                        </Badge>
                        
                        <div className="flex space-x-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-primary/10 transition-colors"
                                  onClick={() => copyLink(link.id)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Copy Link</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-primary/10 transition-colors"
                                  onClick={() => {
                                    const shareLink = `${window.location.origin}/roast/${link.id}`;
                                    if (navigator.share) {
                                      navigator.share({
                                        title: 'Share Your Roasting Link',
                                        text: 'Check out my roasting link!',
                                        url: shareLink
                                      }).catch(console.error);
                                    } else {
                                      copyLink(link.id);
                                      toast({
                                        title: "Link Copied",
                                        description: "Share link copied to clipboard",
                                      });
                                    }
                                  }}
                                >
                                  <Share2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Share Link</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}