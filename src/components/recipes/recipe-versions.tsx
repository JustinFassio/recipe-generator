import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { recipeApi } from '@/lib/api';
import { Recipe } from '@/lib/types';
import { CreateVersionModal } from './create-version-modal';

interface RecipeVersionsProps {
  existingRecipe?: Recipe;
  disabled?: boolean;
  className?: string;
}

export function RecipeVersions({
  existingRecipe,
  disabled = false,
  className = '',
}: RecipeVersionsProps) {
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [nextVersionNumber, setNextVersionNumber] = useState(2);
  const navigate = useNavigate();

  // Calculate next version number for existing public recipes
  useEffect(() => {
    if (existingRecipe?.is_public) {
      const fetchNextVersion = async () => {
        try {
          const originalId =
            existingRecipe.parent_recipe_id || existingRecipe.id;
          const nextVersion = await recipeApi.getNextVersionNumber(originalId);
          setNextVersionNumber(nextVersion);
        } catch (error) {
          console.error('Failed to get next version number:', error);
          setNextVersionNumber(2); // fallback
        }
      };
      fetchNextVersion();
    }
  }, [existingRecipe]);

  const handleVersionCreated = (newRecipe: Recipe) => {
    // Navigate to the new version
    navigate(`/recipe/${newRecipe.id}`, {
      state: { refresh: Date.now() },
    });
  };

  // Don't render anything if recipe is not public or doesn't exist
  if (!existingRecipe?.is_public) {
    return null;
  }

  return (
    <div className={className}>
      {/* Create New Version Button */}
      <Button
        type="button"
        variant="outline"
        onClick={() => setShowVersionModal(true)}
        disabled={disabled}
      >
        Create New Version
      </Button>

      {/* Version Creation Modal */}
      <CreateVersionModal
        isOpen={showVersionModal}
        onClose={() => setShowVersionModal(false)}
        recipe={existingRecipe}
        nextVersionNumber={nextVersionNumber}
        onVersionCreated={handleVersionCreated}
      />
    </div>
  );
}
