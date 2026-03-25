const cp = require('child_process');
const fs = require('fs');
try {
  const result = cp.execSync('npx prisma generate', { encoding: 'utf-8', stdio: 'pipe' });
  fs.writeFileSync('output.txt', result);
  console.log('Success');
} catch (e) {
  fs.writeFileSync('output.txt', (e.stdout || '') + '\n\nSTDERR:\n\n' + (e.stderr || '') + '\n\nMSG:\n' + e.message);
  console.log('Failed, captured to output.txt');
}
