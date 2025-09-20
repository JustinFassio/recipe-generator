import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Vite Configuration Validation Tests
 *
 * These tests ensure critical development configuration is maintained:
 * 1. API proxy is enabled for local development
 * 2. Proxy targets the correct Vercel dev server port
 * 3. Essential server configuration is present
 */
describe('Vite Configuration Validation', () => {
  const viteConfigPath = join(process.cwd(), 'vite.config.ts');
  const viteConfigContent = readFileSync(viteConfigPath, 'utf-8');

  it('should have API proxy configuration enabled', () => {
    // Check that proxy configuration is NOT commented out
    expect(viteConfigContent).not.toMatch(/\/\/ proxy:/);
    expect(viteConfigContent).not.toMatch(/\/\*[\s\S]*proxy:[\s\S]*\*\//);

    // Check that proxy configuration exists and is active
    expect(viteConfigContent).toMatch(/proxy:\s*{/);
    expect(viteConfigContent).toContain("'/api':");
  });

  it('should proxy API calls to correct Vercel dev server port', () => {
    // Ensure API proxy targets port 3000 (Vercel dev default)
    expect(viteConfigContent).toContain('http://localhost:3000');
    expect(viteConfigContent).toMatch(
      /target:\s*['"`]http:\/\/localhost:3000['"`]/
    );
  });

  it('should have changeOrigin enabled for proxy', () => {
    // Ensure proper CORS handling
    expect(viteConfigContent).toMatch(/changeOrigin:\s*true/);
  });

  it('should have error handling for proxy', () => {
    // Ensure proxy has error handling to prevent HMR breakage
    expect(viteConfigContent).toContain("proxy.on('error'");
    expect(viteConfigContent).toContain('console.warn');
  });

  it('should be configured for port 5174', () => {
    // Ensure consistent port configuration
    expect(viteConfigContent).toMatch(/port:\s*5174/);
  });

  it('should not have proxy configuration entirely commented out', () => {
    // Prevent the specific issue that caused the API breakage
    const commentedOutProxyPattern = /\/\/\s*proxy:\s*{[\s\S]*?\/\/\s*}/;
    const blockCommentedProxyPattern = /\/\*[\s\S]*proxy:\s*{[\s\S]*?\*\//;

    expect(viteConfigContent).not.toMatch(commentedOutProxyPattern);
    expect(viteConfigContent).not.toMatch(blockCommentedProxyPattern);
  });
});

/**
 * Development Setup Validation
 *
 * These tests validate that the development environment is properly configured
 */
describe('Development Environment Setup', () => {
  it('should have necessary environment files', () => {
    // Check that .env.local exists (created during setup)
    const envLocalExists = existsSync('.env.local');
    expect(envLocalExists).toBe(true);
  });

  it('should have OpenAI model configured', () => {
    // Validate that OpenAI model environment variable is set
    // The API key is server-side only and not exposed to client tests for security
    const hasOpenAIModel = 'VITE_OPENAI_MODEL' in process.env;
    expect(hasOpenAIModel).toBe(true);
  });

  it('should have Supabase configuration', () => {
    // Validate Supabase environment variables exist without accessing values
    const hasSupabaseUrl = 'VITE_SUPABASE_URL' in process.env;
    const hasSupabaseKey = 'VITE_SUPABASE_ANON_KEY' in process.env;

    expect(hasSupabaseUrl).toBe(true);
    expect(hasSupabaseKey).toBe(true);
  });
});
