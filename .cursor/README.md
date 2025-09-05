# Cursor MCP Configuration

This directory contains the Model Context Protocol (MCP) configuration for Cursor IDE integration with Supabase.

## Configuration

The `mcp.json` file is configured with two Supabase servers:

1. **supabase** - Production server
2. **supabase-local** - Local development server

## Environment Variables Required

For the production server to work, you need to set:

```bash
export SUPABASE_SERVICE_ROLE_KEY="your-production-service-role-key"
```

The local server uses the hardcoded local development service role key.

## Security Notes

- The production configuration uses environment variables to avoid hardcoding sensitive keys
- The local development key is safe to hardcode as it only works with local Supabase instances
- Service role keys bypass RLS - use with caution in production contexts

## Usage

Once configured, Cursor will have access to:

- Database schema inspection
- Query execution
- Migration management
- Real-time data access

The MCP server will respect the same permissions as your configured service role.
