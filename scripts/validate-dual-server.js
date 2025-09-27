#!/usr/bin/env node
/**
 * Dual Server Development Setup Validator
 * Validates that both Vite (port 5174) and Vercel (port 3000) servers are running
 * Based on docs/development/DUAL_SERVER_SETUP.md
 */

import http from 'http';
import chalk from 'chalk';

const SERVERS = {
  vite: { port: 5174, name: 'Vite Frontend Server', command: 'npm run dev' },
  vercel: {
    port: 3000,
    name: 'Vercel API Server',
    command: 'vercel dev --listen 3000',
  },
};

async function checkServer(server) {
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: server.port,
        method: 'GET',
        timeout: 2000,
      },
      (res) => {
        resolve({ ...server, running: true });
      }
    );

    req.on('error', () => {
      resolve({ ...server, running: false });
    });

    req.on('timeout', () => {
      resolve({ ...server, running: false });
    });

    req.end();
  });
}

async function validateDualServer() {
  console.log(chalk.blue('🔍 Validating Dual Server Setup...\n'));

  const results = await Promise.all([
    checkServer(SERVERS.vite),
    checkServer(SERVERS.vercel),
  ]);

  let allRunning = true;

  for (const result of results) {
    if (result.running) {
      console.log(
        chalk.green(`✅ ${result.name} (port ${result.port}): Running`)
      );
    } else {
      console.log(
        chalk.red(`❌ ${result.name} (port ${result.port}): Not Running`)
      );
      console.log(chalk.yellow(`   Start with: ${result.command}\n`));
      allRunning = false;
    }
  }

  if (allRunning) {
    console.log(
      chalk.green('\n🎉 Dual Server Setup is correctly configured and running!')
    );
    console.log(chalk.blue('Frontend: http://localhost:5174'));
    console.log(chalk.blue('API: http://localhost:3000'));
    process.exit(0);
  } else {
    console.log(chalk.red('\n❌ Dual Server Setup is incomplete.'));
    console.log(chalk.yellow('Please start both servers as shown above.'));
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  validateDualServer();
}

export { validateDualServer, checkServer };
