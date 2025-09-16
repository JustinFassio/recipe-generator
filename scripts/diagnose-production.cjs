#!/usr/bin/env node

/**
 * Production Diagnosis Script
 * Diagnoses why the production site is showing a blank page
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const PRODUCTION_URL = 'https://www.recipegenerator.app';

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

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

function extractAssetUrls(html) {
  const jsMatch = html.match(/src="([^"]*\.js)"/);
  const cssMatch = html.match(/href="([^"]*\.css)"/);

  return {
    js: jsMatch ? jsMatch[1] : null,
    css: cssMatch ? cssMatch[1] : null,
  };
}

async function checkLocalBuild() {
  log('\n🔍 Checking local build...', 'cyan');

  const distPath = path.join(process.cwd(), 'dist');
  if (!fs.existsSync(distPath)) {
    log('❌ No dist folder found. Run "npm run build" first.', 'red');
    return null;
  }

  const indexPath = path.join(distPath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    log('❌ No index.html found in dist folder.', 'red');
    return null;
  }

  const html = fs.readFileSync(indexPath, 'utf8');
  const assets = extractAssetUrls(html);

  log(`✅ Local HTML found`, 'green');
  log(`   JS: ${assets.js}`, 'white');
  log(`   CSS: ${assets.css}`, 'white');

  // Check if assets exist locally
  if (assets.js) {
    const jsPath = path.join(distPath, assets.js);
    if (fs.existsSync(jsPath)) {
      const stats = fs.statSync(jsPath);
      log(`✅ Local JS exists (${stats.size} bytes)`, 'green');
    } else {
      log(`❌ Local JS missing: ${jsPath}`, 'red');
    }
  }

  if (assets.css) {
    const cssPath = path.join(distPath, assets.css);
    if (fs.existsSync(cssPath)) {
      const stats = fs.statSync(cssPath);
      log(`✅ Local CSS exists (${stats.size} bytes)`, 'green');
    } else {
      log(`❌ Local CSS missing: ${cssPath}`, 'red');
    }
  }

  return { html, assets };
}

async function checkProduction() {
  log('\n🌐 Checking production site...', 'cyan');

  try {
    const response = await makeRequest(PRODUCTION_URL);

    if (response.statusCode !== 200) {
      log(`❌ Production returned status ${response.statusCode}`, 'red');
      return null;
    }

    log(`✅ Production HTML loaded (${response.body.length} bytes)`, 'green');

    const assets = extractAssetUrls(response.body);
    log(`   JS: ${assets.js}`, 'white');
    log(`   CSS: ${assets.css}`, 'white');

    // Check if assets exist on production
    if (assets.js) {
      try {
        const jsResponse = await makeRequest(PRODUCTION_URL + assets.js);
        if (jsResponse.statusCode === 200) {
          log(
            `✅ Production JS exists (${jsResponse.body.length} bytes)`,
            'green'
          );
        } else {
          log(`❌ Production JS missing (${jsResponse.statusCode})`, 'red');
        }
      } catch (err) {
        log(`❌ Production JS error: ${err.message}`, 'red');
      }
    }

    if (assets.css) {
      try {
        const cssResponse = await makeRequest(PRODUCTION_URL + assets.css);
        if (cssResponse.statusCode === 200) {
          log(
            `✅ Production CSS exists (${cssResponse.body.length} bytes)`,
            'green'
          );
        } else {
          log(`❌ Production CSS missing (${cssResponse.statusCode})`, 'red');
        }
      } catch (err) {
        log(`❌ Production CSS error: ${err.message}`, 'red');
      }
    }

    return { html: response.body, assets };
  } catch (err) {
    log(`❌ Production error: ${err.message}`, 'red');
    return null;
  }
}

async function compareBuilds(local, production) {
  log('\n🔍 Comparing local vs production...', 'cyan');

  if (!local || !production) {
    log('❌ Cannot compare - missing local or production data', 'red');
    return;
  }

  if (local.assets.js === production.assets.js) {
    log(`✅ JS assets match: ${local.assets.js}`, 'green');
  } else {
    log(`❌ JS assets differ:`, 'red');
    log(`   Local: ${local.assets.js}`, 'yellow');
    log(`   Production: ${production.assets.js}`, 'yellow');
  }

  if (local.assets.css === production.assets.css) {
    log(`✅ CSS assets match: ${local.assets.css}`, 'green');
  } else {
    log(`❌ CSS assets differ:`, 'red');
    log(`   Local: ${local.assets.css}`, 'yellow');
    log(`   Production: ${production.assets.css}`, 'yellow');
  }
}

async function main() {
  log(`${colors.bold}🔧 Production Diagnosis Script${colors.reset}`, 'cyan');
  log(`Checking: ${PRODUCTION_URL}\n`, 'white');

  const local = await checkLocalBuild();
  const production = await checkProduction();

  await compareBuilds(local, production);

  log('\n📋 Summary:', 'cyan');
  if (local && production) {
    if (
      local.assets.js === production.assets.js &&
      local.assets.css === production.assets.css
    ) {
      log('✅ Assets match - deployment issue may be resolved', 'green');
    } else {
      log('❌ Assets differ - deployment not working correctly', 'red');
      log('   Run: node scripts/fix-production.js', 'yellow');
    }
  } else {
    log('❌ Diagnosis incomplete - check errors above', 'red');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkLocalBuild, checkProduction, compareBuilds };
