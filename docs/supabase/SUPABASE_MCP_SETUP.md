# Supabase MCP Server Setup Complete 🎉

I've successfully configured the Supabase MCP Server for your Recipe Generator project following the new API key approach.

## What I've Set Up

### 1. Created `.cursor/mcp.json` Configuration

The configuration includes two servers:

- **`supabase`** - Production server (uses environment variable)
- **`supabase-local`** - Local development server (uses hardcoded local key)

### 2. Local Development Server (Ready to Use)

✅ **Fully configured and ready** - uses the local service role key from your running Supabase instance:

- URL: `http://127.0.0.1:54321`
- Service Role Key: Already configured (local development key)

### 3. Production Server (Needs Your Action)

⚠️ **Requires manual setup** - needs your production service role key

## What You Need to Do

### Step 1: Get Your Production Service Role Key

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/sxvdkipywmjycithdfpp
2. Navigate to **Settings** → **API**
3. Copy the **service_role** key (not the anon key)

### Step 2: Set Environment Variable

Add this to your shell profile (`.zshrc`, `.bashrc`, etc.):

```bash
export SUPABASE_SERVICE_ROLE_KEY="your-production-service-role-key-here"
```

Or set it temporarily for testing:

```bash
export SUPABASE_SERVICE_ROLE_KEY="your-production-service-role-key-here"
```

### Step 3: Restart Cursor

After setting the environment variable, restart Cursor IDE to pick up the new MCP configuration.

## Security Considerations

### Service Role vs Anon Key Decision

I configured this to use **service role keys** because:

✅ **Advantages:**

- Full database access for schema inspection
- Can perform migrations and administrative tasks
- Ideal for development and AI assistance

⚠️ **Considerations:**

- Bypasses Row Level Security (RLS)
- Should be treated as admin access
- Perfect for AI-assisted development

### Alternative: Anon Key Setup

If you prefer read-only access with RLS protection, you can modify `.cursor/mcp.json` to use:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase@latest"],
      "env": {
        "SUPABASE_URL": "https://sxvdkipywmjycithdfpp.supabase.co",
        "SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dmRraXB5d21qeWNpdGhkZnBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MjEzMDUsImV4cCI6MjA3MTM5NzMwNX0.FyAyRGm7rmSsvhOpFBND4S-jc57NwDV0KwZaY3gD08k"
      }
    }
  }
}
```

## Testing the Setup

### Test Local Connection

```bash
# Ensure your local Supabase is running
npm run db:status

# The local server should now be accessible to Cursor MCP
```

### Test Production Connection

After setting the environment variable:

```bash
# Verify the variable is set
echo $SUPABASE_SERVICE_ROLE_KEY

# Restart Cursor to pick up the new configuration
```

## What This Enables

Once configured, Cursor will be able to:

- 🔍 **Inspect Database Schema** - View tables, columns, relationships
- 📊 **Query Data** - Run SELECT queries for analysis
- 🔄 **Migration Assistance** - Help write and review migrations
- ⚡ **Performance Analysis** - Analyze query performance
- 🛡️ **Security Review** - Check RLS policies and permissions

## Troubleshooting

### Common Issues

1. **"Connection refused"** - Ensure Supabase local is running (`npm run db:start`)
2. **"Invalid JWT"** - Double-check your service role key is correct
3. **"Permission denied"** - Verify you're using service_role key, not anon key

### Debug Commands

```bash
# Check local Supabase status
npm run db:status

# Verify environment variable
echo $SUPABASE_SERVICE_ROLE_KEY

# Test connection manually
curl -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
     -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
     "https://sxvdkipywmjycithdfpp.supabase.co/rest/v1/"
```

## Next Steps

1. Set your production service role key environment variable
2. Restart Cursor IDE
3. Try asking Cursor questions about your database schema
4. Test MCP functionality with queries like "Show me the recipes table structure"

The setup is now complete and ready for use! 🚀
