import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { recipeApi } from '@/lib/api';
import { Recipe, RecipeVersion } from '@/lib/types';
import { RecipeFormData } from '@/lib/schemas';
import { CreateVersionModal } from './create-version-modal';

interface RecipeVersionsProps {
  existingRecipe?: Recipe;
  currentFormData?: RecipeFormData; // NEW: Current form data
  disabled?: boolean;
  className?: string;
}

export function RecipeVersions({
  existingRecipe,
  currentFormData,
  disabled = false,
  className = '',
}: RecipeVersionsProps) {
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [nextVersionNumber, setNextVersionNumber] = useState(2);
  const navigate = useNavigate();

  // Calculate next version number for existing recipes
  useEffect(() => {
    if (existingRecipe) {
      const fetchNextVersion = async () => {
        try {
          // Use the current recipe ID (no more parent_recipe_id logic!)
          const nextVersion = await recipeApi.getNextVersionNumber(existingRecipe.id);
          setNextVersionNumber(nextVersion);
        } catch (error) {
          console.error('Failed to get next version number:', error);
          setNextVersionNumber(2); // fallback
        }
      };
      fetchNextVersion();
    }
  }, [existingRecipe]);

  const handleVersionCreated = (newVersion: RecipeVersion) => {
    console.log('🎉 [handleVersionCreated] New version created:', {
      versionId: newVersion.id,
      recipeId: newVersion.recipe_id,
      versionNumber: newVersion.version_number,
      versionName: newVersion.version_name
    });
    
    // Navigate to the newly created version (latest version)
    navigate(`/recipe/${newVersion.recipe_id}?version=${newVersion.version_number}`, {
      state: { refresh: Date.now() },
    });
    
    console.log(`🌐 Redirecting to latest version: /recipe/${newVersion.recipe_id}?version=${newVersion.version_number}`);
  };

  // Don't render anything if recipe doesn't exist
  if (!existingRecipe) {
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
        editedRecipeData={currentFormData} // Pass the fucking edited content!
      />
    </div>
  );
}
