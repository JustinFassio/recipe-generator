#!/usr/bin/env node
/**
 * Configuration Test Script
 * Tests that Vite proxy configuration is properly enabled for dual server setup
 * Based on docs/development/DUAL_SERVER_SETUP.md
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function testViteConfig() {
  console.log(chalk.blue('🔍 Testing Vite Configuration...\n'));

  const viteConfigPath = path.join(process.cwd(), 'vite.config.ts');

  if (!fs.existsSync(viteConfigPath)) {
    console.log(chalk.red('❌ vite.config.ts not found'));
    return false;
  }

  const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');

  // Check if proxy is uncommented and configured
  const hasProxyConfig =
    viteConfig.includes('proxy: {') &&
    viteConfig.includes("'/api': {") &&
    viteConfig.includes("target: 'http://localhost:3000'");

  // Check if proxy is not commented out
  const isProxyCommented =
    viteConfig.includes('// proxy: {') || viteConfig.includes('//   proxy: {');

  if (hasProxyConfig && !isProxyCommented) {
    console.log(chalk.green('✅ Vite proxy configuration: Enabled'));
    console.log(
      chalk.blue('   API requests will be proxied to http://localhost:3000')
    );
    return true;
  } else {
    console.log(
      chalk.red('❌ Vite proxy configuration: Disabled or misconfigured')
    );
    if (isProxyCommented) {
      console.log(chalk.yellow('   Proxy configuration is commented out'));
    }
    console.log(
      chalk.yellow(
        '   Please uncomment the proxy configuration in vite.config.ts'
      )
    );
    return false;
  }
}

function testPackageJsonScripts() {
  console.log(chalk.blue('\n🔍 Testing Package.json Scripts...\n'));

  const packageJsonPath = path.join(process.cwd(), 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    console.log(chalk.red('❌ package.json not found'));
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const scripts = packageJson.scripts || {};

  const requiredScripts = ['validate:dev', 'test:config', 'test:integration'];

  let allScriptsPresent = true;

  for (const script of requiredScripts) {
    if (scripts[script]) {
      console.log(chalk.green(`✅ Script "${script}": Present`));
    } else {
      console.log(chalk.red(`❌ Script "${script}": Missing`));
      allScriptsPresent = false;
    }
  }

  return allScriptsPresent;
}

function runConfigTests() {
  const viteConfigValid = testViteConfig();
  const scriptsValid = testPackageJsonScripts();

  if (viteConfigValid && scriptsValid) {
    console.log(chalk.green('\n🎉 Configuration tests passed!'));
    console.log(chalk.blue('Dual server setup is properly configured.'));
    process.exit(0);
  } else {
    console.log(chalk.red('\n❌ Configuration tests failed.'));
    console.log(chalk.yellow('Please fix the issues above and run again.'));
    process.exit(1);
  }
}

// Run if called directly
runConfigTests();

export { testViteConfig, testPackageJsonScripts };
