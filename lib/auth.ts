// lib/auth.ts
// ─────────────────────────────────────────────────────────────────────────────
// Shared NextAuth configuration
//
// We export `authOptions` from here rather than defining it only inside the
// API route so that any server component or API route can call
// `getServerSession(authOptions)` to get the current signed-in user.
// ─────────────────────────────────────────────────────────────────────────────

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  // Use JWT strategy — no database session table needed for Phase 1
  session: {
    strategy: "jwt",
  },

  // Where NextAuth will redirect for sign-in
  pages: {
    signIn: "/login",
  },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      // This function is called when the user submits the login form.
      // Return the user object on success, or null to signal failure.
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Look up the user in the database
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) return null;

        // Compare the submitted password with the stored bcrypt hash
        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!passwordMatch) return null;

        // Return a minimal user object — this gets encoded into the JWT
        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],

  callbacks: {
    // Attach the user's database ID to the JWT token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    // Expose the ID on the client-side session object
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
  },
};
