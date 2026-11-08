import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'dist', 'public');
const htmlSrc = path.join(root, 'client', 'index.html');
const publicSrc = path.join(root, 'client', 'public');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const name of fs.readdirSync(src)) {
      copyRecursive(path.join(src, name), path.join(dest, name));
    }
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

if (!fs.existsSync(htmlSrc)) {
  console.error('Missing client/index.html. Upload the project so package.json and client/ are at the GitHub repo ROOT (not inside another folder).');
  process.exit(1);
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
fs.copyFileSync(htmlSrc, path.join(outDir, 'index.html'));
copyRecursive(publicSrc, outDir);

console.log('Prepared static site at dist/public');
console.log('Includes:', fs.readdirSync(outDir).join(', '));
