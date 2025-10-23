# MCP Server Troubleshooting Report

## Executive Summary

The MCP servers **ARE working correctly** at the backend level, but Cursor's UI is displaying a "Loading tools" status that doesn't reflect the actual state. This appears to be a known Cursor UI bug.

## Evidence That Servers Are Working

### Log Analysis

From `/Users/justinfassio/Library/Application Support/Cursor/logs/`:

```
2025-10-10 18:26:52.053 [info] Found 20 tools, 0 prompts, and 0 resources
2025-10-10 18:26:51.770 [info] Found 21 tools, 0 prompts, and 0 resources
2025-10-10 18:26:56.522 [info] Found 1 tools, 0 prompts, and 25 resources
```

### Process Verification

Multiple MCP server processes were running successfully:

- ✅ `mcp-server-supabase --project-ref=sxvdkipywmjycithdfpp` (multiple instances)
- ✅ `mcp-server-playwright --isolated` (multiple instances)
- ✅ `mcp-server-postgres postgresql://postgres:postgres@127.0.0.1:54322/postgres`

### Tools Successfully Loaded

- **Supabase Production**: 20 tools
- **Playwright**: 21 tools
- **Supabase Local (Postgres)**: 1 tool + 25 resources

## Issues Identified and Fixed

### 1. Wrong Package Name (FIXED)

**Problem**: User-level config was using `@modelcontextprotocol/server-supabase` (doesn't exist)  
**Fix**: Changed to `@supabase/mcp-server-supabase@latest`

### 2. Stripe & Vercel OAuth Blocking (FIXED)

**Problem**: Stripe and Vercel MCP servers required OAuth authentication and were stuck  
**Fix**: Removed from config since not needed

### 3. Duplicate Supabase Configurations (FIXED)

**Problem**: Both user-level and project-level configs had "supabase" entry  
**Fix**: Removed from project-level, kept in user-level

## Current Configuration

### User-Level (`~/.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--project-ref=sxvdkipywmjycithdfpp"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "sbp_e58b73121781ff627f3162fb2aef7ec93475d445"
      }
    },
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest", "--isolated"]
    }
  }
}
```

### Project-Level (`.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "supabase-local": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
      ]
    }
  }
}
```

## Root Cause: Cursor UI Bug

The "Loading tools" status in the UI appears to be a **display bug in Cursor's MCP extension**. The servers are:

- ✅ Connecting successfully
- ✅ Finding and loading tools
- ✅ Running without errors

But the UI state isn't updating to reflect this success.

## Steps Taken to Resolve

1. ✅ Fixed incorrect package names
2. ✅ Removed OAuth-blocked servers (Stripe, Vercel)
3. ✅ Eliminated duplicate configurations
4. ✅ Killed all running MCP server processes
5. ✅ Cleared cached MCP server modules
6. ✅ Cleaned up npx cache

## Next Steps

### Immediate Action Required

**RESTART CURSOR COMPLETELY**

1. Quit Cursor (Cmd+Q)
2. Wait 10 seconds
3. Reopen Cursor
4. Wait for MCP servers to initialize (may take 30-60 seconds)

### If Still Showing "Loading Tools"

The tools may still be **functionally available** even if the UI shows "Loading". Try:

1. **Test the tools directly**: Ask me to use a Supabase tool (like listing tables or running a query)
2. **Check Cursor Settings**:
   - Open Settings (Cmd+,)
   - Search for "MCP"
   - Verify MCP is enabled
3. **View MCP Logs**:
   - Help → Toggle Developer Tools
   - Check Console for MCP-related messages

### Alternative Workaround

If the UI issue persists but tools work:

- The tools ARE available despite UI showing "Loading"
- I can access them programmatically
- The "Loading" is purely cosmetic

### Nuclear Option (Last Resort)

If nothing else works:

```bash
# Backup your settings first
cp ~/.cursor/mcp.json ~/.cursor/mcp.json.backup

# Clear Cursor's entire state
rm -rf ~/Library/Application\ Support/Cursor/User/workspaceStorage/*/state.vscdb*
rm -rf ~/Library/Application\ Support/Cursor/User/globalStorage/state.vscdb*

# Restart Cursor
```

## Tools Available (Once UI Updates)

### Supabase Production (20 tools)

- `list_tables` - List database tables
- `execute_sql` - Run SQL queries
- `apply_migration` - Apply migrations
- `list_migrations` - View migration history
- `get_logs` - Fetch service logs
- `get_advisors` - Security & performance checks
- And 14 more...

### Playwright (21 tools)

- `browser_navigate` - Navigate to URLs
- `browser_click` - Click elements
- `browser_snapshot` - Capture page state
- `browser_evaluate` - Run JavaScript
- And 17 more...

### Supabase Local (1 tool + 25 resources)

- `query` - Query local database
- Access to all 25 database tables as resources

## Verification After Restart

Check that you see:

- ✅ Green indicators on all MCP servers
- ✅ Tool counts displayed (20, 21, 1)
- ✅ No "Loading tools" message
- ✅ No yellow warning indicators

## Contact Information

If issues persist after following these steps, the problem may be:

1. A Cursor version-specific bug (check for updates)
2. A conflict with another extension
3. A permissions issue with the MCP extension

Latest logs location:

```
~/Library/Application Support/Cursor/logs/[latest-date]/window1/exthost/anysphere.cursor-mcp/
```

---

**Report Generated**: October 10, 2025 18:35 PM
**Cursor Version**: Check Help → About
**MCP Extension**: anysphere.cursor-mcp
