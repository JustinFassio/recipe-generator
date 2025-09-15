# Recipe Generator Troubleshooting Guide

**Common issues and solutions for the AI Recipe Creation Workflow**

---

## 🎯 **Overview**

This guide covers the most common issues users and developers encounter with the Recipe Generator's AI chat workflow, along with step-by-step solutions and prevention strategies.

## 🚨 **Common User Issues**

### **Issue 1: "Save Recipe" Button Not Working**

#### **Symptoms**

- User clicks "Save Recipe" but nothing happens
- Recipe doesn't appear in collection
- No error messages displayed

#### **Root Causes & Solutions**

**A. No Recipe Content in Conversation**

```
❌ Problem: User clicked "Save Recipe" without AI providing recipe
✅ Solution: Have a conversation about a specific recipe first
```

**Steps to Fix**:

1. Engage with AI about a specific dish (e.g., "How do I make pasta carbonara?")
2. Wait for AI to provide complete recipe with ingredients and instructions
3. Then click "Save Recipe"

**B. Insufficient Recipe Content**

```
❌ Problem: AI response too brief or incomplete
✅ Solution: Ask for complete recipe details
```

**Steps to Fix**:

1. Ask AI: "Can you give me the complete recipe with all ingredients and step-by-step instructions?"
2. Wait for comprehensive response
3. Click "Save Recipe"

**C. Browser JavaScript Errors**

```
❌ Problem: JavaScript console errors blocking functionality
✅ Solution: Refresh page and check browser console
```

**Steps to Fix**:

1. Open browser developer tools (F12)
2. Check Console tab for errors
3. Refresh page (Ctrl+R / Cmd+R)
4. Try again

### **Issue 2: AI Not Responding**

#### **Symptoms**

- Message sent but no AI response
- Loading indicator stuck
- "Failed to get AI response" error

#### **Root Causes & Solutions**

**A. OpenAI API Rate Limits (429 Errors)**

```
❌ Problem: Too many requests to OpenAI API
✅ Solution: Wait and retry with exponential backoff
```

**Steps to Fix**:

1. Wait 30-60 seconds before retrying
2. Check browser console for specific error details
3. If persistent, try different persona (they use different API endpoints)

**B. Invalid API Key**

```
❌ Problem: OpenAI API key expired or invalid
✅ Solution: Developer needs to update .env file
```

**For Developers**:

1. Check `.env` file for `OPENAI_API_KEY` (server-side only)
2. Verify key is valid and has credits
3. Restart development server after changes

**C. Network Connectivity Issues**

```
❌ Problem: Internet connection problems
✅ Solution: Check network and retry
```

**Steps to Fix**:

1. Check internet connection
2. Try refreshing the page
3. Verify other websites work normally

### **Issue 3: Assistant API Hanging (Dr. Sage Vitalis)**

#### **Symptoms**

- Dr. Sage Vitalis responses take very long
- Console shows repeated API polling
- Eventually times out or fails

#### **Root Causes & Solutions**

**A. Assistant Run Status Issues**

```
❌ Problem: OpenAI Assistant run stuck in processing
✅ Solution: Automatic timeout and fallback implemented
```

**How It Works**:

1. System polls Assistant run status for 60 seconds
2. If timeout reached, automatically falls back to Chat Completions API
3. User sees response from fallback system

**B. Thread Management Problems**

```
❌ Problem: Assistant thread becomes corrupted
✅ Solution: Switch to different persona and back
```

**Steps to Fix**:

1. Click "Change Assistant"
2. Select a different persona (e.g., Chef Marco)
3. Have a brief conversation
4. Switch back to Dr. Sage Vitalis

### **Issue 4: Recipe Parsing Failures**

#### **Symptoms**

- "Recipe parsing failed" error message
- Recipe editor doesn't appear after "Save Recipe"
- Malformed recipe data in editor

#### **Root Causes & Solutions**

**A. AI Response Not Recipe-Formatted**

```
❌ Problem: AI provided general cooking advice, not a recipe
✅ Solution: Request specific recipe format
```

**Example Request**:

```
"Can you give me a complete recipe for [dish name] with:
- List of ingredients with amounts
- Step-by-step cooking instructions
- Any helpful tips or notes"
```

**B. Missing Required Recipe Components**

```
❌ Problem: Recipe lacks ingredients or instructions
✅ Solution: Ask AI to fill in missing details
```

**Steps to Fix**:

1. Ask AI: "Can you add the missing ingredients list?"
2. Or: "What are the detailed cooking instructions?"
3. Wait for complete response
4. Try "Save Recipe" again

## 🔧 **Developer Troubleshooting**

### **Issue 1: Import Path Errors**

#### **Symptoms**

- TypeScript errors about missing components
- Components not rendering correctly
- Build failures

#### **Solution**

```typescript
// ❌ Wrong - old file path
import { ChatInterface } from '@/components/chat/chat-interface';

// ✅ Correct - current file path
import { ChatInterface } from '@/components/chat/ChatInterface';
```

### **Issue 2: State Management Issues**

#### **Symptoms**

- Recipe data not persisting between components
- UI not updating after state changes
- Memory leaks or stale closures

#### **Solutions**

**A. useCallback Dependencies**

```typescript
// ✅ Correct dependency array
const convertToRecipe = useCallback(async () => {
  // function body
}, [messages, parseRecipeFromText, toast]);
```

**B. useEffect Dependencies**

```typescript
// ✅ Proper effect dependencies
useEffect(() => {
  if (generatedRecipe) {
    onRecipeGenerated(generatedRecipe);
  }
}, [generatedRecipe, onRecipeGenerated]);
```

### **Issue 3: API Integration Problems**

#### **Symptoms**

- Inconsistent API responses
- Authentication failures
- Timeout issues

#### **Solutions**

**A. Environment Variables**

```bash
# ✅ Ensure all required env vars are set
# OPENAI_API_KEY=sk-proj-... (server-side only)
VITE_OPENAI_MODEL=gpt-4o-mini
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
```

**B. Error Handling**

```typescript
// ✅ Comprehensive error handling
try {
  const response = await openaiAPI.sendMessageWithPersona(messages, persona);
} catch (error) {
  if (error.status === 429) {
    // Handle rate limits
  } else if (error.status === 401) {
    // Handle auth errors
  } else {
    // Handle general errors
  }
}
```

## 🔍 **Debugging Tools & Techniques**

### **Browser Developer Tools**

#### **Console Debugging**

1. **Open Dev Tools**: F12 (Windows/Linux) or Cmd+Option+I (Mac)
2. **Check Console**: Look for red error messages
3. **Network Tab**: Monitor API calls and responses
4. **React DevTools**: Inspect component state and props

#### **Common Console Messages**

```javascript
// ✅ Normal operation
'Recipe parsing started';
'Recipe parsed successfully';
'Assistant message received';

// ❌ Error indicators
'Recipe parsing failed';
'OpenAI API error: 429';
'Assistant run timeout';
```

### **Network Monitoring**

#### **API Call Inspection**

1. **Network Tab**: Monitor outgoing requests
2. **Filter by XHR**: Focus on API calls
3. **Check Status Codes**:
   - 200: Success
   - 429: Rate limited
   - 401: Unauthorized
   - 500: Server error

### **React State Debugging**

#### **useConversation Hook State**

```typescript
// Add temporary logging for debugging
console.log('Conversation state:', {
  persona,
  messageCount: messages.length,
  hasGeneratedRecipe: !!generatedRecipe,
  isLoading,
  showPersonaSelector,
});
```

## 📋 **Systematic Troubleshooting Checklist**

### **For Users**

- [ ] **Clear browser cache** and refresh page
- [ ] **Check internet connection** stability
- [ ] **Try different persona** if one isn't working
- [ ] **Ask for complete recipe** with all details
- [ ] **Wait for full AI response** before clicking "Save Recipe"
- [ ] **Check browser console** for error messages

### **For Developers**

- [ ] **Verify environment variables** are properly set
- [ ] **Check import paths** for correct component references
- [ ] **Run linting** to catch obvious errors
- [ ] **Test API keys** with direct API calls
- [ ] **Monitor network requests** in browser dev tools
- [ ] **Check React state** with React DevTools

## 🚀 **Prevention Strategies**

### **User Education**

- **Clear UI Feedback**: Loading states and progress indicators
- **Error Messages**: Actionable error descriptions
- **Help Text**: Contextual guidance in the interface
- **Examples**: Sample conversations and recipe requests

### **Technical Resilience**

- **Retry Logic**: Automatic retries for transient failures
- **Fallback Systems**: Alternative API routes when primary fails
- **Input Validation**: Client-side validation before API calls
- **Error Boundaries**: Component-level error isolation

### **Monitoring & Alerting**

- **Error Tracking**: Log and monitor error patterns
- **Performance Metrics**: API response times and success rates
- **User Analytics**: Track user behavior and pain points
- **Health Checks**: Regular API connectivity verification

## 📞 **Getting Help**

### **For Users**

1. **Refresh the page** and try again
2. **Check this troubleshooting guide** for common solutions
3. **Try a different browser** if issues persist
4. **Report bugs** with specific error messages and steps to reproduce

### **For Developers**

1. **Check the console** for detailed error messages
2. **Review recent changes** that might have introduced issues
3. **Test with different API keys** or endpoints
4. **Consult the codebase** for similar implementations
5. **Run the test suite** to identify regressions

## 📊 **Common Error Codes**

| Error Code        | Description           | Solution                                      |
| ----------------- | --------------------- | --------------------------------------------- |
| **429**           | Rate limit exceeded   | Wait and retry, implement exponential backoff |
| **401**           | Unauthorized          | Check API key validity                        |
| **500**           | Server error          | Retry request, check API status               |
| **NETWORK_ERROR** | Connection failed     | Check internet connection                     |
| **PARSE_ERROR**   | Recipe parsing failed | Request more detailed recipe from AI          |
| **TIMEOUT**       | Request timeout       | Retry with longer timeout                     |

---

**Last Updated**: January 2025  
**Next Review**: February 2025

For additional support, consult the [AI Recipe Creation Workflow](ai-recipe-creation-workflow.md) and [Recipe Save Flow](recipe-save-flow.md) documentation.
