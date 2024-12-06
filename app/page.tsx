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

export default function HomePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading, initialized, login } = useAuthStore();

  useEffect(() => {
    if (initialized && user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, initialized, router]);

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
      <div className='flex min-h-screen items-center justify-center'>
        <div className='animate-pulse text-lg'>Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <Header 
        toggleTheme={() => {}} 
        isLoggedIn={!!user} 
        onLogin={handleGoogleLogin}
        onLogout={() => {}}
      />
      <div className='flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted p-4'>
        <Card className='w-full max-w-md md:max-w-lg lg:max-w-xl'>
          <CardHeader className='text-center flex flex-col'>
            <div className='flex justify-center mb-4'>
              <Flame className='h-12 w-12 text-destructive' />
            </div>
            <CardTitle className='text-2xl'>Welcome to Roast Me (Softly)</CardTitle>
            <CardDescription>
              Sign in to start your roasting journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className='w-full' size='lg' onClick={handleGoogleLogin}>
              <Image src={googleImg} alt='Google Logo' width={20} height={20} className='inline-block mr-2' />
              Continue with Google
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}