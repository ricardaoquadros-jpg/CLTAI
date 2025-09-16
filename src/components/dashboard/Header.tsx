'use client';
import React from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const Header = () => {
  const router = useRouter();
  const [, setFinancialData] = useLocalStorage('financialData', null);
  const [, setExpenses] = useLocalStorage('expenses', []);
  const [, setUserName] = useLocalStorage('userName', null);

  const handleLogoClick = () => {
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleLogoClick}>
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
              CLT AI
            </h1>
          </div>
          <Link href="/login" passHref>
            <Button variant="outline">Login</Button>
          </Link>
        </div>
    </header>
  );
};

export default Header;
