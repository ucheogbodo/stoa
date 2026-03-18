// lib/prisma.ts
// ─────────────────────────────────────────────────────────────────────────────
// Singleton Prisma Client
//
// In development, Next.js hot-reloads modules frequently. Without this pattern,
// each reload would create a NEW database connection, quickly exhausting the
// Supabase connection pool (free tier allows ~20 connections).
//
// Solution: attach the client to the global object so it survives hot-reloads.
// In production, we always create a fresh client (no hot-reloading).
// ─────────────────────────────────────────────────────────────────────────────

import { PrismaClient } from "@prisma/client";

// Extend the NodeJS global type to include our prisma instance
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query"], // logs every SQL query in development — remove in production
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
