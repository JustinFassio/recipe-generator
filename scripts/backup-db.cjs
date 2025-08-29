#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create backups directory if it doesn't exist
const backupsDir = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(backupsDir)) {
  console.log('📁 Creating backups directory...');
  fs.mkdirSync(backupsDir, { recursive: true });
}

// Generate timestamp in a cross-platform way
const now = new Date();
const timestamp = now.toISOString()
  .replace(/[:.]/g, '-')
  .replace('T', '_')
  .replace('Z', '');

const backupFile = path.join(backupsDir, `backup_${timestamp}.sql`);

console.log('💾 Creating database backup...');
console.log(`📄 Backup file: ${backupFile}`);

try {
  // Create the backup
  execSync(`npx supabase db dump --local > "${backupFile}"`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  // Verify the backup file was created and has content
  const stats = fs.statSync(backupFile);
  if (stats.size > 0) {
    console.log(`✅ Backup created successfully! (${(stats.size / 1024).toFixed(2)} KB)`);
  } else {
    console.error('❌ Backup file is empty!');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Failed to create backup:', error.message);
  process.exit(1);
}
