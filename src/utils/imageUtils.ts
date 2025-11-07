/**
 * Image upload and processing utilities
 * Handles resizing, validation, and conversion to base64
 *
 * TODO: Backend Integration
 * - Add image upload endpoint (POST /api/assistants/{id}/avatar)
 * - Store images in cloud storage (AWS S3, Cloudinary, etc.)
 * - Add database column for avatar image URL
 * - Update Assistant model to include avatarImageUrl field
 */

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
const TARGET_SIZE = 200; // Target dimensions for avatar

export interface ImageValidationError {
  type: 'size' | 'format';
  message: string;
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): ImageValidationError | null {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      type: 'size',
      message: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`
    };
  }

  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      type: 'format',
      message: 'Only JPG and PNG images are allowed'
    };
  }

  return null;
}

/**
 * Resize image to target dimensions while maintaining aspect ratio
 * Returns a base64 data URL
 */
export async function resizeImage(
  file: File,
  targetSize: number = TARGET_SIZE
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Calculate dimensions (crop to square)
        const size = Math.min(img.width, img.height);
        const x = (img.width - size) / 2;
        const y = (img.height - size) / 2;

        // Set canvas size
        canvas.width = targetSize;
        canvas.height = targetSize;

        // Draw and resize image (cropped to center square)
        ctx.drawImage(
          img,
          x, y, size, size,  // source
          0, 0, targetSize, targetSize  // destination
        );

        // Convert to base64
        const base64 = canvas.toDataURL('image/jpeg', 0.9);
        resolve(base64);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Process uploaded image file
 * Validates, resizes, and returns base64
 */
export async function processImageUpload(file: File): Promise<{
  success: boolean;
  data?: string;
  error?: ImageValidationError;
}> {
  // Validate
  const validationError = validateImageFile(file);
  if (validationError) {
    return { success: false, error: validationError };
  }

  try {
    // Resize and convert
    const base64 = await resizeImage(file);
    return { success: true, data: base64 };
  } catch (error) {
    return {
      success: false,
      error: {
        type: 'format',
        message: 'Failed to process image'
      }
    };
  }
}
