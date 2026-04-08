// app/garden/vestibule/page.tsx
// The Vestibule — a private archive of reconsidered ideas (Vestiges).
// Ideas you chose to set aside or reconsider are not deleted; they rest here.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { VestibuleClient } from "./VestibuleClient";

export const metadata = {
  title: "The Vestibule — Stoa Garden",
  description: "Ideas you chose to reconsider. They are not gone — they are archived here.",
};

export default async function VestibulePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const userId = (session.user as { id: string }).id;

  const vestiges = await prisma.vestige.findMany({
    where: { userId },
    orderBy: { reconsideredAt: "desc" },
  });

  return <VestibuleClient vestiges={vestiges} />;
}
