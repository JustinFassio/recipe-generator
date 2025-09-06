/**
 * Image Processing Utilities
 *
 * Provides client-side image processing capabilities for avatar uploads
 * including resizing, compression, and format optimization.
 */

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  maintainAspectRatio?: boolean;
}

export interface ProcessedImageResult {
  file: File;
  originalSize: number;
  processedSize: number;
  compressionRatio: number;
}

/**
 * Default processing options for avatar images
 */
export const DEFAULT_AVATAR_OPTIONS: ImageProcessingOptions = {
  maxWidth: 400,
  maxHeight: 400,
  quality: 0.8,
  format: 'webp',
  maintainAspectRatio: true,
};

/**
 * Process and optimize an image file for avatar upload
 */
export async function processAvatarImage(
  file: File,
  options: ImageProcessingOptions = DEFAULT_AVATAR_OPTIONS
): Promise<ProcessedImageResult> {
  const {
    maxWidth = 400,
    maxHeight = 400,
    quality = 0.8,
    format = 'webp',
    maintainAspectRatio = true,
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      try {
        // Calculate new dimensions
        const { width, height } = calculateDimensions(
          img.width,
          img.height,
          maxWidth,
          maxHeight,
          maintainAspectRatio
        );

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw image with high quality scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with specified format and quality
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to process image'));
              return;
            }

            // Create processed file
            const processedFile = new File([blob], `avatar.${format}`, {
              type: `image/${format}`,
            });

            const result: ProcessedImageResult = {
              file: processedFile,
              originalSize: file.size,
              processedSize: blob.size,
              compressionRatio: Math.round(
                ((file.size - blob.size) / file.size) * 100
              ),
            };

            resolve(result);
          },
          `image/${format}`,
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load the image
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Calculate optimal dimensions for image resizing
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number,
  maintainAspectRatio: boolean
): { width: number; height: number } {
  if (!maintainAspectRatio) {
    return {
      width: Math.min(originalWidth, maxWidth),
      height: Math.min(originalHeight, maxHeight),
    };
  }

  // Calculate scaling factor to fit within bounds
  const scaleX = maxWidth / originalWidth;
  const scaleY = maxHeight / originalHeight;
  const scale = Math.min(scaleX, scaleY, 1); // Don't upscale

  return {
    width: Math.round(originalWidth * scale),
    height: Math.round(originalHeight * scale),
  };
}

/**
 * Validate image file before processing
 */
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  // Check file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please use JPEG, PNG, WebP, or GIF.',
    };
  }

  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size must be less than 5MB.',
    };
  }

  // Check minimum size (1KB)
  const minSize = 1024; // 1KB
  if (file.size < minSize) {
    return {
      valid: false,
      error: 'File size is too small. Please choose a larger image.',
    };
  }

  return { valid: true };
}

/**
 * Get file signature (magic number) for additional security
 */
export function getFileSignature(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const uint8Array = new Uint8Array(arrayBuffer.slice(0, 4));
      const signature = Array.from(uint8Array)
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
      resolve(signature);
    };
    reader.onerror = () => reject(new Error('Failed to read file signature'));
    reader.readAsArrayBuffer(file.slice(0, 4));
  });
}

/**
 * Validate file signature against known image signatures
 */
export async function validateFileSignature(
  file: File
): Promise<{ valid: boolean; error?: string }> {
  const signatures = {
    FFD8FF: 'JPEG',
    '89504E47': 'PNG',
    '52494646': 'WebP (RIFF)',
    '47494638': 'GIF',
  };

  try {
    const signature = await getFileSignature(file);

    // Check for known image signatures
    const isValidSignature = Object.keys(signatures).some((sig) =>
      signature.startsWith(sig)
    );

    if (!isValidSignature) {
      return {
        valid: false,
        error: 'Invalid file format. Please upload a valid image file.',
      };
    }

    return { valid: true };
  } catch {
    return {
      valid: false,
      error: 'Failed to validate file format.',
    };
  }
}
