import React, { useState } from 'react';
import { createDaisyUICardClasses } from '@/lib/card-migration';
import { ProgressiveImage } from '@/components/shared/ProgressiveImage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  StarOff, 
  Trash2, 
  Edit, 
  Plus,
  Image as ImageIcon,
  Sparkles,
  Upload
} from 'lucide-react';
import { useRecipeImages, useSetPrimaryImage, useDeleteRecipeImage } from '@/hooks/use-recipe-images';
import type { RecipeImage } from '@/lib/types';
import { getSafeImageUrl } from '@/lib/image-cache-utils';

interface RecipeImageGalleryProps {
  recipeId: string;
  recipeTitle: string;
  mainImageUrl?: string | null;
  mainImageUpdatedAt?: string;
  mainImageCreatedAt?: string;
  canEdit?: boolean;
  onAddImage?: () => void;
  onEditImage?: (image: RecipeImage) => void;
  className?: string;
}

export function RecipeImageGallery({
  recipeId,
  recipeTitle,
  mainImageUrl,
  mainImageUpdatedAt,
  mainImageCreatedAt,
  canEdit = false,
  onAddImage,
  onEditImage,
  className = '',
}: RecipeImageGalleryProps) {
  const { data: galleryImages = [], isLoading } = useRecipeImages(recipeId);
  const setPrimaryImage = useSetPrimaryImage();
  const deleteImage = useDeleteRecipeImage();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Combine main recipe image with gallery images
  const allImages = React.useMemo(() => {
    const combined: Array<RecipeImage & { isMainImage?: boolean }> = [];
    
    // Add main recipe image first if it exists
    if (mainImageUrl) {
      combined.push({
        id: 'main-image',
        recipe_id: recipeId,
        image_url: mainImageUrl,
        is_primary: true,
        caption: null,
        alt_text: `${recipeTitle} - Main Image`,
        display_order: 0,
        created_at: mainImageCreatedAt || new Date().toISOString(),
        uploaded_by: null,
        generation_method: 'migrated' as const,
        generation_cost_id: null,
        metadata: {},
        updated_at: mainImageUpdatedAt || new Date().toISOString(),
        isMainImage: true,
      });
    }
    
    // Add gallery images
    combined.push(...galleryImages);
    
    return combined;
  }, [mainImageUrl, mainImageCreatedAt, mainImageUpdatedAt, galleryImages, recipeId, recipeTitle]);

  // Don't render if no images
  if (isLoading) {
    return (
      <div className={`${createDaisyUICardClasses('bordered')} ${className}`}>
        <div className="card-body">
          <div className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
            <div className="flex space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 w-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (allImages.length === 0) {
    return (
      <div className={`${createDaisyUICardClasses('bordered')} ${className}`}>
        <div className="card-body text-center py-12">
          <ImageIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Images Yet</h3>
          <p className="text-gray-500 mb-4">
            Add images to showcase your {recipeTitle} recipe
          </p>
          {canEdit && onAddImage && (
            <Button onClick={onAddImage} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Image
            </Button>
          )}
        </div>
      </div>
    );
  }

  const currentImage = allImages[currentIndex];
  const safeImageUrl = getSafeImageUrl(
    currentImage.image_url,
    currentImage.updated_at,
    currentImage.created_at,
    '/recipe-generator-logo.png'
  );

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  const handleSetPrimary = () => {
    setPrimaryImage.mutate({ recipeId, imageId: currentImage.id });
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      // Don't allow deleting the main image through the gallery
      if (currentImage.isMainImage) {
        alert('The main recipe image cannot be deleted from the gallery. Please edit the recipe to change the main image.');
        return;
      }
      
      deleteImage.mutate(currentImage.id);
      // Adjust current index if needed
      if (currentIndex >= allImages.length - 1) {
        setCurrentIndex(Math.max(0, allImages.length - 2));
      }
    }
  };

  const getGenerationMethodIcon = (method: string) => {
    switch (method) {
      case 'ai_generated':
        return <Sparkles className="h-3 w-3" />;
      case 'manual':
        return <Upload className="h-3 w-3" />;
      case 'migrated':
        return <ImageIcon className="h-3 w-3" />;
      default:
        return <ImageIcon className="h-3 w-3" />;
    }
  };

  const getGenerationMethodColor = (method: string) => {
    switch (method) {
      case 'ai_generated':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'manual':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'migrated':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className={`${createDaisyUICardClasses('bordered')} ${className}`}>
      <div className="card-body">
        <div className="flex items-center justify-between mb-4">
          <h3 className="card-title text-lg">
            <ImageIcon className="h-5 w-5 mr-2" />
            Recipe Images ({allImages.length})
          </h3>
          {canEdit && onAddImage && (
            <Button onClick={onAddImage} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Image
            </Button>
          )}
        </div>

        {/* Main Image Display */}
        <div className="relative mb-4">
          <div 
            className="aspect-video overflow-hidden rounded-lg bg-gray-100 cursor-pointer"
            onClick={() => setIsFullscreen(true)}
          >
            {safeImageUrl && (
              <ProgressiveImage
                src={safeImageUrl}
                alt={currentImage.alt_text || `${recipeTitle} - Image ${currentIndex + 1}`}
                className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
                loading="eager"
                placeholder="/recipe-generator-logo.png"
              />
            )}
          </div>

          {/* Navigation Arrows */}
          {allImages.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-lg"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-lg"
                onClick={handleNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Image Info Overlay */}
          <div className="absolute bottom-2 left-2 right-2">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="outline"
                    className={`text-xs ${getGenerationMethodColor(currentImage.generation_method)}`}
                  >
                    {getGenerationMethodIcon(currentImage.generation_method)}
                    <span className="ml-1 capitalize">
                      {currentImage.generation_method.replace('_', ' ')}
                    </span>
                  </Badge>
                  {currentImage.is_primary && (
                    <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-700 border-yellow-200">
                      <Star className="h-3 w-3 mr-1" />
                      Primary
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-gray-600">
                  {currentIndex + 1} of {allImages.length}
                </span>
              </div>
              {currentImage.caption && (
                <p className="text-sm text-gray-700 mt-1">{currentImage.caption}</p>
              )}
            </div>
          </div>
        </div>

        {/* Thumbnail Strip */}
        {allImages.length > 1 && (
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {allImages.map((image, index) => {
              const thumbnailUrl = getSafeImageUrl(
                image.image_url,
                image.updated_at,
                image.created_at,
                '/recipe-generator-logo.png'
              );
              
              return (
                <div
                  key={image.id}
                  className={`relative flex-shrink-0 cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    index === currentIndex
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setCurrentIndex(index)}
                >
                  <div className="w-16 h-16">
                    {thumbnailUrl && (
                      <ProgressiveImage
                        src={thumbnailUrl}
                        alt={`${recipeTitle} - Thumbnail ${index + 1}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        placeholder="/recipe-generator-logo.png"
                      />
                    )}
                  </div>
                  {image.is_primary && (
                    <div className="absolute top-1 right-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        {canEdit && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSetPrimary}
                disabled={currentImage.is_primary || setPrimaryImage.isPending}
              >
                {currentImage.is_primary ? (
                  <>
                    <Star className="h-4 w-4 mr-2 fill-current" />
                    Primary
                  </>
                ) : (
                  <>
                    <StarOff className="h-4 w-4 mr-2" />
                    Set Primary
                  </>
                )}
              </Button>
              {onEditImage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditImage(currentImage)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={deleteImage.isPending}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/30 text-white"
              onClick={() => setIsFullscreen(false)}
            >
              ✕
            </Button>
            {safeImageUrl && (
              <ProgressiveImage
                src={safeImageUrl}
                alt={currentImage.alt_text || `${recipeTitle} - Full Size`}
                className="max-w-full max-h-full object-contain"
                loading="eager"
                placeholder="/recipe-generator-logo.png"
              />
            )}
            {allImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white"
                  onClick={handleNext}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
