#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Running performance audit...\n');

console.log('📦 Building application...');
execSync('npm run build', { stdio: 'inherit' });

console.log('\n📊 Bundle Analysis:');
const distPath = './dist';

function walk(dir) {
  const dirents = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const d of dirents) {
    const res = `${dir}/${d.name}`;
    if (d.isDirectory()) files.push(...walk(res));
    else files.push(res);
  }
  return files;
}

const files = walk(distPath);

let totalSize = 0;
const jsFiles = [];
const cssFiles = [];

for (const filePath of files) {
  const stat = fs.statSync(filePath);
  if (!stat.isFile()) continue;
  const size = stat.size;
  totalSize += size;
  if (filePath.endsWith('.js')) jsFiles.push({ name: filePath, size });
  if (filePath.endsWith('.css')) cssFiles.push({ name: filePath, size });
}

console.log(`Total bundle size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`JavaScript files: ${jsFiles.length}`);
console.log(`CSS files: ${cssFiles.length}`);

const allFiles = [...jsFiles, ...cssFiles].sort((a, b) => b.size - a.size);
console.log('\n📋 Largest files:');
for (const f of allFiles.slice(0, 5)) {
  console.log(
    `  ${f.name.replace(distPath + '/', '')}: ${(f.size / 1024).toFixed(1)} KB`
  );
}

const maxBundleSize = 2 * 1024 * 1024; // 2MB
const maxJSFileSize = 500 * 1024; // 500KB

if (totalSize > maxBundleSize) {
  console.log(
    `\n⚠️  Bundle size exceeds ${(maxBundleSize / 1024 / 1024).toFixed(1)}MB threshold`
  );
}

const largeJSFiles = jsFiles.filter((f) => f.size > maxJSFileSize);
if (largeJSFiles.length > 0) {
  console.log(`\n⚠️  Large JavaScript files detected:`);
  for (const f of largeJSFiles) {
    console.log(
      `  ${f.name.replace(distPath + '/', '')}: ${(f.size / 1024).toFixed(1)} KB`
    );
  }
}

console.log('\n✅ Performance audit complete');
