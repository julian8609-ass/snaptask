import bcrypt from 'bcryptjs';
import CredentialsProvider from 'next-auth/providers/credentials';
import GitHubProvider from 'next-auth/providers/github';
import { NextAuthOptions } from 'next-auth';
import { getSupabaseClient } from './supabase-safe';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async session({ session, token }) {
      if (session?.user) {
        const sessionUser = session.user as typeof session.user & { id?: string; role?: string };
        sessionUser.id = token.sub;
        sessionUser.role = (token as { role?: string }).role;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        (token as { role?: string }).role = (user as { role?: string }).role ?? 'user';
      }
      return token;
    },
  },
  providers: [
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const supabase = getSupabaseClient();
          const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('email', credentials.email.toLowerCase())
            .single();

          if (!user) {
            console.log('[Auth] User not found:', credentials.email.toLowerCase());
            return null;
          }

          const passwordMatches = await bcrypt.compare(credentials.password, user.password_hash);
          if (!passwordMatches) {
            console.log('[Auth] Password mismatch for user:', credentials.email.toLowerCase());
            return null;
          }

          return {
            id: user.id,
            name: user.full_name,
            email: user.email,
          };
        } catch (error) {
          console.error('[Auth] Authorization error:', error);
          return null;
        }
      },
    }),
    ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET,
          }),
        ]
      : []),
  ],
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/login',
    error: '/auth/login',
  },
};
