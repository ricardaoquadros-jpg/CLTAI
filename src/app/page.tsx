'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, useUser } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25C22.56 11.45 22.49 10.68 22.36 9.92H12V14.45H18.02C17.74 15.93 16.92 17.22 15.63 18.09V20.6H19.36C21.43 18.73 22.56 15.75 22.56 12.25Z" fill="#4285F4"/>
    <path d="M12 23C15.02 23 17.58 21.99 19.36 20.6L15.63 18.09C14.65 18.73 13.42 19.12 12 19.12C9.09 19.12 6.61 17.14 5.76 14.59H2V17.1C3.78 20.58 7.56 23 12 23Z" fill="#34A853"/>
    <path d="M5.76 14.59C5.58 14.07 5.48 13.53 5.48 13C5.48 12.47 5.58 11.93 5.76 11.41V8.91H2C1.2 10.22 0.76 11.56 0.76 13C0.76 14.44 1.2 15.78 2 17.1L5.76 14.59Z" fill="#FBBC05"/>
    -   <path d="M12 6.88C13.56 6.88 14.88 7.42 15.9 8.35L19.43 4.92C17.58 3.14 15.02 2 12 2C7.56 2 3.78 4.42 2 7.9L5.76 10.41C6.61 7.86 9.09 6.88 12 6.88Z" fill="#EA4335"/>
  </svg>
);


export default function Home() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/dashboard');
    } catch (error) {
      console.error('Error signing in with Google', error);
      // Handle error, maybe show a toast to the user
    }
  };

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8 text-primary"
          >
            <line x1="12" x2="12" y1="2" y2="22" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          <h1 className="text-3xl font-bold text-foreground font-headline">
            CLT AI
          </h1>
        </div>
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-headline">Bem-vindo(a)!</CardTitle>
            <CardDescription>Faça login com sua conta do Google para continuar.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSignIn} className="w-full">
              <GoogleIcon />
              Entrar com o Google
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}