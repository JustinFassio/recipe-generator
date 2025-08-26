# Phase 2: Recipe Media Enhancement

**Timeline**: Day 2  
**Deliverable**: Simple video support for recipes following MVP patterns

---

## 🎯 Objective

Add video support to recipes using the same simple approach as image support. Keep it minimal and follow existing patterns exactly.

---

## 📋 Implementation Steps

### Step 1: Extend Recipe Schema

#### Migration 6: `20250120000006_add_recipe_video_support.sql`

```sql
-- Add video support to recipes table (following existing image pattern)
BEGIN;

-- Add video_url column (same pattern as image_url)
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS video_url text;

-- Create video storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('recipe-videos', 'recipe-videos', true, 104857600) -- 100MB limit
ON CONFLICT (id) DO NOTHING;

-- Video storage policies (copy image policies pattern)
CREATE POLICY "recipe_videos_upload_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'recipe-videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "recipe_videos_read_all" ON storage.objects
  FOR SELECT USING (bucket_id = 'recipe-videos');

CREATE POLICY "recipe_videos_update_own" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'recipe-videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "recipe_videos_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'recipe-videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

COMMIT;
```

### Step 2: Update TypeScript Types

**File**: `src/lib/types.ts`

```typescript
// Update Recipe type to include video_url (following image_url pattern)
export type Recipe = {
  id: string;
  title: string;
  ingredients: string[];
  instructions: string;
  notes: string | null;
  image_url: string | null;
  video_url: string | null; // ← Add this line
  user_id: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};
```

### Step 3: Extend API Layer

**File**: `src/lib/api.ts`

```typescript
// Add to recipeApi object (copy uploadImage pattern exactly)
export const recipeApi = {
  // ... existing methods ...

  // Upload recipe video (copy uploadImage function pattern)
  async uploadVideo(file: File): Promise<string> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('recipe-videos')
      .upload(fileName, file);

    if (uploadError) handleError(uploadError, 'Upload video');

    const { data } = supabase.storage
      .from('recipe-videos')
      .getPublicUrl(fileName);

    return data.publicUrl;
  },
};
```

### Step 4: Update Recipe Form

**File**: `src/components/recipes/recipe-form.tsx`

Add video upload functionality following the exact same pattern as image upload:

```typescript
// Add to existing state
const [videoFile, setVideoFile] = useState<File | null>(null);
const [videoPreview, setVideoPreview] = useState<string | null>(null);

// Add video upload mutation (copy image upload pattern)
const uploadVideo = useMutation({
  mutationFn: recipeApi.uploadVideo,
  onError: (error) => {
    toast({
      title: 'Upload Failed',
      description: error.message,
      variant: 'destructive',
    });
  },
});

// Add video change handler (copy image handler pattern)
const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    setVideoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setVideoPreview(previewUrl);
  }
};

// Update onSubmit to handle video (copy image upload pattern)
const onSubmit = async (data: RecipeFormData) => {
  try {
    let imageUrl = data.image_url;
    let videoUrl = data.video_url; // Add this

    // Upload image if there's a new file
    if (imageFile) {
      const uploadedUrl = await uploadImage.mutateAsync(imageFile);
      if (!uploadedUrl) {
        throw new Error('Failed to upload image');
      }
      imageUrl = uploadedUrl;
    }

    // Upload video if there's a new file (copy image pattern)
    if (videoFile) {
      const uploadedUrl = await uploadVideo.mutateAsync(videoFile);
      if (!uploadedUrl) {
        throw new Error('Failed to upload video');
      }
      videoUrl = uploadedUrl;
    }

    const recipeData = {
      ...data,
      image_url: imageUrl || null,
      video_url: videoUrl || null, // Add this
    };

    // ... rest of existing logic
  } catch (error) {
    console.error('Error saving recipe:', error);
  }
};

// Add video input to JSX (copy image input pattern)
{/* Video Upload */}
<div className="form-control">
  <label className="label">
    <span className="label-text">Recipe Video (Optional)</span>
  </label>
  <input
    type="file"
    accept="video/*"
    onChange={handleVideoChange}
    className="file-input file-input-bordered w-full"
  />
  {videoPreview && (
    <div className="mt-2">
      <video
        src={videoPreview}
        controls
        className="w-full max-w-md rounded-lg"
      />
    </div>
  )}
</div>
```

### Step 5: Update Recipe Display Components

**File**: `src/components/recipes/recipe-view.tsx`

Add video display following the same pattern as image display:

```typescript
// Add to JSX where image is displayed
{recipe.video_url && (
  <div className="mb-4">
    <video
      src={recipe.video_url}
      controls
      className="w-full rounded-lg"
    />
  </div>
)}
```

**File**: `src/components/recipes/recipe-card.tsx`

Add video thumbnail/preview if needed:

```typescript
// Add video indicator or thumbnail display
{recipe.video_url && (
  <div className="badge badge-secondary">Video</div>
)}
```

---

## 🚀 Deployment

### Using Supabase CLI

```bash
# Run the new migration
supabase db push

# Verify the changes
supabase db diff
```

### Manual Deployment

Run Migration 6 through the Supabase dashboard SQL editor.

---

## ✅ Verification Checklist

### Database Changes

- [ ] `recipes.video_url` column added
- [ ] `recipe-videos` storage bucket created
- [ ] Video storage policies implemented

### Application Changes

- [ ] Recipe type updated with `video_url`
- [ ] `uploadVideo` API function works
- [ ] Recipe form accepts video uploads
- [ ] Recipe display shows videos
- [ ] Video files are properly validated

### Functionality Tests

- [ ] Can upload video to recipe
- [ ] Video displays in recipe view
- [ ] Video files are stored securely
- [ ] Only recipe owner can upload videos
- [ ] Video file size limits enforced

---

## 🎯 File Size Limits & Validation

**Storage Limits:**

- Videos: 100MB maximum
- Images: 10MB maximum
- Avatars: 5MB maximum

**Supported Video Formats:**

- MP4 (recommended)
- WebM
- MOV
- AVI

**Client-Side Validation** (add to uploadVideo function):

```typescript
// Add validation before upload
const validVideoTypes = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/avi',
];
if (!validVideoTypes.includes(file.type)) {
  throw new Error('Please upload a valid video file (MP4, WebM, MOV, or AVI)');
}

if (file.size > 100 * 1024 * 1024) {
  // 100MB
  throw new Error('Video file size must be less than 100MB');
}
```

---

## 🔄 Next Steps

After Phase 2 completion:

1. Test video upload and playback
2. Validate file size limits
3. Move to Phase 3: Performance & Testing
