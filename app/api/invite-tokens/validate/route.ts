// app/api/invite-tokens/validate/route.ts
// Invite token system was removed in favour of open registration.
import { NextResponse } from "next/server";
export async function GET() { return NextResponse.json({ error: "Invite tokens are no longer used." }, { status: 410 }); }

export const dynamic = "force-dynamic";
