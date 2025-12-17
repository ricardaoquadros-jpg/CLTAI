import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';

/**
 * NextAuth.js Configuration
 * 
 * Why OAuth 2.0 / Google Login?
 * - Industry standard for secure authentication
 * - One-click login experience (no passwords to remember)
 * - User data is managed by a trusted provider
 * - Easy to add more providers (GitHub, LinkedIn, etc.)
 * 
 * Flow:
 * 1. User clicks "Login with Google"
 * 2. Redirected to Google consent screen
 * 3. User authorizes the app
 * 4. Google returns user info and tokens to NextAuth
 * 5. NextAuth creates/updates user in database
 * 6. Session is established for authenticated user
 */
export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma) as any,
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    session: {
        strategy: 'database',
    },
    callbacks: {
        async session({ session, user }) {
            // Add user id to session for API authorization
            if (session.user) {
                session.user.id = user.id;
            }
            return session;
        },
    },
    pages: {
        signIn: '/', // Custom sign-in page
        error: '/',  // Error page
    },
    debug: process.env.NODE_ENV === 'development',
};
