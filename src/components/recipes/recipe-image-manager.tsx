import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Upload, 
  X, 
  Star, 
  Edit3, 
  Trash2,
  Image as ImageIcon,
  Check
} from 'lucide-react';
import { AIImageGenerator } from './ai-image-generator';
import { processImageFile } from '@/lib/image-utils';
import { toast } from '@/hooks/use-toast';
// import type { RecipeImage } from '@/lib/types'; // Not used in this component

interface ImageWithMetadata {
  id: string;
  file?: File;
  preview: string;
  image_url?: string;
  caption: string;
  alt_text: string;
  is_primary: boolean;
  is_new: boolean;
  is_ai_generated?: boolean;
}

interface RecipeImageManagerProps {
  recipeData: Record<string, any>; // Using any for now since RecipeFormData is not exported
  onImagesChange: (images: ImageWithMetadata[]) => void;
  onPrimaryImageChange: (imageId: string) => void;
  disabled?: boolean;
  className?: string;
}

export function RecipeImageManager({
  recipeData,
  onImagesChange,
  onPrimaryImageChange,
  disabled = false,
  className = '',
}: RecipeImageManagerProps) {
  const [images, setImages] = useState<ImageWithMetadata[]>([]);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
  const handleFileUpload = useCallback(async (files: FileList) => {
    setIsUploading(true);
    const newImages: ImageWithMetadata[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const result = await processImageFile(file);

        if (result.success) {
          const newImage: ImageWithMetadata = {
            id: `new-${Date.now()}-${i}`,
            file: result.compressedFile,
            preview: result.previewUrl,
            caption: '',
            alt_text: `${recipeData.title || 'Recipe'} - Image ${images.length + newImages.length + 1}`,
            is_primary: images.length === 0 && newImages.length === 0, // First image is primary by default
            is_new: true,
          };
          newImages.push(newImage);
        } else {
          toast({
            title: 'Invalid Image',
            description: `${file.name}: ${result.error}`,
            variant: 'destructive',
          });
        }
      }

      if (newImages.length > 0) {
        const updatedImages = [...images, ...newImages];
        setImages(updatedImages);
        onImagesChange(updatedImages);
        
        toast({
          title: 'Images Added',
          description: `${newImages.length} image(s) added successfully.`,
        });
      }
    } catch {
      toast({
        title: 'Upload Error',
        description: 'Failed to process some images.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  }, [images, recipeData.title, onImagesChange]);

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileUpload]);

  // Set primary image
  const setPrimaryImage = useCallback((imageId: string) => {
    const updatedImages = images.map(img => ({
      ...img,
      is_primary: img.id === imageId,
    }));
    setImages(updatedImages);
    onImagesChange(updatedImages);
    onPrimaryImageChange(imageId);
    
    toast({
      title: 'Primary Image Updated',
      description: 'The primary image has been set.',
    });
  }, [images, onImagesChange, onPrimaryImageChange]);

  // Delete image
  const deleteImage = useCallback((imageId: string) => {
    const imageToDelete = images.find(img => img.id === imageId);
    const updatedImages = images.filter(img => img.id !== imageId);
    
    // If we deleted the primary image, make the first remaining image primary
    if (imageToDelete?.is_primary && updatedImages.length > 0) {
      updatedImages[0].is_primary = true;
      onPrimaryImageChange(updatedImages[0].id);
    }
    
    setImages(updatedImages);
    onImagesChange(updatedImages);
    
    toast({
      title: 'Image Deleted',
      description: 'Image has been removed.',
    });
  }, [images, onImagesChange, onPrimaryImageChange]);

  // Update image metadata
  const updateImageMetadata = useCallback((imageId: string, updates: Partial<ImageWithMetadata>) => {
    const updatedImages = images.map(img => 
      img.id === imageId ? { ...img, ...updates } : img
    );
    setImages(updatedImages);
    onImagesChange(updatedImages);
    setEditingImage(null);
    
    toast({
      title: 'Image Updated',
      description: 'Image metadata has been updated.',
    });
  }, [images, onImagesChange]);

  // Handle AI image generation
  const handleAIImageGenerated = useCallback((imageUrl: string) => {
    const newImage: ImageWithMetadata = {
      id: `ai-${Date.now()}`,
      preview: imageUrl,
      image_url: imageUrl,
      caption: '',
      alt_text: `${recipeData.title || 'Recipe'} - AI Generated Image`,
      is_primary: images.length === 0, // Primary if it's the first image
      is_new: true,
      is_ai_generated: true,
    };

    const updatedImages = [...images, newImage];
    setImages(updatedImages);
    onImagesChange(updatedImages);
    
    if (images.length === 0) {
      onPrimaryImageChange(newImage.id);
    }
    
    toast({
      title: 'AI Image Generated',
      description: 'AI-generated image has been added to your recipe.',
    });
  }, [images, recipeData.title, onImagesChange, onPrimaryImageChange]);

  const primaryImage = images.find(img => img.is_primary);
  const hasImages = images.length > 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          disabled 
            ? 'border-gray-200 bg-gray-50' 
            : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-blue-600" />
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {hasImages ? 'Add More Images' : 'Add Recipe Images'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Drag and drop images here, or click to browse
            </p>
          </div>
          
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Choose Images
              </>
            )}
          </Button>
        </div>
      </div>

      {/* AI Image Generation */}
      <div className="border-t pt-6">
        <h4 className="font-medium text-gray-900 mb-4 flex items-center">
          <ImageIcon className="w-5 h-5 mr-2" />
          AI Image Generation
        </h4>
        <AIImageGenerator
          recipe={recipeData}
          onImageGenerated={handleAIImageGenerated}
          onError={(error) => {
            toast({
              title: 'Generation Failed',
              description: error,
              variant: 'destructive',
            });
          }}
        />
      </div>

      {/* Image Gallery */}
      {hasImages && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">
              Recipe Images ({images.length})
            </h4>
            {primaryImage && (
              <Badge variant="outline" className="text-blue-600 border-blue-200">
                <Star className="w-3 h-3 mr-1" />
                Primary: {primaryImage.caption || 'Untitled'}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
                  image.is_primary 
                    ? 'border-blue-500 ring-2 ring-blue-200' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Image */}
                <div className="aspect-video bg-gray-100">
                  <img
                    src={image.preview}
                    alt={image.alt_text}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setEditingImage(image.id)}
                    disabled={disabled}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  
                  {!image.is_primary && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => setPrimaryImage(image.id)}
                      disabled={disabled}
                    >
                      <Star className="w-4 h-4" />
                    </Button>
                  )}
                  
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteImage(image.id)}
                    disabled={disabled}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Primary Badge */}
                {image.is_primary && (
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-blue-500 text-white">
                      <Star className="w-3 h-3 mr-1" />
                      Primary
                    </Badge>
                  </div>
                )}

                {/* AI Generated Badge */}
                {image.is_ai_generated && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      AI
                    </Badge>
                  </div>
                )}

                {/* Caption */}
                {image.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2">
                    <p className="text-sm truncate">{image.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Metadata Editor Modal */}
      {editingImage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Edit Image</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingImage(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {(() => {
                const image = images.find(img => img.id === editingImage);
                if (!image) return null;

                return (
                  <div className="space-y-4">
                    {/* Image Preview */}
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={image.preview}
                        alt={image.alt_text}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Caption */}
                    <div>
                      <Label htmlFor="caption">Caption</Label>
                      <Textarea
                        id="caption"
                        value={image.caption}
                        onChange={(e) => {
                          const updatedImages = images.map(img => 
                            img.id === editingImage ? { ...img, caption: e.target.value } : img
                          );
                          setImages(updatedImages);
                        }}
                        placeholder="Add a caption for this image..."
                        rows={2}
                      />
                    </div>

                    {/* Alt Text */}
                    <div>
                      <Label htmlFor="alt_text">Alt Text</Label>
                      <Input
                        id="alt_text"
                        value={image.alt_text}
                        onChange={(e) => {
                          const updatedImages = images.map(img => 
                            img.id === editingImage ? { ...img, alt_text: e.target.value } : img
                          );
                          setImages(updatedImages);
                        }}
                        placeholder="Describe this image for accessibility..."
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2 pt-4">
                      <Button
                        type="button"
                        onClick={() => {
                          updateImageMetadata(editingImage, {});
                        }}
                        className="flex-1"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditingImage(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* No Images State */}
      {!hasImages && (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium mb-2">No images yet</p>
          <p className="text-sm">Upload images or generate one with AI to get started</p>
        </div>
      )}
    </div>
  );
}
