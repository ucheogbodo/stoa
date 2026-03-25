// app/garden/admin/flagged/page.tsx
// Admin review panel — lists all ideas under REVIEW or FLAGGED and allows the admin to act on them.
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AdminFlaggedClient from "./client";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@stoa.local";

export default async function AdminFlaggedPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if ((session.user as { email: string }).email !== ADMIN_EMAIL) redirect("/garden");

  const flaggedIdeas = await prisma.idea.findMany({
    where: { verificationStatus: { in: ["REVIEW", "FLAGGED"] } },
    orderBy: { updatedAt: "desc" },
    include: {
      user: { select: { email: true, name: true } },
      verificationEvents: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-ink">Flagged Ideas</h1>
        <p className="text-ink-muted text-sm mt-1">
          Ideas under review for copyright or originality concerns.
        </p>
      </div>

      {flaggedIdeas.length === 0 ? (
        <p className="text-ink-muted py-10 text-center">No flagged ideas. The garden is clean.</p>
      ) : (
        <AdminFlaggedClient ideas={flaggedIdeas} />
      )}
    </div>
  );
}
