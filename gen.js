const fs = require('fs');
const cp = require('child_process');

console.log('Loading .env manually...');
const envFile = fs.readFileSync('.env', 'utf-8');
const lines = envFile.split('\n');
const env = { ...process.env };
for (const line of lines) {
  if (line.trim().startsWith('DATABASE_URL=')) {
    let val = line.trim().substring('DATABASE_URL='.length);
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1);
    }
    env.DATABASE_URL = val;
  }
}

console.log('Running npx prisma generate with env:', !!env.DATABASE_URL);
try {
  const result = cp.execSync('npx prisma generate', { env, stdio: 'inherit' });
} catch (e) {
  process.exit(1);
}
