#!/usr/bin/env node

/**
 * CI Environment Validator
 * Validates environment variables against canonical schema
 */

const fs = require('fs');
const path = require('path');

// Load schema
const schemaPath = path.join(__dirname, 'env-schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

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

function validatePattern(value, pattern, varName) {
  if (!pattern) return true;
  const regex = new RegExp(pattern);
  return regex.test(value);
}

function checkClientCodeForSensitiveVars() {
  const violations = [];
  const sensitiveVars = schema.security.neverExposeToClient;

  // Check src directory for usage of sensitive variables
  const srcDir = path.join(process.cwd(), 'src');
  if (!fs.existsSync(srcDir)) {
    return violations;
  }

  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        // Skip database test directories as they are server-side tests
        if (file === 'database' || file === '__tests__') {
          continue;
        }
        scanDirectory(filePath);
      } else if (
        file.endsWith('.ts') ||
        file.endsWith('.tsx') ||
        file.endsWith('.js') ||
        file.endsWith('.jsx')
      ) {
        // Skip database test files as they are server-side tests
        if (
          filePath.includes('/database/') ||
          filePath.includes('/__tests__/database/')
        ) {
          continue;
        }

        const content = fs.readFileSync(filePath, 'utf8');

        for (const varName of sensitiveVars) {
          // Check for direct usage of the variable
          const patterns = [
            new RegExp(`\\b${varName}\\b`, 'g'),
            new RegExp(`process\\.env\\.${varName}`, 'g'),
            new RegExp(`import\\.meta\\.env\\.${varName}`, 'g'),
          ];

          for (const pattern of patterns) {
            if (pattern.test(content)) {
              violations.push({
                var: varName,
                file: path.relative(process.cwd(), filePath),
              });
              break; // Only report once per file per variable
            }
          }
        }
      }
    }
  }

  scanDirectory(srcDir);
  return violations;
}

function validateEnvironment(envVars, environment = 'production') {
  const envSchema = schema.environments[environment];
  if (!envSchema) {
    log(`❌ Unknown environment: ${environment}`, 'red');
    return false;
  }

  log(`🔍 Validating ${environment} environment variables...\n`, 'cyan');

  let hasErrors = false;
  const results = {
    required: { client: [], server: [] },
    optional: { client: [], server: [] },
    invalid: [],
    security: { violations: [] },
  };

  // Check required variables
  for (const [category, vars] of Object.entries(envSchema.required)) {
    for (const varName of vars) {
      const value = envVars[varName];
      if (!value) {
        log(`❌ Missing required ${category} variable: ${varName}`, 'red');
        results.required[category].push(varName);
        hasErrors = true;
      } else {
        // Validate pattern if defined
        const validation = schema.validation[varName];
        if (
          validation &&
          !validatePattern(value, validation.pattern, varName)
        ) {
          log(
            `⚠️  Invalid format for ${varName}: ${validation.description}`,
            'yellow'
          );
          results.invalid.push({
            var: varName,
            reason: validation.description,
          });
          hasErrors = true;
        } else {
          log(`✅ ${varName}: present`, 'green');
        }
      }
    }
  }

  // Check optional variables
  for (const [category, vars] of Object.entries(envSchema.optional)) {
    for (const varName of vars) {
      const value = envVars[varName];
      if (!value) {
        log(`⚠️  Optional ${category} variable not set: ${varName}`, 'yellow');
        results.optional[category].push(varName);
      } else {
        // Validate pattern if defined
        const validation = schema.validation[varName];
        if (
          validation &&
          !validatePattern(value, validation.pattern, varName)
        ) {
          log(
            `⚠️  Invalid format for ${varName}: ${validation.description}`,
            'yellow'
          );
          results.invalid.push({
            var: varName,
            reason: validation.description,
          });
        } else {
          log(`✅ ${varName}: present`, 'green');
        }
      }
    }
  }

  // Security validation - check for client exposure violations
  // Note: Variables in Vercel env can be server-only, so we need to check if they're actually exposed to client
  for (const varName of Object.keys(envVars)) {
    if (schema.security.neverExposeToClient.includes(varName)) {
      // Check if this variable is prefixed with VITE_ (which would expose it to client)
      if (varName.startsWith('VITE_')) {
        log(
          `🚨 CRITICAL SECURITY VIOLATION: ${varName} is prefixed with VITE_ and will be exposed to client!`,
          'red'
        );
        results.security.violations.push(varName);
        hasErrors = true;
      } else {
        // Variable exists in env but not prefixed with VITE_ - this is OK for server-side use
        log(
          `⚠️  Server-only variable present: ${varName} (ensure it's not used in client code)`,
          'yellow'
        );
      }
    }
  }

  // Special check for VITE_OPENAI_API_KEY - this should never exist
  if (envVars['VITE_OPENAI_API_KEY']) {
    log(
      `🚨 CRITICAL SECURITY VIOLATION: VITE_OPENAI_API_KEY should never be exposed to client!`,
      'red'
    );
    results.security.violations.push('VITE_OPENAI_API_KEY');
    hasErrors = true;
  }

  // Additional security check: scan client-side code for usage of sensitive variables
  const clientCodeUsage = checkClientCodeForSensitiveVars();
  if (clientCodeUsage.length > 0) {
    log(
      `\n🚨 SECURITY VIOLATION: Sensitive variables found in client code!`,
      'red'
    );
    clientCodeUsage.forEach(({ var: varName, file }) => {
      log(`  ${varName} used in ${file}`, 'red');
      results.security.violations.push(`${varName} (in ${file})`);
      hasErrors = true;
    });
  }

  // Check for unexpected variables
  const allExpectedVars = [
    ...Object.values(envSchema.required).flat(),
    ...Object.values(envSchema.optional).flat(),
  ];

  const allowedInternalVars = [
    ...(schema.security.vercelInternal || []),
    ...(schema.security.supabaseInternal || []),
    ...(schema.security.nextjsInternal || []),
    ...(schema.security.buildTools || []),
    ...(schema.security.vercelBuild || []),
  ];

  const unexpectedVars = Object.keys(envVars).filter(
    (varName) =>
      !allExpectedVars.includes(varName) &&
      !allowedInternalVars.includes(varName)
  );

  if (unexpectedVars.length > 0) {
    log(`\n⚠️  Unexpected variables found:`, 'yellow');
    unexpectedVars.forEach((varName) => {
      log(`  - ${varName}`, 'yellow');
    });
  }

  return { hasErrors, results };
}

function loadVercelEnv(environment = 'production') {
  const envFile = `.env.vercel.${environment}`;
  const envPath = path.join(process.cwd(), envFile);

  if (!fs.existsSync(envPath)) {
    log(`❌ Environment file not found: ${envFile}`, 'red');
    log(`Run: vercel env pull ${envFile} --environment=${environment}`, 'cyan');
    return null;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};

  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        // Clean up the value by removing quotes and newlines
        let value = valueParts.join('=').trim();
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        // Remove any trailing newlines or whitespace
        value = value.replace(/\\n$/, '').trim();
        envVars[key] = value;
      }
    }
  });

  // Map Next.js variables to Vite variables for validation
  const nextjsToViteMapping = {
    NEXT_PUBLIC_SUPABASE_URL: 'VITE_SUPABASE_URL',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'VITE_SUPABASE_ANON_KEY',
  };

  for (const [nextjsVar, viteVar] of Object.entries(nextjsToViteMapping)) {
    if (envVars[nextjsVar] && !envVars[viteVar]) {
      envVars[viteVar] = envVars[nextjsVar];
      log(`📝 Mapped ${nextjsVar} to ${viteVar} for validation`, 'blue');
    }
  }

  return envVars;
}

function generateReport(results, environment) {
  log(
    `\n${colors.bold}📊 Environment Validation Report${colors.reset}`,
    'cyan'
  );
  log(`Environment: ${environment}`, 'white');
  log(`Timestamp: ${new Date().toISOString()}`, 'white');

  if (
    results.required.client.length > 0 ||
    results.required.server.length > 0
  ) {
    log(`\n❌ Missing Required Variables:`, 'red');
    if (results.required.client.length > 0) {
      log(`  Client: ${results.required.client.join(', ')}`, 'red');
    }
    if (results.required.server.length > 0) {
      log(`  Server: ${results.required.server.join(', ')}`, 'red');
    }
  }

  if (results.invalid.length > 0) {
    log(`\n⚠️  Invalid Format Variables:`, 'yellow');
    results.invalid.forEach(({ var: varName, reason }) => {
      log(`  ${varName}: ${reason}`, 'yellow');
    });
  }

  if (results.security.violations.length > 0) {
    log(`\n🚨 Security Violations:`, 'red');
    results.security.violations.forEach((varName) => {
      log(`  ${varName}: Should not be exposed to client`, 'red');
    });
  }

  if (
    results.optional.client.length > 0 ||
    results.optional.server.length > 0
  ) {
    log(`\n⚠️  Optional Variables Not Set:`, 'yellow');
    if (results.optional.client.length > 0) {
      log(`  Client: ${results.optional.client.join(', ')}`, 'yellow');
    }
    if (results.optional.server.length > 0) {
      log(`  Server: ${results.optional.server.join(', ')}`, 'yellow');
    }
  }
}

function main() {
  const args = process.argv.slice(2);
  const environment = args[0] || 'production';

  log(`${colors.bold}🔧 CI Environment Validator${colors.reset}`, 'cyan');
  log(`Validating ${environment} environment...\n`, 'white');

  // Load environment variables
  const envVars = loadVercelEnv(environment);
  if (!envVars) {
    process.exit(1);
  }

  // Validate against schema
  const validation = validateEnvironment(envVars, environment);

  // Generate report
  generateReport(validation.results, environment);

  // Exit with appropriate code
  if (validation.hasErrors) {
    log(`\n❌ Environment validation failed!`, 'red');
    log(`Fix the issues above and try again.`, 'white');
    process.exit(1);
  } else {
    log(`\n✅ Environment validation passed!`, 'green');
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}

module.exports = { validateEnvironment, loadVercelEnv, generateReport };
