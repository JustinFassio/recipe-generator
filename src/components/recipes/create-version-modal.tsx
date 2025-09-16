import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { recipeApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { Recipe } from '@/lib/types';

interface CreateVersionModalProps {
  originalRecipe: Recipe;
  onVersionCreated: (newVersion: Recipe) => void;
  onClose: () => void;
}

export function CreateVersionModal({
  originalRecipe,
  onVersionCreated,
  onClose,
}: CreateVersionModalProps) {
  const [versionName, setVersionName] = useState('');
  const [changelog, setChangelog] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!versionName.trim() || !changelog.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both a version name and changelog.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsCreating(true);

      // Create new version with the same recipe data but updated metadata
      const newVersion = await recipeApi.createNewVersion(
        originalRecipe.parent_recipe_id || originalRecipe.id,
        {
          title: originalRecipe.title,
          ingredients: originalRecipe.ingredients,
          instructions: originalRecipe.instructions,
          notes: originalRecipe.notes,
          image_url: originalRecipe.image_url,
          categories: originalRecipe.categories,
          setup: originalRecipe.setup,
          is_public: originalRecipe.is_public,
          creator_rating: originalRecipe.creator_rating,
          version_number: 1, // Will be overridden by API
          parent_recipe_id: null, // Will be set by API
          is_version: true, // Will be set by API
        },
        versionName.trim(),
        changelog.trim()
      );

      toast({
        title: 'Version Created',
        description: `Version "${versionName}" has been created successfully!`,
      });

      onVersionCreated(newVersion);
      onClose();
    } catch (error) {
      console.error('Error creating version:', error);
      toast({
        title: 'Error',
        description: 'Failed to create new version. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Create New Version</h3>
              <p className="text-sm text-gray-600 mt-1">
                Create a new version of "{originalRecipe.title}"
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isCreating}
            >
              ✕
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Version Name *
              </label>
              <input
                type="text"
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                placeholder="e.g., Added more spices, Gluten-free version, etc."
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isCreating}
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">
                {versionName.length}/100 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What's Changed? *
              </label>
              <Textarea
                value={changelog}
                onChange={(e) => setChangelog(e.target.value)}
                placeholder="Describe what you've changed or improved in this version..."
                rows={4}
                className="w-full resize-none"
                disabled={isCreating}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {changelog.length}/500 characters
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">i</span>
                  </div>
                </div>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">How versioning works:</p>
                  <ul className="text-xs space-y-1 text-blue-700">
                    <li>• This creates a copy of your current recipe as a new version</li>
                    <li>• You can then edit the new version independently</li>
                    <li>• Both versions will be available to the community</li>
                    <li>• Ratings are tracked separately for each version</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating || !versionName.trim() || !changelog.trim()}
            >
              {isCreating ? 'Creating...' : 'Create Version'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
