/**
 * Compress and resize image to reduce file size
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    // Always process the image to apply dimension constraints
    // File size check is handled by validateImageFile before calling this function

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw image (resized if needed)
      ctx?.drawImage(img, 0, 0, width, height);

      // Convert to blob with compression
      // This will apply quality compression even if dimensions don't need resizing
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Create new file with processed data
            const processedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(processedFile);
          } else {
            reject(new Error('Failed to process image'));
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load image from file
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Validate image file size and type
 */
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  const maxSizeMB = 10; // 10MB max
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Please select a valid image file (JPEG, PNG, or WebP)',
    };
  }

  if (file.size > maxSizeMB * 1024 * 1024) {
    return {
      valid: false,
      error: `Image file size must be less than ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
}

/**
 * Process an image file with validation, compression, and preview generation
 *
 * This utility function handles the complete image processing workflow:
 * 1. Validates the file type and size
 * 2. Compresses the image if needed
 * 3. Generates a preview URL
 * 4. Returns processed data or validation errors
 *
 * @param file - The image file to process
 * @param options - Optional configuration for image processing
 * @returns Promise resolving to processed image data or validation error
 *
 * @example
 * ```typescript
 * const result = await processImageFile(file);
 * if (result.success) {
 *   setImageFile(result.compressedFile);
 *   setImagePreview(result.previewUrl);
 * } else {
 *   toast({
 *     title: 'Invalid Image',
 *     description: result.error,
 *     variant: 'destructive',
 *   });
 * }
 * ```
 */
export async function processImageFile(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {}
): Promise<
  | {
      success: true;
      compressedFile: File;
      previewUrl: string;
    }
  | {
      success: false;
      error: string;
    }
> {
  // Validate the file first
  const validation = validateImageFile(file);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error || 'Invalid image file',
    };
  }

  try {
    // Compress the image
    const compressedFile = await compressImage(
      file,
      options.maxWidth,
      options.maxHeight,
      options.quality
    );

    // Generate preview URL
    const previewUrl = URL.createObjectURL(compressedFile);

    return {
      success: true,
      compressedFile,
      previewUrl,
    };
  } catch (error) {
    console.error('Error processing image:', error);
    return {
      success: false,
      error: 'Failed to process the image. Please try again.',
    };
  }
}
