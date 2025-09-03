// pages/api/auth/[...nextauth].js
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import clientPromise from '../../../lib/mongodb';
import { compare } from 'bcryptjs';

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise),

  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email:    { label: 'Email',    type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Basic guard
        if (!credentials?.email || !credentials?.password) return null;

        const client = await clientPromise;
        const users  = client.db().collection('users');

        // Normalize email
        const email = String(credentials.email).trim().toLowerCase();

        const user = await users.findOne({ email });
        if (!user) return null;

        const isValid = await compare(credentials.password, user.password);
        if (!isValid) return null;

        // Only return serializable, minimal shape
        return {
          id:    user._id.toString(),
          name:  user.name ?? '',
          email: user.email ?? email,
          role:  user.role || 'user',
          // Persist subscription status in token to avoid extra DB calls later
          isSubscribed: Boolean(user.isSubscribed) || (user.role === 'admin'),
        };
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  pages: {
    signIn: '/login',
  },

  session: {
    strategy: 'jwt',
    // (optional) adjust token lifetime if you want:
    // maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    /**
     * Persist extra fields into the JWT at sign-in,
     * and keep them on subsequent calls.
     */
    async jwt({ token, user }) {
      if (user) {
        token.id           = user.id;
        token.name         = user.name ?? '';
        token.email        = user.email ?? '';
        token.role         = user.role || 'user';
        token.isSubscribed = Boolean(user.isSubscribed) || (user.role === 'admin');
      }

      // Ensure these keys always exist and are serializable
      token.id           = token.id ?? null;
      token.name         = token.name ?? '';
      token.email        = token.email ?? '';
      token.role         = token.role ?? 'user';
      token.isSubscribed = Boolean(token.isSubscribed);

      return token;
    },

    /**
     * Shape the session the client receives.
     * Keep it lean and fully serializable to avoid hydration issues.
     */
    async session({ session, token }) {
      session.user = {
        id:           token.id ?? null,
        name:         token.name ?? '',
        email:        token.email ?? '',
        image:        session?.user?.image ?? null, // keep null instead of undefined
        role:         token.role ?? 'user',
        isSubscribed: Boolean(token.isSubscribed),
      };
      return session;
    },

    /**
     * (Optional) Control post-sign-in redirects if needed.
     * Returning `url` unchanged preserves NextAuth’s default behavior.
     */
    async redirect({ url, baseUrl }) {
      // Allow relative URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allow same-origin URLs
      if (new URL(url).origin === baseUrl) return url;
      // Fallback to baseUrl for external
      return baseUrl;
    },
  },
};

export default NextAuth(authOptions);
