'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Header = () => {
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = () => {
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-10 w-full bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
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
                className="h-6 w-6 text-primary"
              >
                <line x1="12" x2="12" y1="2" y2="22" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            <h1 className="text-xl font-bold text-foreground font-headline">
              Financial Glimpse
            </h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
    </header>
  );
};

export default Header;
