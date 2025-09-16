#!/usr/bin/env node

/**
 * Production Fix Script
 * Fixes production deployment issues by forcing a clean rebuild and deploy
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

function cleanBuild() {
  log('\n🧹 Cleaning build artifacts...', 'cyan');

  const dirsToClean = ['dist', 'node_modules/.vite', '.vercel/cache'];

  for (const dir of dirsToClean) {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
      try {
        fs.rmSync(fullPath, { recursive: true, force: true });
        log(`✅ Cleaned ${dir}`, 'green');
      } catch (error) {
        log(`⚠️  Could not clean ${dir}: ${error.message}`, 'yellow');
      }
    }
  }
}

function verifyBuild() {
  log('\n🔍 Verifying build...', 'cyan');

  const distPath = path.join(process.cwd(), 'dist');
  if (!fs.existsSync(distPath)) {
    throw new Error('Build failed - no dist folder created');
  }

  const indexPath = path.join(distPath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    throw new Error('Build failed - no index.html created');
  }

  const html = fs.readFileSync(indexPath, 'utf8');

  // Extract asset URLs
  const jsMatch = html.match(/src="([^"]*\.js)"/);
  const cssMatch = html.match(/href="([^"]*\.css)"/);

  if (!jsMatch || !cssMatch) {
    throw new Error('Build failed - no asset references found in HTML');
  }

  const jsPath = path.join(distPath, jsMatch[1]);
  const cssPath = path.join(distPath, cssMatch[1]);

  if (!fs.existsSync(jsPath)) {
    throw new Error(`Build failed - JS asset missing: ${jsMatch[1]}`);
  }

  if (!fs.existsSync(cssPath)) {
    throw new Error(`Build failed - CSS asset missing: ${cssMatch[1]}`);
  }

  const jsStats = fs.statSync(jsPath);
  const cssStats = fs.statSync(cssPath);

  log(`✅ Build verified:`, 'green');
  log(`   HTML: ${fs.statSync(indexPath).size} bytes`, 'white');
  log(`   JS: ${jsMatch[1]} (${jsStats.size} bytes)`, 'white');
  log(`   CSS: ${cssMatch[1]} (${cssStats.size} bytes)`, 'white');

  return { js: jsMatch[1], css: cssMatch[1] };
}

async function main() {
  log(`${colors.bold}🔧 Production Fix Script${colors.reset}`, 'cyan');
  log(
    'This script will clean, rebuild, and redeploy to fix production issues.\n',
    'white'
  );

  try {
    // Step 1: Clean everything
    cleanBuild();

    // Step 2: Install dependencies
    runCommand('npm ci', 'Installing dependencies');

    // Step 3: Build the project
    runCommand('npm run build', 'Building project');

    // Step 4: Verify build
    const assets = verifyBuild();

    // Step 5: Deploy to production
    runCommand('vercel --prod --force', 'Deploying to production');

    log('\n🎉 Production fix completed!', 'green');
    log('The production site should now be working correctly.', 'white');
    log('\nNext steps:', 'cyan');
    log('1. Wait 2-3 minutes for CDN propagation', 'white');
    log('2. Test the production site', 'white');
    log('3. Run: node scripts/diagnose-production.js', 'white');
  } catch (error) {
    log('\n❌ Production fix failed!', 'red');
    log(`Error: ${error.message}`, 'red');
    log('\nTroubleshooting steps:', 'cyan');
    log('1. Check your internet connection', 'white');
    log('2. Verify Vercel CLI is installed: npm install -g vercel', 'white');
    log('3. Check Vercel authentication: vercel whoami', 'white');
    log('4. Check for build errors in the output above', 'white');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { cleanBuild, verifyBuild };
