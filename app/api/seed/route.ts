import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const email = "admin@stoa.local";
    const password = "changeme123";
    const name = "Admin";
    
    const passwordHash = await bcrypt.hash(password, 12);
    
    const user = await prisma.user.upsert({
      where: { email },
      update: { passwordHash },
      create: { email, name, passwordHash },
    });
    
    return NextResponse.json({ success: true, userId: user.id });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
