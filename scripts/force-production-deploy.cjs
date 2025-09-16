#!/usr/bin/env node

/**
 * Force Production Deploy Script
 * Forces a complete production deployment with cache busting
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n🔄 ${description}...`, 'cyan');
  log(`   Command: ${command}`, 'white');

  try {
    const output = execSync(command, {
      stdio: 'pipe',
      encoding: 'utf8',
      cwd: process.cwd(),
    });

    log(`✅ ${description} completed`, 'green');
    if (output.trim()) {
      log(`   Output: ${output.trim()}`, 'white');
    }
    return output;
  } catch (error) {
    log(`❌ ${description} failed`, 'red');
    log(`   Error: ${error.message}`, 'red');
    if (error.stdout) {
      log(`   Stdout: ${error.stdout}`, 'yellow');
    }
    if (error.stderr) {
      log(`   Stderr: ${error.stderr}`, 'yellow');
    }
    throw error;
  }
}

function createCacheBuster() {
  log('\n🔄 Creating cache buster...', 'cyan');

  // Create a simple cache buster file
  const cacheBuster = `// Cache buster - ${new Date().toISOString()}\nconsole.log('Cache busted at ${new Date().toISOString()}');\n`;

  const cacheBusterPath = path.join(process.cwd(), 'src', 'cache-buster.js');
  fs.writeFileSync(cacheBusterPath, cacheBuster);

  log(`✅ Cache buster created: ${cacheBusterPath}`, 'green');

  return cacheBusterPath;
}

function removeCacheBuster() {
  log('\n🧹 Removing cache buster...', 'cyan');

  const cacheBusterPath = path.join(process.cwd(), 'src', 'cache-buster.js');
  if (fs.existsSync(cacheBusterPath)) {
    fs.unlinkSync(cacheBusterPath);
    log(`✅ Cache buster removed: ${cacheBusterPath}`, 'green');
  }
}

function updateVercelConfig() {
  log('\n🔄 Updating Vercel config for cache busting...', 'cyan');

  const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
  const cacheBustingConfig = {
    headers: [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ],
    functions: {
      'api/**/*.ts': {
        runtime: 'nodejs20.x',
      },
    },
  };

  fs.writeFileSync(
    vercelConfigPath,
    JSON.stringify(cacheBustingConfig, null, 2)
  );
  log(`✅ Vercel config updated for cache busting`, 'green');
}

async function main() {
  log(`${colors.bold}🚀 Force Production Deploy Script${colors.reset}`, 'cyan');
  log(
    'This script will force a complete production deployment with cache busting.\n',
    'white'
  );

  try {
    // Step 1: Create cache buster
    const cacheBusterPath = createCacheBuster();

    // Step 2: Update Vercel config
    updateVercelConfig();

    // Step 3: Clean build
    log('\n🧹 Cleaning build artifacts...', 'cyan');
    runCommand(
      'rm -rf dist node_modules/.vite .vercel/cache',
      'Cleaning build artifacts'
    );

    // Step 4: Install dependencies
    runCommand('npm ci', 'Installing dependencies');

    // Step 5: Build with cache buster
    runCommand('npm run build', 'Building with cache buster');

    // Step 6: Verify build
    const distPath = path.join(process.cwd(), 'dist');
    if (!fs.existsSync(distPath)) {
      throw new Error('Build failed - no dist folder created');
    }

    const indexPath = path.join(distPath, 'index.html');
    if (!fs.existsSync(indexPath)) {
      throw new Error('Build failed - no index.html created');
    }

    log(`✅ Build verified - ${fs.statSync(indexPath).size} bytes`, 'green');

    // Step 7: Force deploy to production
    runCommand(
      'vercel --prod --force --no-cache',
      'Force deploying to production'
    );

    // Step 8: Clean up cache buster
    removeCacheBuster();

    log('\n🎉 Force deployment completed!', 'green');
    log(
      'The production site should now be working with fresh assets.',
      'white'
    );
    log('\nNext steps:', 'cyan');
    log('1. Wait 3-5 minutes for CDN propagation', 'white');
    log('2. Test the production site', 'white');
    log('3. Run: node scripts/diagnose-production.js', 'white');
    log(
      '4. If still broken, check Vercel dashboard for deployment logs',
      'white'
    );
  } catch (error) {
    log('\n❌ Force deployment failed!', 'red');
    log(`Error: ${error.message}`, 'red');

    // Clean up cache buster on failure
    removeCacheBuster();

    log('\nTroubleshooting steps:', 'cyan');
    log('1. Check Vercel CLI: vercel --version', 'white');
    log('2. Check authentication: vercel whoami', 'white');
    log('3. Check project link: vercel link', 'white');
    log('4. Check build logs in Vercel dashboard', 'white');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { createCacheBuster, removeCacheBuster, updateVercelConfig };
