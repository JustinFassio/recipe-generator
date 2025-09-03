import {
  createDaisyUICardClasses,
  createDaisyUICardTitleClasses,
} from '@/lib/card-migration';
import { createDaisyUIBadgeClasses } from '@/lib/badge-migration';
import { Trash2, Edit, Eye, Share, Check, Loader2 } from 'lucide-react';
import CategoryChip from '@/components/ui/CategoryChip';
import type { Recipe } from '@/lib/types';
import { useDeleteRecipe } from '@/hooks/use-recipes';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { recipeApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthProvider';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Constants
const RECIPE_TITLE_MAX_LENGTH = 45;

interface RecipeCardProps {
  recipe: Recipe;
  onEdit?: (recipe: Recipe) => void;
  onView?: (recipe: Recipe) => void;
  showShareButton?: boolean;
  onShareToggle?:
    | ((recipeId: string, isPublic: boolean) => void)
    | (() => void);
}

export function RecipeCard({
  recipe,
  onEdit,
  onView,
  showShareButton,
  onShareToggle,
}: RecipeCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isPublic, setIsPublic] = useState(recipe.is_public);
  const [showButtons, setShowButtons] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const deleteRecipe = useDeleteRecipe();
  const { user } = useAuth();

  // Only show share button if explicitly requested and user owns the recipe
  const canShare = showShareButton && user?.id === recipe.user_id;

  // Simplified and reliable mobile detection
  useEffect(() => {
    const detectDevice = () => {
      // Primary: Check user agent for mobile devices
      const isMobileUserAgent = /iPhone|iPad|iPod|Android|Mobile|Tablet/i.test(
        navigator.userAgent
      );

      // Secondary: Check for touch capability and small screen
      const isTouchDevice =
        'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 768;

      // Mobile = mobile user agent OR (touch device + small screen)
      // Fallback: if we detect touch capability, treat as mobile regardless of screen size
      const mobile =
        isMobileUserAgent || (isTouchDevice && isSmallScreen) || isTouchDevice;

      setIsMobile(mobile);

      // Enhanced debug logging for production troubleshooting
      console.log('🔍 Mobile Detection (Production Debug):', {
        userAgent: navigator.userAgent,
        isMobileUserAgent,
        isTouchDevice,
        isSmallScreen,
        windowWidth: window.innerWidth,
        maxTouchPoints: navigator.maxTouchPoints,
        hasOntouchstart: 'ontouchstart' in window,
        finalMobile: mobile,
        // Additional iPhone-specific checks
        isIPhone: /iPhone/i.test(navigator.userAgent),
        isIPad: /iPad/i.test(navigator.userAgent),
        isSafari: /Safari/i.test(navigator.userAgent),
        // Touch capability checks
        touchEvents: {
          ontouchstart: 'ontouchstart' in window,
          ontouchmove: 'ontouchmove' in window,
          ontouchend: 'ontouchend' in window,
        },
      });
    };

    detectDevice();
    window.addEventListener('resize', detectDevice);

    return () => window.removeEventListener('resize', detectDevice);
  }, []);

  // Touch event handlers for mobile
  const handleTouchStart = () => {
    if (isMobile) {
      console.log('📱 Touch Start - Showing buttons');
      setShowButtons(true);
    } else {
      // Fallback: if mobile detection failed, still try to handle touch
      console.log(
        '📱 Touch Start (Fallback) - Mobile detection may have failed'
      );
      setShowButtons(true);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isMobile) {
      e.preventDefault();
      // Don't hide buttons immediately on touch end
      // Let the click outside handler manage hiding
    } else {
      // Fallback: handle touch even if mobile detection failed
      e.preventDefault();
    }
  };

  // Click outside handler to hide buttons
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        if (isMobile) {
          console.log('📱 Click outside - Hiding buttons');
          setShowButtons(false);
        }
      }
    };

    if (isMobile && showButtons) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }
  }, [isMobile, showButtons]);

  // Desktop hover behavior
  const handleMouseEnter = () => {
    if (!isMobile) {
      setShowButtons(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setShowButtons(false);
    }
  };

  const handleDelete = () => {
    deleteRecipe.mutate(recipe.id);
    setShowDeleteDialog(false);
  };

  const handleShareToggle = async () => {
    setIsSharing(true);
    try {
      await recipeApi.toggleRecipePublic(recipe.id, !isPublic);
      setIsPublic(!isPublic);
      // Call the callback if it exists, handling both signature types
      if (onShareToggle) {
        if (onShareToggle.length === 2) {
          // Callback expects (recipeId, isPublic) parameters
          (onShareToggle as (recipeId: string, isPublic: boolean) => void)(
            recipe.id,
            !isPublic
          );
        } else {
          // Callback expects no parameters
          (onShareToggle as () => void)();
        }
      }
    } catch (error) {
      console.error('Error toggling recipe sharing:', error);
      // No need to revert state - it was never changed if API call failed
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <>
      <div
        ref={cardRef}
        className={`${createDaisyUICardClasses('bordered')} group relative overflow-hidden border border-gray-200 transition-all duration-200 hover:border-gray-300 hover:shadow-lg`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {recipe.image_url && (
          <div className="aspect-video overflow-hidden">
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          </div>
        )}

        {/* Recipe Title - Above Image */}
        <div className="px-4 pt-4 pb-2">
          <h3
            className={`${createDaisyUICardTitleClasses()} text-lg font-semibold leading-tight text-gray-800`}
            title={recipe.title}
          >
            {recipe.title.length > RECIPE_TITLE_MAX_LENGTH
              ? `${recipe.title.substring(0, RECIPE_TITLE_MAX_LENGTH).trim()}...`
              : recipe.title}
          </h3>
        </div>

        {/* Action Buttons - Top Right */}
        <div className="absolute top-2 right-2 z-20">
          <div
            className={`flex items-center space-x-1 transition-all duration-200 ${
              showButtons
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-95 pointer-events-none'
            }`}
            style={{
              // Ensure buttons are always clickable when visible
              pointerEvents: showButtons ? 'auto' : 'none',
            }}
          >
            {canShare && (
              <Button
                variant={isPublic ? 'default' : 'outline'}
                size="sm"
                className="h-8 px-2 bg-white/95 hover:bg-white border-2 border-gray-200 hover:border-gray-300 shadow-lg"
                onClick={handleShareToggle}
                disabled={isSharing}
                aria-label={isPublic ? 'Unshare recipe' : 'Share recipe'}
              >
                {isSharing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isPublic ? (
                  <>
                    <Check className="mr-1 h-4 w-4" />
                    Unshare
                  </>
                ) : (
                  <>
                    <Share className="mr-1 h-4 w-4" />
                    Share
                  </>
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 bg-white/95 hover:bg-white border border-gray-200 hover:border-gray-300 shadow-lg"
              onClick={() => onView?.(recipe)}
              aria-label="View recipe"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 bg-white/95 hover:bg-white border border-gray-200 hover:border-gray-300 shadow-lg"
              onClick={() => onEdit?.(recipe)}
              aria-label="Edit recipe"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 bg-white/95 hover:bg-white border border-gray-200 hover:border-gray-300 shadow-lg"
              onClick={() => setShowDeleteDialog(true)}
              aria-label="Delete recipe"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="card-body pb-3 pt-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span
                className={createDaisyUIBadgeClasses('secondary', 'text-xs')}
              >
                {recipe.ingredients.length} ingredients
              </span>
              <span className="text-xs">
                {new Date(recipe.created_at).toLocaleDateString('en-US')}
              </span>
            </div>

            {recipe.categories && recipe.categories.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {recipe.categories.map((category, index) => (
                  <CategoryChip
                    key={`${category}-${index}`}
                    category={category}
                    variant="readonly"
                    size="sm"
                  />
                ))}
              </div>
            )}

            {recipe.instructions && (
              <p className="line-clamp-3 text-sm text-gray-600">
                {recipe.instructions}
              </p>
            )}

            {recipe.notes && (
              <div className="border-t pt-2">
                <p className="line-clamp-2 text-xs text-gray-500 italic">
                  {recipe.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recipe</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{recipe.title}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
