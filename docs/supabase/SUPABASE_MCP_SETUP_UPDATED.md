# 🔧 Supabase MCP Server Setup - Updated Authentication

**Date:** January 15, 2025  
**Issue:** MCP servers showing "No tools or prompts" after restart  
**Root Cause:** Supabase MCP server now requires Personal Access Token (PAT)  
**Status:** ⚠️ **REQUIRES ACTION** - Need to generate PAT  

---

## 🚨 **Critical Issue Identified**

The Supabase MCP server has changed its authentication requirements. It now requires a **Personal Access Token (PAT)** instead of just service role keys.

### **Error Message:**
```
Please provide a personal access token (PAT) with the --access-token flag 
or set the SUPABASE_ACCESS_TOKEN environment variable
```

---

## 🛠️ **Required Fix Steps**

### **Step 1: Generate Personal Access Token**

1. **Visit Supabase Dashboard**: Go to [https://supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens)
2. **Create New Token**: Click "Generate new token"
3. **Name Your Token**: Use a descriptive name like "MCP Server Token"
4. **Set Permissions**: Ensure it has access to your project
5. **Copy Token**: Save the token securely (you won't see it again)

### **Step 2: Set Environment Variable**

Add the token to your shell environment:

```bash
# Add to ~/.zshrc (or ~/.bashrc)
export SUPABASE_ACCESS_TOKEN="your-personal-access-token-here"

# Reload your shell
source ~/.zshrc
```

### **Step 3: Verify Token**

Test the token works:

```bash
echo $SUPABASE_ACCESS_TOKEN | cut -c1-20
# Should show first 20 characters of your token
```

---

## ✅ **Updated MCP Configuration**

I've already updated your `.cursor/mcp.json` with the correct format:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y", 
        "@supabase/mcp-server-supabase@latest",
        "--access-token",
        "${SUPABASE_ACCESS_TOKEN}"
      ]
    },
    "supabase-local": {
      "command": "npx",
      "args": [
        "-y", 
        "@supabase/mcp-server-supabase@latest",
        "--access-token",
        "${SUPABASE_ACCESS_TOKEN}"
      ]
    }
  }
}
```

---

## 🔄 **Complete Setup Process**

### **1. Generate Personal Access Token**
- Visit: https://supabase.com/dashboard/account/tokens
- Create token with project access
- Copy and save securely

### **2. Set Environment Variable**
```bash
export SUPABASE_ACCESS_TOKEN="your-token-here"
source ~/.zshrc
```

### **3. Test MCP Server**
```bash
npx -y @supabase/mcp-server-supabase@latest --access-token "$SUPABASE_ACCESS_TOKEN"
```

### **4. Restart Cursor**
- Close Cursor completely
- Reopen Cursor
- Check MCP servers show green status with tools/prompts

---

## 🔍 **Verification Commands**

### **Test Token Access**
```bash
# Verify token is set
echo $SUPABASE_ACCESS_TOKEN | cut -c1-20

# Test MCP server directly
npx -y @supabase/mcp-server-supabase@latest --access-token "$SUPABASE_ACCESS_TOKEN"
```

### **Check Project Access**
```bash
# Verify you can access your project with the token
curl -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  "https://api.supabase.com/v1/projects"
```

---

## 📋 **What Changed in Supabase MCP**

### **Old Authentication (Deprecated)**
- Used service role keys directly
- Environment variables: `SUPABASE_SERVICE_ROLE_KEY`
- Direct database access

### **New Authentication (Current)**
- Requires Personal Access Token (PAT)
- Environment variable: `SUPABASE_ACCESS_TOKEN`
- Project-level access control
- Better security and permissions

---

## 🚀 **Expected Results After Fix**

Once you complete the setup:

### **MCP Server Status**
- ✅ **supabase**: Should show green with available tools
- ✅ **supabase-local**: Should show green with available tools
- ✅ **Tools Available**: Schema inspection, query assistance, etc.
- ✅ **Prompts Available**: Database-specific prompts and suggestions

### **AI Integration**
- Real-time database schema access
- Context-aware query suggestions
- Migration assistance
- Performance optimization recommendations

---

## 🔒 **Security Best Practices**

### **Token Security**
- **Never commit** PAT to version control
- **Store securely** in environment variables only
- **Rotate regularly** for security
- **Use minimal permissions** required

### **Environment Setup**
- Keep PAT in shell environment (`.zshrc`)
- Don't hardcode in configuration files
- Use same token for both production and local MCP servers
- Monitor usage through Supabase Dashboard

---

## 🆘 **Troubleshooting**

### **Issue: "Invalid token"**
- **Solution**: Regenerate token in Supabase Dashboard
- **Check**: Token has correct project permissions

### **Issue: "Token not found"**
- **Solution**: Verify environment variable is set
- **Check**: `echo $SUPABASE_ACCESS_TOKEN`

### **Issue: "Connection refused"**
- **Solution**: Ensure Supabase project is accessible
- **Check**: Project URL and permissions

---

## 📞 **Next Steps**

1. **Generate PAT**: Visit Supabase Dashboard and create token
2. **Set Environment**: Add `SUPABASE_ACCESS_TOKEN` to your shell
3. **Test Setup**: Verify MCP server works with new token
4. **Restart Cursor**: Reload MCP configuration
5. **Verify Integration**: Check for green status and available tools

---

**Once you complete these steps, your Supabase MCP integration will be fully operational with the latest authentication requirements.**

