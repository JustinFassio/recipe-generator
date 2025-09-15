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

  // Security validation
  for (const varName of Object.keys(envVars)) {
    if (schema.security.neverExposeToClient.includes(varName)) {
      log(
        `🚨 SECURITY VIOLATION: ${varName} should never be exposed to client!`,
        'red'
      );
      results.security.violations.push(varName);
      hasErrors = true;
    }
  }

  // Check for unexpected variables
  const allExpectedVars = [
    ...Object.values(envSchema.required).flat(),
    ...Object.values(envSchema.optional).flat(),
  ];

  const allowedInternalVars = [
    ...(schema.security.vercelInternal || []),
    ...(schema.security.supabaseInternal || []),
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
        envVars[key] = valueParts.join('=');
      }
    }
  });

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
