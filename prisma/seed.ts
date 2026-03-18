// prisma/seed.ts
// ─────────────────────────────────────────────────────────────────────────────
// Database seed script — creates the initial admin user.
//
// Run with: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
// Or after adding to package.json scripts: npm run db:seed
//
// The admin email and password are read from environment variables so you
// never commit credentials to source control.
// ─────────────────────────────────────────────────────────────────────────────

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@stoa.local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "changeme123";
  const name = process.env.SEED_ADMIN_NAME ?? "Admin";

  console.log(`Seeding admin user: ${email}`);

  // Hash the password with bcrypt (12 rounds is a good balance of security/speed)
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash }, // update the hash if the user already exists
    create: { email, name, passwordHash },
  });

  console.log(`✓ Admin user ready: ${user.email} (id: ${user.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
