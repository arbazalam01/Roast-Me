"use client";

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import Header from '../components/Header';
import Image from 'next/image';
import googleImg from '@/images/google.png';
import { useAuthStore } from '@/store/auth-store';
import { useTheme } from 'next-themes';

export default function HomePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading, initialized, login } = useAuthStore();
  const { theme, setTheme } = useTheme();



  useEffect(() => {
    if (initialized && user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, initialized, router]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleGoogleLogin = async () => {
    try {
      await login();
      toast({
        title: 'Successfully logged in!',
        description: 'Redirecting to dashboard...',
      });
    } catch (error) {
      toast({
        title: 'Error logging in',
        description: 'Please try again later',
        variant: 'destructive',
      });
    }
  };

  // Only show loading state when auth is not initialized
  if (!initialized) {
    return (
      <div className='flex items-center justify-center'>
        <div className='animate-pulse text-lg'>Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted">
      <Header
        toggleTheme={toggleTheme}
        isLoggedIn={!!user}
        onLogin={handleGoogleLogin}
        onLogout={() => { }}
      />
      <div className='flex-1 flex items-center justify-center px-4 py-8 sm:py-12'>
        <Card className='w-full max-w-[340px] sm:max-w-md md:max-w-lg shadow-lg'>
          <CardHeader className='text-center space-y-4 pb-6'>
            <div className='flex justify-center'>
              <div className='p-3 rounded-full bg-destructive/10'>
                <Flame className='h-8 w-8 sm:h-10 sm:w-10 text-destructive' />
              </div>
            </div>
            <div className='space-y-1.5'>
              <CardTitle className='text-xl sm:text-2xl font-bold'>Welcome to Roast Me (Softly)</CardTitle>
              <CardDescription className='text-sm sm:text-base'>
                Sign in to start your roasting journey
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button 
              className='w-full transition-all hover:scale-[1.02] active:scale-[0.98]' 
              size='lg' 
              onClick={handleGoogleLogin}
            >
              <Image 
                src={googleImg} 
                alt='Google Logo' 
                width={20} 
                height={20} 
                className='inline-block mr-2' 
              />
              Continue with Google
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}