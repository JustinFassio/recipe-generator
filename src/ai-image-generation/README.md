# AI Image Generation for Recipe Photos

**Phased implementation plan for adding DALL-E 3 image generation to the recipe upload system**

## 🎯 Overview

This directory contains the implementation plan and code for integrating AI-generated recipe photos using DALL-E 3. The system will provide users with the option to generate relevant images for their recipes automatically, alongside the existing manual upload functionality.

## 📋 Current Recipe JSON Structure

Based on the existing system prompts in `src/lib/openai.ts` and `api/ai/chat.ts`, recipes are generated with this JSON structure:

```json
{
  "title": "Recipe Name",
  "ingredients": [
    {
      "item": "ingredient name",
      "amount": "quantity needed",
      "prep": "preparation instructions"
    }
  ],
  "instructions": "Step-by-step cooking instructions",
  "setup": ["Prep time: X minutes", "Cook time: X minutes", "Equipment needed"],
  "categories": ["Course: Main", "Cuisine: Type", "Technique: Method"],
  "notes": "Tips, variations, and additional notes"
}
```

This structure provides rich context for generating relevant recipe images.

## 🏗️ Implementation Phases

### [Phase 0: Recipe Description Enhancement](./PHASE-0-RECIPE-DESCRIPTION-ENHANCEMENT.md)

- Add rich recipe descriptions to JSON schema
- Update AI personas to generate descriptions
- Enhance recipe form and view with descriptions
- Use descriptions as primary source for image generation

### [Phase 1: Backend API Setup](./PHASE-1-BACKEND-API.md)

- Create DALL-E 3 API integration
- Implement image generation endpoint
- Add error handling and rate limiting

### [Phase 2: Frontend Integration](./PHASE-2-FRONTEND-INTEGRATION.md)

- Add "Generate with AI" option to upload interface
- Create image generation UI components
- Implement loading states and error handling

### [Phase 3: Recipe Context Integration](./PHASE-3-RECIPE-CONTEXT.md)

- Use recipe JSON data to create intelligent prompts
- Implement prompt optimization for better image results
- Add fallback strategies for failed generations

### [Phase 4: Cost Management & Optimization](./PHASE-4-COST-MANAGEMENT.md)

- Implement usage tracking and limits
- Add caching for similar recipes
- Optimize prompt engineering for cost efficiency

### [Phase 5: Testing & Quality Assurance](./PHASE-5-TESTING.md)

- Comprehensive testing of image generation
- Quality validation and user feedback
- Performance optimization and monitoring

## 🔧 Technical Architecture

### API Key Usage

- **Same API Key**: Uses existing `OPENAI_API_KEY` environment variable
- **Server-Side Only**: Image generation happens on the backend for security
- **Endpoint**: `/api/ai/generate-image` (new endpoint to be created)

### Integration Points

- **Recipe Form**: `src/components/recipes/recipe-form.tsx`
- **Image Upload**: Existing `useUploadImage()` hook
- **Recipe Parsing**: Existing JSON structure from AI personas

## 📚 Related Documentation

- [Current Recipe JSON Structure](../../lib/openai.ts) - System prompts that generate recipe JSON
- [Image Upload System](../../pages/recipes/recipe-image-update.md) - Current manual upload implementation
- [OpenAI Integration](../../workflows/openai-integration-flow.md) - Existing API setup and patterns

## 🚀 Getting Started

1. Start with [Phase 1: Backend API Setup](./PHASE-1-BACKEND-API.md)
2. Follow the implementation order for proper integration
3. Test each phase thoroughly before proceeding to the next
4. Monitor costs and usage throughout implementation

---

**Note**: This implementation builds upon the existing robust image upload system while adding AI generation capabilities as an enhancement, not a replacement.
