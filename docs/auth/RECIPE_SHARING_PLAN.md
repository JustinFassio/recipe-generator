# Recipe Sharing Feature Plan

## Overview

This plan outlines the implementation of a recipe sharing feature that allows users to selectively share their recipes to the public Explore feed via a "Share" button on recipe cards.

## Current Issue

Users can only see their own recipes in the Explore feed because:

1. RLS policies filter recipes by `user_id` (owner-only)
2. No mechanism exists for users to control which recipes are public
3. Explore feed should show all public recipes from all users, not just the current user's

## Proposed Solution

### 1. Add Share Button to Recipe Cards

**Location**: `src/components/recipes/recipe-card.tsx`

**Features**:

- Share button (icon: Share/Globe) for user's own recipes
- Visual indicator showing shared/unshared status
- Toggle functionality to share/unshare recipes

**UI States**:

- **Unshared**: "Share" button (outline style)
- **Shared**: "Shared" button (filled style) with checkmark
- **Loading**: Disabled state during API call

### 2. Update Recipe API

**Location**: `src/lib/api.ts`

**New Functions**:

```typescript
// Toggle recipe public status
async toggleRecipePublic(recipeId: string, isPublic: boolean): Promise<void>

// Get recipe sharing status
async getRecipeSharingStatus(recipeId: string): Promise<boolean>
```

### 3. Update Database Schema

**Migration**: `supabase/migrations/20250819000005_recipe_sharing_controls.sql`

**Changes**:

- Ensure `is_public` column exists on `recipes` table
- Update RLS policies to allow viewing all public recipes
- Add policy for users to update their own recipe's `is_public` status

**RLS Policy Updates**:

```sql
-- Allow all users to view public recipes (not just owner)
CREATE POLICY "Anyone can view public recipes"
  ON recipes
  FOR SELECT
  TO public
  USING (is_public = true);

-- Allow users to toggle sharing on their own recipes
CREATE POLICY "Users can update sharing status of their own recipes"
  ON recipes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### 4. Update Explore Feed Query

**Location**: `src/lib/api.ts` - `getPublicRecipes()`

**Current Issue**: Query only returns user's own recipes
**Fix**: Remove user filtering, show all recipes where `is_public = true`

### 5. Update Recipe Card Component

**New Props**:

```typescript
interface RecipeCardProps {
  recipe: Recipe;
  showShareButton?: boolean; // Only show for user's own recipes
  onShareToggle?: (recipeId: string, isPublic: boolean) => void;
}
```

**Share Button Implementation**:

```typescript
const ShareButton = ({ recipe, onShareToggle }) => {
  const [isSharing, setIsSharing] = useState(false);
  const [isPublic, setIsPublic] = useState(recipe.is_public);

  const handleShareToggle = async () => {
    setIsSharing(true);
    try {
      await recipeApi.toggleRecipePublic(recipe.id, !isPublic);
      setIsPublic(!isPublic);
      onShareToggle?.(recipe.id, !isPublic);
    } catch (error) {
      // Handle error
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Button
      variant={isPublic ? "default" : "outline"}
      size="sm"
      onClick={handleShareToggle}
      disabled={isSharing}
    >
      {isSharing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isPublic ? (
        <>
          <Check className="h-4 w-4 mr-1" />
          Shared
        </>
      ) : (
        <>
          <Share className="h-4 w-4 mr-1" />
          Share
        </>
      )}
    </Button>
  );
};
```

## Implementation Steps

### Phase 1: Database Updates

1. Create migration for RLS policy updates
2. Test policies with different user contexts
3. Verify public recipe visibility works correctly

### Phase 2: API Updates

1. Add `toggleRecipePublic` function to API
2. Update `getPublicRecipes` to show all public recipes
3. Add error handling and validation

### Phase 3: UI Updates

1. Add Share button to RecipeCard component
2. Implement share/unshare toggle functionality
3. Add loading states and error handling
4. Update My Recipes page to show sharing status

### Phase 4: Testing

1. Test sharing functionality with multiple users
2. Verify Explore feed shows all shared recipes
3. Test RLS policies prevent unauthorized access
4. Verify share button only appears on user's own recipes

## User Experience Flow

### For Recipe Owners

1. **Create Recipe**: Recipe is private by default (`is_public = false`)
2. **Share Recipe**: Click "Share" button to make recipe public
3. **Unshare Recipe**: Click "Shared" button to make recipe private again
4. **Visual Feedback**: Clear indication of sharing status

### For Recipe Viewers

1. **Explore Feed**: See all recipes shared by any user
2. **Recipe Cards**: Show author name and sharing status
3. **Save Functionality**: Can save any public recipe to their collection

## Security Considerations

### RLS Policies

- Users can only toggle sharing on their own recipes
- Public recipes are viewable by all users
- Private recipes remain private regardless of sharing status

### Data Protection

- No sensitive user data exposed in public recipes
- Author names are publicly visible (intentional for community)
- Recipe content is user-controlled

## Future Enhancements

### Potential Additions

- **Share Count**: Track how many times a recipe has been saved
- **Share Analytics**: Show recipe popularity metrics
- **Bulk Sharing**: Share multiple recipes at once
- **Share Permissions**: Granular control over what's shared

### Integration with Friend Bubbles

- **Selective Sharing**: Share only with specific friend groups
- **Bubble-Only Recipes**: Recipes visible only within friend bubbles
- **Cross-Bubble Sharing**: Share recipes between different friend groups

## Success Metrics

### Functionality

- ✅ Users can share/unshare their recipes
- ✅ Explore feed shows all public recipes from all users
- ✅ Share button only appears on user's own recipes
- ✅ RLS policies prevent unauthorized access

### User Experience

- ✅ Clear visual feedback for sharing status
- ✅ Smooth toggle functionality with loading states
- ✅ Intuitive button placement and labeling
- ✅ Consistent behavior across the application

## Files to Modify

### Database

- `supabase/migrations/20250819000005_recipe_sharing_controls.sql` (new)

### API

- `src/lib/api.ts` - Add sharing functions

### Components

- `src/components/recipes/recipe-card.tsx` - Add Share button
- `src/pages/recipes-page.tsx` - Pass sharing props

### Types

- `src/lib/supabase.ts` - Update Recipe type if needed

## Testing Checklist

- [ ] Share button appears only on user's own recipes
- [ ] Share/unshare toggle works correctly
- [ ] Explore feed shows all public recipes from all users
- [ ] RLS policies prevent unauthorized sharing
- [ ] Loading states work during share operations
- [ ] Error handling for failed share operations
- [ ] Visual feedback matches sharing status
- [ ] No regression in existing recipe functionality
