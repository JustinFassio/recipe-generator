# PR 02: Extract AvatarCard Component

## Overview

Extract the avatar upload functionality from `src/pages/profile-page.tsx` into a reusable `AvatarCard` component. This PR focuses on moving the avatar-related UI and logic while maintaining 1:1 behavior parity.

## Current Implementation Analysis

### Avatar-Related Code in Profile Page

**State Management:**

```typescript
const [avatarLoading, setAvatarLoading] = useState(false);
const fileInputRef = useRef<HTMLInputElement>(null);
```

**Upload Handler:**

```typescript
const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setAvatarLoading(true);
  const { success, error } = await uploadAvatar(file);

  if (!success && error) {
    toast({
      title: 'Error',
      description: error.message,
      variant: 'destructive',
    });
  } else {
    toast({
      title: 'Success',
      description: 'Avatar updated successfully!',
    });
    await refreshProfile();
  }

  setAvatarLoading(false);

  // Reset file input
  if (fileInputRef.current) {
    fileInputRef.current.value = '';
  }
};
```

**UI Structure:**

```tsx
{
  /* Avatar Section */
}
<div className="card bg-base-200 shadow-lg">
  <div className="card-body">
    <h2 className="card-title">Profile Picture</h2>

    <div className="flex flex-col items-center space-y-4">
      <div className="avatar">
        <div className="h-24 w-24 rounded-full">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="Profile" />
          ) : (
            <div className="flex items-center justify-center bg-primary/20">
              <User className="h-12 w-12 text-primary" />
            </div>
          )}
          {avatarLoading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarUpload}
        className="hidden"
      />

      <button
        type="button"
        className="btn btn-outline btn-sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={avatarLoading}
      >
        <Camera className="mr-2 h-4 w-4" />
        {avatarLoading ? 'Uploading...' : 'Change Photo'}
      </button>
    </div>
  </div>
</div>;
```

## Implementation Plan

### 1. Create AvatarCard Component

**File:** `src/components/profile/basic/AvatarCard.tsx`

**Props Interface:**

```typescript
interface AvatarCardProps {
  avatarUrl: string | null;
  loading: boolean;
  onUpload: (file: File) => Promise<void>;
  className?: string;
}
```

**Component Structure:**

- Use `SectionCard` from shared primitives
- Extract avatar preview logic
- Extract file input handling
- Extract upload button with loading state
- Handle file input ref internally

### 2. Component Implementation Details

**Features to Extract:**

- ✅ Avatar preview (image or fallback icon)
- ✅ Loading overlay during upload
- ✅ File input with image/\* accept
- ✅ Upload button with Camera icon
- ✅ Loading state button text
- ✅ File input reset after upload

**Dependencies:**

- `SectionCard` from shared primitives
- `User`, `Camera`, `Loader2` icons from lucide-react
- `useRef` for file input management

### 3. Profile Page Changes

**Remove from Profile Page:**

- `avatarLoading` state
- `fileInputRef` ref
- `handleAvatarUpload` function
- Avatar section JSX

**Add to Profile Page:**

```tsx
import { AvatarCard } from '@/components/profile/basic/AvatarCard';

// In the profile tab JSX:
<AvatarCard
  avatarUrl={profile.avatar_url}
  loading={avatarLoading}
  onUpload={handleAvatarUpload}
/>;
```

**Keep in Profile Page:**

- `avatarLoading` state (for now)
- `handleAvatarUpload` function (for now)
- All existing upload logic and error handling

### 4. Test Implementation

**File:** `src/__tests__/components/profile/basic/AvatarCard.test.tsx`

**Test Cases:**

- ✅ Renders avatar image when URL provided
- ✅ Renders fallback icon when no URL
- ✅ Shows loading overlay during upload
- ✅ Triggers file input when button clicked
- ✅ Calls onUpload when file selected
- ✅ Disables button during loading
- ✅ Shows correct button text based on loading state
- ✅ Resets file input after upload

### 5. Quality Gates

**Verification Checklist:**

- [ ] TypeScript compilation: `npx tsc --noEmit`
- [ ] Tests pass: `npm run test:run -- src/__tests__/components/profile/basic/`
- [ ] Lint pass: `npm run lint`
- [ ] Format pass: `npm run format:check`
- [ ] Build pass: `npm run build`
- [ ] Visual parity confirmed
- [ ] Upload functionality works identically
- [ ] No console warnings
- [ ] No regression in loading states

## Files to Create/Modify

### New Files

- `src/components/profile/basic/AvatarCard.tsx`
- `src/__tests__/components/profile/basic/AvatarCard.test.tsx`

### Modified Files

- `src/pages/profile-page.tsx` (remove avatar section, add import and component usage)

## Acceptance Criteria

### Functional Requirements

- ✅ Avatar upload works exactly as before
- ✅ Loading states display correctly
- ✅ Error handling works identically
- ✅ Success toasts appear as expected
- ✅ Profile refresh happens after successful upload
- ✅ File input resets after upload

### Visual Requirements

- ✅ Avatar preview looks identical
- ✅ Loading overlay appears in same position
- ✅ Button styling unchanged
- ✅ Icon positioning unchanged
- ✅ Card layout preserved

### Technical Requirements

- ✅ Component is reusable
- ✅ Props interface is clean and minimal
- ✅ No business logic in component (upload logic stays in page)
- ✅ Proper TypeScript types
- ✅ Comprehensive test coverage
- ✅ Follows established patterns

## Risk Assessment

**Low Risk** - This is a straightforward UI extraction with:

- No business logic changes
- No API changes
- No state management changes
- Clear component boundaries
- Well-defined props interface

## Dependencies

- ✅ PR 01 completed (shared primitives available)
- ✅ `uploadAvatar` function from `@/lib/auth`
- ✅ `toast` function from `@/hooks/use-toast`
- ✅ `refreshProfile` from `useAuth` context

## Next Steps

After PR 02 completion:

- PR 03: Extract BioCard component
- PR 04: Extract ProfileInfoForm component
- Continue with remaining Phase 1 PRs
