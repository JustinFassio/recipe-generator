import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wand2, Settings, Info } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ImageGenerationSettings {
  autoGenerationEnabled: boolean;
  defaultQuality: 'standard' | 'hd';
  defaultSize: '1024x1024' | '1024x1792' | '1792x1024';
  fallbackOnError: boolean;
  showGenerationHints: boolean;
  promptStyle: 'photographic' | 'artistic' | 'minimalist' | 'luxury';
  promptMood: 'appetizing' | 'elegant' | 'rustic' | 'modern';
  promptFocus: 'dish' | 'ingredients' | 'process' | 'presentation';
}

const defaultSettings: ImageGenerationSettings = {
  autoGenerationEnabled: true,
  defaultQuality: 'standard',
  defaultSize: '1024x1024',
  fallbackOnError: true,
  showGenerationHints: true,
  promptStyle: 'photographic',
  promptMood: 'appetizing',
  promptFocus: 'dish',
};

export function ImageGenerationSettings() {
  const [settings, setSettings] =
    useState<ImageGenerationSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // In the future, this could load from user profile or localStorage
      const savedSettings = localStorage.getItem('imageGenerationSettings');
      if (savedSettings) {
        setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
      }
    } catch (error) {
      console.error('Failed to load image generation settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // In the future, this could save to user profile
      localStorage.setItem('imageGenerationSettings', JSON.stringify(settings));
      toast({
        title: 'Settings Saved',
        description: 'Your image generation preferences have been updated.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Failed to save image generation settings:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save your settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = <K extends keyof ImageGenerationSettings>(
    key: K,
    value: ImageGenerationSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const getCostEstimate = (): number => {
    const costs = {
      '1024x1024': { standard: 0.04, hd: 0.08 },
      '1024x1792': { standard: 0.08, hd: 0.12 },
      '1792x1024': { standard: 0.08, hd: 0.12 },
    };

    return costs[settings.defaultSize]?.[settings.defaultQuality] || 0.04;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wand2 className="h-5 w-5" />
            <span>Image Generation Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-gray-500">Loading settings...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Wand2 className="h-5 w-5" />
          <span>Image Generation Settings</span>
        </CardTitle>
        <CardDescription>
          Configure how AI-generated images are created for your recipes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Auto-Generation Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-generation" className="text-base font-medium">
              Automatic Image Generation
            </Label>
            <p className="text-sm text-gray-600">
              Automatically generate images when saving new recipes
            </p>
          </div>
          <Switch
            id="auto-generation"
            checked={settings.autoGenerationEnabled}
            onCheckedChange={(checked) =>
              updateSetting('autoGenerationEnabled', checked)
            }
          />
        </div>

        {/* Default Quality */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Default Quality</Label>
          <div className="flex space-x-2">
            <Button
              type="button"
              variant={
                settings.defaultQuality === 'standard' ? 'default' : 'outline'
              }
              size="sm"
              onClick={() => updateSetting('defaultQuality', 'standard')}
            >
              Standard
            </Button>
            <Button
              type="button"
              variant={settings.defaultQuality === 'hd' ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateSetting('defaultQuality', 'hd')}
            >
              HD
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Standard: Faster, lower cost. HD: Higher quality, higher cost.
          </p>
        </div>

        {/* Default Size */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Default Size</Label>
          <div className="flex space-x-2">
            <Button
              type="button"
              variant={
                settings.defaultSize === '1024x1024' ? 'default' : 'outline'
              }
              size="sm"
              onClick={() => updateSetting('defaultSize', '1024x1024')}
            >
              Square (1024×1024)
            </Button>
            <Button
              type="button"
              variant={
                settings.defaultSize === '1024x1792' ? 'default' : 'outline'
              }
              size="sm"
              onClick={() => updateSetting('defaultSize', '1024x1792')}
            >
              Portrait (1024×1792)
            </Button>
            <Button
              type="button"
              variant={
                settings.defaultSize === '1792x1024' ? 'default' : 'outline'
              }
              size="sm"
              onClick={() => updateSetting('defaultSize', '1792x1024')}
            >
              Landscape (1792×1024)
            </Button>
          </div>
        </div>

        {/* Fallback on Error */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="fallback-error" className="text-base font-medium">
              Fallback on Error
            </Label>
            <p className="text-sm text-gray-600">
              Try simplified prompts if initial generation fails
            </p>
          </div>
          <Switch
            id="fallback-error"
            checked={settings.fallbackOnError}
            onCheckedChange={(checked) =>
              updateSetting('fallbackOnError', checked)
            }
          />
        </div>

        {/* Show Generation Hints */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="generation-hints" className="text-base font-medium">
              Show Generation Hints
            </Label>
            <p className="text-sm text-gray-600">
              Display helpful tips for better image generation
            </p>
          </div>
          <Switch
            id="generation-hints"
            checked={settings.showGenerationHints}
            onCheckedChange={(checked) =>
              updateSetting('showGenerationHints', checked)
            }
          />
        </div>

        {/* Prompt Style */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Default Prompt Style</Label>
          <div className="flex space-x-2">
            <Button
              type="button"
              variant={
                settings.promptStyle === 'photographic' ? 'default' : 'outline'
              }
              size="sm"
              onClick={() => updateSetting('promptStyle', 'photographic')}
            >
              Photographic
            </Button>
            <Button
              type="button"
              variant={
                settings.promptStyle === 'artistic' ? 'default' : 'outline'
              }
              size="sm"
              onClick={() => updateSetting('promptStyle', 'artistic')}
            >
              Artistic
            </Button>
            <Button
              type="button"
              variant={
                settings.promptStyle === 'minimalist' ? 'default' : 'outline'
              }
              size="sm"
              onClick={() => updateSetting('promptStyle', 'minimalist')}
            >
              Minimalist
            </Button>
            <Button
              type="button"
              variant={
                settings.promptStyle === 'luxury' ? 'default' : 'outline'
              }
              size="sm"
              onClick={() => updateSetting('promptStyle', 'luxury')}
            >
              Luxury
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            The visual style used for generated images
          </p>
        </div>

        {/* Prompt Mood */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Default Prompt Mood</Label>
          <div className="flex space-x-2">
            <Button
              type="button"
              variant={
                settings.promptMood === 'appetizing' ? 'default' : 'outline'
              }
              size="sm"
              onClick={() => updateSetting('promptMood', 'appetizing')}
            >
              Appetizing
            </Button>
            <Button
              type="button"
              variant={
                settings.promptMood === 'elegant' ? 'default' : 'outline'
              }
              size="sm"
              onClick={() => updateSetting('promptMood', 'elegant')}
            >
              Elegant
            </Button>
            <Button
              type="button"
              variant={settings.promptMood === 'rustic' ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateSetting('promptMood', 'rustic')}
            >
              Rustic
            </Button>
            <Button
              type="button"
              variant={settings.promptMood === 'modern' ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateSetting('promptMood', 'modern')}
            >
              Modern
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            The emotional tone and mood of generated images
          </p>
        </div>

        {/* Cost Information */}
        <div className="rounded-lg border bg-blue-50 p-4">
          <div className="flex items-start space-x-2">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-medium text-blue-900">Cost Information</h4>
              <p className="text-sm text-blue-800">
                Current settings will cost approximately{' '}
                <Badge variant="outline" className="mx-1">
                  ${getCostEstimate().toFixed(2)}
                </Badge>{' '}
                per image.
              </p>
              <div className="text-xs text-blue-700">
                <p>
                  • Standard quality: $0.04 (square), $0.08 (portrait/landscape)
                </p>
                <p>• HD quality: $0.08 (square), $0.12 (portrait/landscape)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={saveSettings} disabled={isSaving}>
            <Settings className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
