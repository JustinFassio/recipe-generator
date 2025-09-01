# AI Recipe Standardization API Setup

## Overview

The AI recipe standardization functionality has been restored using a secure backend API approach. The OpenAI API key is now kept secure on the server side and cannot be accessed by client-side code.

## How It Works

1. **Frontend**: Makes requests to `/api/recipe-standardize` endpoint
2. **Backend**: Vercel serverless function handles OpenAI API calls securely
3. **Security**: API key is stored in environment variables, not exposed to clients

## Setup Instructions

### For Local Development

1. Create a `.env.local` file in your project root:

   ```bash
   OPENAI_API_KEY=your_openai_api_key_here
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

### For Production (Vercel)

1. Set the environment variable in your Vercel dashboard:
   - Go to your project settings
   - Navigate to Environment Variables
   - Add `OPENAI_API_KEY` with your actual API key

2. Deploy to Vercel:
   ```bash
   vercel --prod
   ```

## API Endpoint

- **URL**: `/api/recipe-standardize`
- **Method**: POST
- **Body**: `{ "recipeText": "your recipe text here" }`
- **Response**: `{ "success": true, "standardizedText": "formatted recipe" }`

## Fallback Behavior

If the AI processing fails for any reason, the system automatically falls back to local parsing to ensure functionality is maintained.

## Security Features

- ✅ API key never exposed to client-side code
- ✅ Server-side validation of all inputs
- ✅ Rate limiting and error handling
- ✅ Graceful fallback to local processing

## Troubleshooting

- **"API key not configured"**: Ensure `OPENAI_API_KEY` is set in your environment
- **"Method not allowed"**: Ensure you're using POST requests
- **"AI processing failed"**: Check your OpenAI API key and billing status
