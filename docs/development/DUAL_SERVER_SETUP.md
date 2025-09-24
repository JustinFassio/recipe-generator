# Dual Server Development Setup

This project requires **two development servers** running simultaneously for full functionality:

## Required Servers

### 1. Vite Dev Server (Port 5174)

**Purpose**: Frontend React application with HMR  
**Command**: `npm run dev`  
**URL**: http://localhost:5174

### 2. Vercel Dev Server (Port 3000)

**Purpose**: API routes and serverless functions  
**Command**: `npx vercel dev --listen 3000`  
**URL**: http://localhost:3000

## How It Works

```
Frontend (5174) → API Proxy → Vercel Dev (3000) → API Functions
```

- **Vite** serves the React app and proxies `/api/*` requests to Vercel
- **Vercel Dev** runs the serverless functions locally
- **API Proxy** in `vite.config.ts` connects them seamlessly

## Quick Start

```bash
# Terminal 1: Start frontend
npm run dev

# Terminal 2: Start API server
npx vercel dev --listen 3000
```

## Validation

Check your setup is working:

```bash
# Validate configuration
npm run validate:dev

# Test configuration
npm run test:config

# Test API integration (requires servers running)
npm run test:integration
```

## Common Issues

### ❌ API calls return 404

**Cause**: Vite proxy is commented out or misconfigured  
**Fix**: Ensure `vite.config.ts` has active proxy configuration:

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
}
```

### ❌ "Connection refused" errors

**Cause**: Vercel dev server not running  
**Fix**: Start Vercel dev server: `npx vercel dev --listen 3000`

### ❌ API returns 500 errors

**Cause**: Missing environment variables  
**Fix**: Ensure `.env.local` has required keys:

- `OPENAI_API_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Environment Files

The project uses multiple environment files:

- **`.env`**: Production Supabase configuration
- **`.env.local`**: Local development overrides (local Supabase + API keys)
- **`.env.production`**: Production overrides

Priority: `.env.local` > `.env.production` > `.env`

## Testing

### Configuration Tests

```bash
npm run test:config
```

Validates Vite configuration and proxy setup.

### Integration Tests

```bash
npm run test:integration
```

Tests API endpoints are reachable (requires servers running).

### Development Validation

```bash
npm run validate:dev
```

Comprehensive setup validation with helpful error messages.

## CI/CD Considerations

- Configuration tests run automatically in CI
- Integration tests are skipped in CI unless `RUN_API_INTEGRATION_TESTS=true`
- Validation script can be used in CI for setup verification

## Troubleshooting

### Debug Server Health

The validation script shows server status:

```bash
npm run validate:dev
```

### Check Proxy Configuration

Look for these patterns in `vite.config.ts`:

- ✅ `proxy: {` (active)
- ❌ `// proxy: {` (commented out)
- ❌ `/* proxy: { ... */` (block commented)

### Verify API Endpoints

Test API directly:

```bash
# Through proxy (should work)
curl http://localhost:5174/api/ai/chat

# Direct to Vercel (should work)
curl http://localhost:3000/api/ai/chat
```

## Why This Setup?

This dual-server approach provides:

- ✅ **Fast HMR**: Vite's instant hot module replacement
- ✅ **Real API**: Actual serverless functions, not mocks
- ✅ **Production Parity**: Same API code runs locally and in production
- ✅ **Environment Isolation**: Local and production databases separate
- ✅ **Easy Debugging**: Full stack runs locally with source maps

## Alternative Setups

### Single Vercel Dev Server

```bash
npx vercel dev --listen 5174
```

**Pros**: One server, simpler  
**Cons**: Slower HMR, potential CSP issues

### Production API

Update `.env.local` to use production Supabase URLs.  
**Pros**: No local API server needed  
**Cons**: Slower, affects production data, requires internet
