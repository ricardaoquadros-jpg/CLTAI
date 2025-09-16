import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from './Logo';
import Link from 'next/link';

interface AuthCardProps {
  children: React.ReactNode;
  title: string;
  description: string;
  footerText: string;
  footerLinkText: string;
  footerHref: string;
}

const AuthCard: React.FC<AuthCardProps> = ({ children, title, description, footerText, footerLinkText, footerHref }) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Logo />
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-headline">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            {children}
          </CardContent>
          <CardFooter>
            <p className="w-full text-center text-sm text-muted-foreground">
              {footerText}{' '}
              <Link href={footerHref} className="text-primary hover:underline">
                {footerLinkText}
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default AuthCard;
