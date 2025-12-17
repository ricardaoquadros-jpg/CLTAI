'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface AuthProviderProps {
    children: ReactNode;
}

/**
 * AuthProvider wraps the application with NextAuth SessionProvider.
 * This enables useSession hook throughout the app.
 */
export function AuthProvider({ children }: AuthProviderProps) {
    return <SessionProvider>{children}</SessionProvider>;
}
