import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { recipeApi } from '@/lib/api';
import { Recipe, RecipeVersion } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface CreateVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe;
  nextVersionNumber: number;
  onVersionCreated: (newVersion: RecipeVersion) => void;
  editedRecipeData?: Partial<Recipe>; // NEW: Pass the edited content
}

export function CreateVersionModal({
  isOpen,
  onClose,
  recipe,
  nextVersionNumber,
  onVersionCreated,
  editedRecipeData,
}: CreateVersionModalProps) {
  const [versionName, setVersionName] = useState('');
  const [changelog, setChangelog] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!changelog.trim()) {
      toast({
        title: 'Changelog Required',
        description: 'Please describe what changed in this version.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Use the current recipe ID and pass the edited content!
      const newVersion = await recipeApi.createNewVersion(
        recipe.id,
        versionName.trim() || 'Untitled Version',
        changelog.trim(),
        editedRecipeData // Pass the fucking edited content!
      );

      toast({
        title: 'Version Created!',
        description: `Version ${nextVersionNumber} has been created successfully.`,
      });

      onVersionCreated(newVersion);
      onClose();

      // Reset form
      setVersionName('');
      setChangelog('');
    } catch (error) {
      console.error('Failed to create version:', error);
      toast({
        title: 'Error',
        description: 'Failed to create new version. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      // Reset form when closing
      setVersionName('');
      setChangelog('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Version</DialogTitle>
          <DialogDescription>
            This will create version {nextVersionNumber} of "{recipe.title}".
            The new version will start with a fresh set of ratings and views.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="version-name" className="text-sm font-medium">
              Version Name{' '}
              <span className="text-muted-foreground">(optional)</span>
            </label>
            <Input
              id="version-name"
              placeholder="e.g., Gluten-Free Version, Extra Spicy, Quick Version"
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              disabled={isSubmitting}
              maxLength={100}
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="changelog" className="text-sm font-medium">
              What Changed? <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="changelog"
              placeholder="e.g., Added roasted vegetables for extra flavor, reduced cooking time by 15 minutes, made dairy-free by substituting coconut milk..."
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              disabled={isSubmitting}
              rows={4}
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground text-right">
              {changelog.length}/500
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              `Create Version ${nextVersionNumber}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
