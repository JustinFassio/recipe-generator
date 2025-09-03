#!/usr/bin/env node

import { createServer } from 'http';
import { URL } from 'url';

// Vercel API base URL
const VERCEL_API_BASE = 'https://api.vercel.com';

// Get Vercel token from environment
function getVercelToken() {
  return process.env.VERCEL_TOKEN || process.env.VERCEL_ACCESS_TOKEN;
}

// Vercel API request helper
async function vercelRequest(endpoint, token) {
  const response = await fetch(`${VERCEL_API_BASE}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Vercel API error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

// Test OpenAI API connection
async function testOpenAIAPI(apiKey) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10,
      }),
    });

    return {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
    };
  } catch (error) {
    return {
      error: error.message,
      status: 'ERROR',
    };
  }
}

// Create HTTP server
const server = createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  try {
    const token = getVercelToken();
    if (!token) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Vercel token not found' }));
      return;
    }

    let result;

    switch (path) {
      case '/vercel/projects':
        const projects = await vercelRequest('/v9/projects', token);
        result = {
          success: true,
          data: projects,
          message: `Found ${projects.length} projects`,
        };
        break;

      case '/vercel/deployments':
        const deployments = await vercelRequest(
          '/v6/deployments?limit=10',
          token
        );
        result = {
          success: true,
          data: deployments,
          message: `Found ${deployments.deployments?.length || 0} deployments`,
        };
        break;

      case '/vercel/domains':
        const domains = await vercelRequest('/v5/domains', token);
        result = {
          success: true,
          data: domains,
          message: `Found ${domains.domains?.length || 0} domains`,
        };
        break;

      // New debugging endpoints for OpenAI API troubleshooting
      case '/debug/environment':
        result = {
          success: true,
          data: {
            nodeEnv: process.env.NODE_ENV,
            hasOpenAIKey: !!process.env.OPENAI_API_KEY,
            openAIKeyLength: process.env.OPENAI_API_KEY
              ? process.env.OPENAI_API_KEY.length
              : 0,
            openAIKeyPrefix: process.env.OPENAI_API_KEY
              ? process.env.OPENAI_API_KEY.substring(0, 8) + '...'
              : 'Not set',
            hasVercelToken: !!token,
            vercelTokenLength: token ? token.length : 0,
            vercelTokenPrefix: token
              ? token.substring(0, 8) + '...'
              : 'Not set',
            timestamp: new Date().toISOString(),
          },
          message: 'Environment variables check',
        };
        break;

      case '/debug/openai-test':
        const openAIKey = process.env.OPENAI_API_KEY;
        if (!openAIKey) {
          result = {
            success: false,
            error: 'OPENAI_API_KEY not found in environment',
            message:
              'Set OPENAI_API_KEY environment variable to test API connection',
          };
        } else {
          const apiTest = await testOpenAIAPI(openAIKey);
          result = {
            success: true,
            data: {
              hasKey: !!openAIKey,
              keyLength: openAIKey.length,
              keyPrefix: openAIKey.substring(0, 8) + '...',
              apiTest: apiTest,
              timestamp: new Date().toISOString(),
            },
            message: 'OpenAI API connection test',
          };
        }
        break;

      case '/debug/vercel-env':
        try {
          // Get project environment variables from Vercel
          const projects = await vercelRequest('/v9/projects', token);
          if (projects.length > 0) {
            const projectId = projects[0].id;
            const envVars = await vercelRequest(
              `/v10/projects/${projectId}/env`,
              token
            );
            result = {
              success: true,
              data: {
                projectId: projectId,
                projectName: projects[0].name,
                environmentVariables: envVars.envs.map((env) => ({
                  key: env.key,
                  value: env.value
                    ? env.value.substring(0, 8) + '...'
                    : 'Not set',
                  environment: env.target,
                  type: env.type,
                })),
                timestamp: new Date().toISOString(),
              },
              message: 'Vercel project environment variables',
            };
          } else {
            result = {
              success: false,
              error: 'No projects found',
              message: 'Cannot check environment variables without projects',
            };
          }
        } catch (error) {
          result = {
            success: false,
            error: error.message,
            message: 'Failed to fetch Vercel environment variables',
          };
        }
        break;

      // New endpoint to test environment variable access patterns
      case '/debug/env-patterns':
        result = {
          success: true,
          data: {
            // Test different ways environment variables might be accessed
            OPENAI_API_KEY: {
              direct: !!process.env.OPENAI_API_KEY,
              length: process.env.OPENAI_API_KEY
                ? process.env.OPENAI_API_KEY.length
                : 0,
              prefix: process.env.OPENAI_API_KEY
                ? process.env.OPENAI_API_KEY.substring(0, 8) + '...'
                : 'Not set',
            },
            VITE_OPENAI_API_KEY: {
              direct: !!process.env.VITE_OPENAI_API_KEY,
              length: process.env.VITE_OPENAI_API_KEY
                ? process.env.VITE_OPENAI_API_KEY.length
                : 0,
              prefix: process.env.VITE_OPENAI_API_KEY
                ? process.env.VITE_OPENAI_API_KEY.substring(0, 8) + '...'
                : 'Not set',
            },
            // Check for common variations
            OPENAI_KEY: {
              direct: !!process.env.OPENAI_KEY,
              length: process.env.OPENAI_KEY
                ? process.env.OPENAI_KEY.length
                : 0,
            },
            // Check if it's in import.meta.env (Vite)
            viteEnvCheck: {
              note: 'This server runs in Node.js, not Vite. Vite env vars are only available in the browser.',
              nodeEnv: process.env.NODE_ENV,
              isProduction: process.env.NODE_ENV === 'production',
            },
            // All environment variables (first 10)
            allEnvVars: Object.keys(process.env)
              .filter(
                (key) =>
                  key.includes('OPENAI') ||
                  key.includes('VERCEL') ||
                  key.includes('VITE')
              )
              .reduce((acc, key) => {
                acc[key] = process.env[key]
                  ? process.env[key].substring(0, 8) + '...'
                  : 'Not set';
                return acc;
              }, {}),
            timestamp: new Date().toISOString(),
          },
          message: 'Environment variable access pattern analysis',
        };
        break;

      // New endpoint to debug the exact API key issue
      case '/debug/api-key-analysis':
        const localKey = process.env.OPENAI_API_KEY;
        const viteKey = process.env.VITE_OPENAI_API_KEY;

        result = {
          success: true,
          data: {
            localEnvironment: {
              OPENAI_API_KEY: {
                exists: !!localKey,
                length: localKey ? localKey.length : 0,
                startsWithSk: localKey ? localKey.startsWith('sk-') : false,
                prefix: localKey
                  ? localKey.substring(0, 10) + '...'
                  : 'Not set',
                suffix: localKey
                  ? '...' + localKey.substring(localKey.length - 10)
                  : 'Not set',
              },
            },
            viteEnvironment: {
              VITE_OPENAI_API_KEY: {
                exists: !!viteKey,
                length: viteKey ? viteKey.length : 0,
                startsWithSk: viteKey ? viteKey.startsWith('sk-') : false,
                prefix: viteKey ? viteKey.substring(0, 10) + '...' : 'Not set',
                suffix: viteKey
                  ? '...' + viteKey.substring(viteKey.length - 10)
                  : 'Not set',
              },
            },
            analysis: {
              expectedLength: 164,
              localKeyCorrect: localKey
                ? localKey.length === 164 && localKey.startsWith('sk-')
                : false,
              viteKeyCorrect: viteKey
                ? viteKey.length === 164 && viteKey.startsWith('sk-')
                : false,
              recommendation:
                localKey && !viteKey
                  ? 'Set VITE_OPENAI_API_KEY in Vercel with the same value as OPENAI_API_KEY'
                  : 'Both keys are properly configured',
            },
            timestamp: new Date().toISOString(),
          },
          message: 'Detailed API key analysis for troubleshooting',
        };
        break;

      default:
        result = {
          success: false,
          error: 'Unknown endpoint',
          availableEndpoints: [
            '/vercel/projects',
            '/vercel/deployments',
            '/vercel/domains',
            '/debug/environment',
            '/debug/openai-test',
            '/debug/vercel-env',
            '/debug/env-patterns',
            '/debug/api-key-analysis',
          ],
        };
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result, null, 2));
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        success: false,
        error: error.message,
      })
    );
  }
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.error(`Vercel MCP HTTP Server running on port ${PORT}`);
  console.error(`Available endpoints:`);
  console.error(`  GET /vercel/projects`);
  console.error(`  GET /vercel/deployments`);
  console.error(`  GET /vercel/domains`);
  console.error(`  GET /debug/environment`);
  console.error(`  GET /debug/openai-test`);
  console.error(`  GET /debug/vercel-env`);
  console.error(`  GET /debug/env-patterns`);
  console.error(`  GET /debug/api-key-analysis`);
  console.error(`Use mcp-remote to connect Cursor to this server`);
});
