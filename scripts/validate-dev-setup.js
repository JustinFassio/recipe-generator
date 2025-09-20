#!/usr/bin/env node

/**
 * Development Setup Validation Script
 *
 * This script validates that the development environment is properly configured
 * to prevent API proxy issues and other common setup problems.
 *
 * Usage: node scripts/validate-dev-setup.js
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const CHECKS = {
  VITE_CONFIG: 'Vite configuration',
  ENV_FILES: 'Environment files',
  API_PROXY: 'API proxy configuration',
  DEPENDENCIES: 'Required dependencies',
};

let passed = 0;
let failed = 0;

function logCheck(check, status, message = '') {
  const icon = status ? '✅' : '❌';
  console.log(`${icon} ${check}: ${message}`);
  if (status) passed++;
  else failed++;
}

function validateViteConfig() {
  try {
    const configPath = join(process.cwd(), 'vite.config.ts');
    if (!existsSync(configPath)) {
      logCheck(CHECKS.VITE_CONFIG, false, 'vite.config.ts not found');
      return;
    }

    const content = readFileSync(configPath, 'utf-8');

    // Check proxy is not commented out
    if (
      content.includes('// proxy:') ||
      content.match(/\/\*[\s\S]*proxy:[\s\S]*\*\//)
    ) {
      logCheck(
        CHECKS.API_PROXY,
        false,
        'API proxy is commented out - this will break local development'
      );
      return;
    }

    // Check proxy exists and targets correct port
    if (
      !content.includes('proxy:') ||
      !content.includes('http://localhost:3000')
    ) {
      logCheck(
        CHECKS.API_PROXY,
        false,
        'API proxy not configured or targeting wrong port'
      );
      return;
    }

    logCheck(CHECKS.VITE_CONFIG, true, 'Configuration looks good');
    logCheck(CHECKS.API_PROXY, true, 'Proxy configured correctly');
  } catch (error) {
    logCheck(
      CHECKS.VITE_CONFIG,
      false,
      `Error reading config: ${error.message}`
    );
  }
}

function validateEnvironmentFiles() {
  const envLocal = existsSync('.env.local');
  const env = existsSync('.env');

  if (!envLocal && !env) {
    logCheck(CHECKS.ENV_FILES, false, 'No environment files found');
    return;
  }

  if (envLocal) {
    try {
      const content = readFileSync('.env.local', 'utf-8');
      const hasOpenAI =
        content.includes('OPENAI_API_KEY=') &&
        !content.includes('OPENAI_API_KEY=""') &&
        !content.includes('your_openai_api_key_here');

      const hasSupabase =
        content.includes('VITE_SUPABASE_URL=') &&
        content.includes('VITE_SUPABASE_ANON_KEY=');

      if (hasOpenAI && hasSupabase) {
        logCheck(
          CHECKS.ENV_FILES,
          true,
          '.env.local configured with required keys'
        );
      } else {
        logCheck(
          CHECKS.ENV_FILES,
          false,
          '.env.local missing required API keys'
        );
      }
    } catch (error) {
      logCheck(
        CHECKS.ENV_FILES,
        false,
        `Error reading .env.local: ${error.message}`
      );
    }
  } else {
    logCheck(CHECKS.ENV_FILES, true, '.env file exists');
  }
}

function validateDependencies() {
  try {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
    const hasVite =
      packageJson.devDependencies?.vite || packageJson.dependencies?.vite;
    const hasVercel =
      packageJson.devDependencies?.vercel || packageJson.dependencies?.vercel;

    if (hasVite) {
      logCheck(CHECKS.DEPENDENCIES, true, 'Vite is installed');
    } else {
      logCheck(CHECKS.DEPENDENCIES, false, 'Vite is not installed');
    }
  } catch (error) {
    logCheck(
      CHECKS.DEPENDENCIES,
      false,
      `Error checking dependencies: ${error.message}`
    );
  }
}

async function checkServerHealth() {
  console.log('\n🏥 Checking server health...');

  const servers = [
    { name: 'Vite Dev Server', url: 'http://localhost:5174', port: 5174 },
    { name: 'Vercel Dev Server', url: 'http://localhost:3000', port: 3000 },
  ];

  for (const server of servers) {
    try {
      const response = await fetch(server.url, {
        signal: AbortSignal.timeout(2000),
      });
      console.log(`✅ ${server.name}: Running (HTTP ${response.status})`);
    } catch (error) {
      console.log(`❌ ${server.name}: Not running`);
      console.log(
        `   Start with: ${server.port === 5174 ? 'npm run dev' : 'npx vercel dev --listen 3000'}`
      );
    }
  }
}

// Main validation
console.log('🔍 Validating development setup...\n');

validateViteConfig();
validateEnvironmentFiles();
validateDependencies();

await checkServerHealth();

console.log(`\n📊 Validation Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.log(
    '\n⚠️  Issues found! Please fix the above problems before continuing development.'
  );
  console.log('\n📚 Common fixes:');
  console.log('   - Uncomment API proxy in vite.config.ts');
  console.log('   - Create .env.local with required API keys');
  console.log('   - Start both development servers');
  process.exit(1);
} else {
  console.log('\n🎉 Development setup looks good!');
  process.exit(0);
}
