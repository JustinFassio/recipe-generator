# Phase 3: UI/UX Implementation

## Overview

**Feature-First Implementation**: Implement atomic, user-friendly interface components for profile management and onboarding that align with the revised Phase 1 database schema. Prioritize safety, accessibility, and ease of use while following established codebase patterns.

## Design Principles

1. **Safety-First Visual Design**: Allergies and health data prominently displayed
2. **Progressive Disclosure**: Show relevant information at the right time
3. **Accessibility-First**: WCAG 2.2 AA compliance, keyboard navigation
4. **Mobile-Responsive**: Touch-friendly, adaptive layouts
5. **Clear Information Architecture**: Logical grouping and intuitive navigation

## Profile Management Implementation

### 1. Account Settings Page Structure (Aligned with Phase 1)

```typescript
// src/pages/settings-page.tsx
interface SettingsPageProps {
  user: User;
  profile: Profile;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ user, profile }) => {
  const sections = [
    {
      id: 'basic',
      title: 'Basic Profile',
      icon: User,
      component: BasicProfileSettings, // Phase 1A data
      priority: 'high'
    },
    {
      id: 'safety',
      title: 'Safety & Dietary',
      icon: Shield,
      component: SafetySettings, // Phase 1B data
      priority: 'high'
    },
    {
      id: 'cooking',
      title: 'Cooking Preferences',
      icon: ChefHat,
      component: CookingSettings, // Phase 1C data
      priority: 'medium'
    },
    {
      id: 'privacy',
      title: 'Privacy & Data',
      icon: Lock,
      component: PrivacySettings,
      priority: 'low'
    }
  ];

  return (
    <div className="settings-page">
      <SettingsHeader user={user} />
      <SettingsNavigation sections={sections} />
      <SettingsContent sections={sections} />
    </div>
  );
};
```

### 2. Atomic Settings Components (Aligned with Phase 1)

```typescript
// src/components/settings/BasicProfileSettings.tsx - Phase 1A
const BasicProfileSettings: React.FC = () => {
  const { profile, updateProfile } = useAuth();
  const [profileData, setProfileData] = useState({
    region: profile?.region || '',
    language: profile?.language || 'en',
    units: profile?.units || 'metric',
    time_per_meal: profile?.time_per_meal || 30,
    skill_level: profile?.skill_level || 'beginner'
  });

  return (
    <SettingsSection title="Basic Profile">
      <div className="profile-grid">
        <FormField label="Region">
          <Input
            value={profileData.region}
            onChange={(value) => setProfileData({ ...profileData, region: value })}
            placeholder="e.g., United States, Canada, UK"
          />
        </FormField>

        <FormField label="Units">
          <Select
            value={profileData.units}
            onValueChange={(units) => setProfileData({ ...profileData, units })}
          >
            <SelectItem value="metric">Metric</SelectItem>
            <SelectItem value="imperial">Imperial</SelectItem>
          </Select>
        </FormField>

        <FormField label="Time per meal (minutes)">
          <Slider
            value={[profileData.time_per_meal]}
            onValueChange={([time_per_meal]) => setProfileData({ ...profileData, time_per_meal })}
            min={10}
            max={120}
            step={5}
          />
        </FormField>

        <FormField label="Skill Level">
          <Select
            value={profileData.skill_level}
            onValueChange={(skill_level) => setProfileData({ ...profileData, skill_level })}
          >
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </Select>
        </FormField>
      </div>

      <SettingsActions
        onSave={() => updateProfile(profileData)}
        onReset={() => setProfileData({
          region: profile?.region || '',
          language: profile?.language || 'en',
          units: profile?.units || 'metric',
          time_per_meal: profile?.time_per_meal || 30,
          skill_level: profile?.skill_level || 'beginner'
        })}
      />
    </SettingsSection>
  );
};

// src/components/settings/SafetySettings.tsx - Phase 1B
const SafetySettings: React.FC = () => {
  const { user } = useAuth();
  const [safetyData, setSafetyData] = useState({
    allergies: [],
    dietary_restrictions: []
  });

  return (
    <SettingsSection title="Safety & Dietary Restrictions">
      <div className="safety-grid">
        <div className="allergies-card">
          <h3>Food Allergies</h3>
          <p className="description">
            These will be strictly avoided in all recipe recommendations.
          </p>
          <AllergySelector
            selected={safetyData.allergies}
            onChange={(allergies) => setSafetyData({ ...safetyData, allergies })}
          />
        </div>

        <div className="dietary-card">
          <h3>Dietary Restrictions</h3>
          <DietaryRestrictionsSelector
            selected={safetyData.dietary_restrictions}
            onChange={(dietary_restrictions) => setSafetyData({ ...safetyData, dietary_restrictions })}
          />
        </div>
      </div>

      <SettingsActions
        onSave={() => updateUserSafety(user.id, safetyData)}
        onReset={() => setSafetyData({ allergies: [], dietary_restrictions: [] })}
      />
    </SettingsSection>
  );
};

// src/components/settings/CookingSettings.tsx - Phase 1C
const CookingSettings: React.FC = () => {
  const { user } = useAuth();
  const [cookingData, setCookingData] = useState({
    preferred_cuisines: [],
    available_equipment: [],
    disliked_ingredients: [],
    spice_tolerance: 3
  });

  return (
    <SettingsSection title="Cooking Preferences">
      <div className="cooking-grid">
        <FormField label="Preferred Cuisines">
          <CuisineSelector
            selected={cookingData.preferred_cuisines}
            onChange={(preferred_cuisines) => setCookingData({ ...cookingData, preferred_cuisines })}
          />
        </FormField>

        <FormField label="Available Equipment">
          <EquipmentSelector
            selected={cookingData.available_equipment}
            onChange={(available_equipment) => setCookingData({ ...cookingData, available_equipment })}
          />
        </FormField>

        <FormField label="Spice Tolerance">
          <Slider
            value={[cookingData.spice_tolerance]}
            onValueChange={([spice_tolerance]) => setCookingData({ ...cookingData, spice_tolerance })}
            min={1}
            max={5}
            step={1}
          />
        </FormField>

        <FormField label="Disliked Ingredients">
          <Textarea
            value={cookingData.disliked_ingredients.join(', ')}
            onChange={(value) => setCookingData({
              ...cookingData,
              disliked_ingredients: value.split(',').map(s => s.trim()).filter(Boolean)
            })}
            placeholder="e.g., cilantro, mushrooms, olives"
          />
        </FormField>
      </div>

      <SettingsActions
        onSave={() => updateCookingPreferences(user.id, cookingData)}
        onReset={() => setCookingData({
          preferred_cuisines: [],
          available_equipment: [],
          disliked_ingredients: [],
          spice_tolerance: 3
        })}
      />
    </SettingsSection>
  );
};
```

### 3. Quick Profile Templates

```typescript
// src/components/settings/ProfileTemplates.tsx
interface ProfileTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType;
  data: Partial<UserSafety & UserHealth & UserPreferences>;
}

const profileTemplates: ProfileTemplate[] = [
  {
    id: 'kid-friendly',
    name: 'Kid-Friendly',
    description: 'Safe, simple recipes for children',
    icon: Baby,
    data: {
      allergies: [],
      intolerances: [],
      dietary_pattern: ['omnivore'],
      spice_level: 1,
      skill_level: 'beginner',
      time_per_meal: '20-40'
    }
  },
  {
    id: 'pregnancy-aware',
    name: 'Pregnancy-Aware',
    description: 'Safe recipes for pregnancy',
    icon: Heart,
    data: {
      health_concerns: ['pregnancy'],
      dietary_pattern: ['omnivore'],
      spice_level: 2,
      skill_level: 'intermediate'
    }
  },
  {
    id: 'diabetes-friendly',
    name: 'Diabetes-Friendly',
    description: 'Blood sugar conscious recipes',
    icon: Activity,
    data: {
      health_concerns: ['diabetes'],
      dietary_pattern: ['omnivore'],
      spice_level: 3,
      skill_level: 'intermediate'
    }
  }
];

const ProfileTemplates: React.FC = () => {
  const { updateProfile } = useAuth();

  const applyTemplate = async (template: ProfileTemplate) => {
    await updateProfile(template.data);
    toast({
      title: 'Profile Updated',
      description: `${template.name} settings applied successfully.`,
    });
  };

  return (
    <div className="profile-templates">
      <h3>Quick Setup Templates</h3>
      <p>Choose a template to quickly configure your profile:</p>

      <div className="templates-grid">
        {profileTemplates.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            onApply={() => applyTemplate(template)}
          />
        ))}
      </div>
    </div>
  );
};
```

## Onboarding Experience Implementation

### 1. Multi-Step Wizard Container

```typescript
// src/components/onboarding/OnboardingWizard.tsx
interface OnboardingWizardProps {
  mode: 'minimal' | 'advanced';
  onComplete: (data: OnboardingFormData) => void;
  onSkip: () => void;
}

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  mode,
  onComplete,
  onSkip
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<OnboardingFormData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = mode === 'minimal' ? minimalSteps : advancedSteps;
  const currentStepData = steps[currentStep];

  const handleNext = async () => {
    if (currentStep === steps.length - 1) {
      setIsSubmitting(true);
      try {
        await onComplete(formData);
      } catch (error) {
        console.error('Onboarding completion failed:', error);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="onboarding-wizard">
      {/* Progress Indicator */}
      <OnboardingProgress
        currentStep={currentStep}
        totalSteps={steps.length}
        stepTitle={currentStepData.title}
      />

      {/* Step Content */}
      <div className="step-content">
        <currentStepData.component
          data={formData}
          onChange={setFormData}
          onNext={handleNext}
          onBack={handleBack}
        />
      </div>

      {/* Navigation */}
      <OnboardingNavigation
        currentStep={currentStep}
        totalSteps={steps.length}
        onNext={handleNext}
        onBack={handleBack}
        onSkip={onSkip}
        canSkip={currentStepData.canSkip}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
```

### 2. Progress Indicator Component

```typescript
// src/components/onboarding/OnboardingProgress.tsx
interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  stepTitle: string;
}

const OnboardingProgress: React.FC<OnboardingProgressProps> = ({
  currentStep,
  totalSteps,
  stepTitle
}) => {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="onboarding-progress">
      <div className="progress-header">
        <h2>{stepTitle}</h2>
        <span className="step-counter">
          Step {currentStep + 1} of {totalSteps}
        </span>
      </div>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${progress}%` }}
          aria-label={`${progress}% complete`}
        />
      </div>

      <div className="step-indicators">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={`step-dot ${i <= currentStep ? 'completed' : ''} ${i === currentStep ? 'current' : ''}`}
            aria-label={`Step ${i + 1}${i === currentStep ? ' (current)' : ''}`}
          />
        ))}
      </div>
    </div>
  );
};
```

### 3. Smart Defaults and Suggestions

```typescript
// src/hooks/useSmartDefaults.ts
const useSmartDefaults = (userLocation?: string) => {
  const getRegionalDefaults = (region: string) => {
    const defaults = {
      US: { units: 'imperial', cuisines: ['american', 'mexican', 'italian'] },
      CA: { units: 'metric', cuisines: ['canadian', 'american', 'italian'] },
      UK: { units: 'metric', cuisines: ['british', 'indian', 'italian'] },
      AU: {
        units: 'metric',
        cuisines: ['australian', 'asian', 'mediterranean'],
      },
    };
    return defaults[region] || defaults['US'];
  };

  const getTimeBasedDefaults = (userAgent: string) => {
    const isMobile = /Mobile|Android|iPhone/i.test(userAgent);
    return {
      time_per_meal: isMobile ? '20-40' : '30-45',
      skill_level: 'intermediate',
    };
  };

  return {
    getRegionalDefaults,
    getTimeBasedDefaults,
  };
};
```

### 4. Validation and Error Handling

```typescript
// src/utils/onboardingValidation.ts
interface ValidationRule {
  field: string;
  required?: boolean;
  validator?: (value: any) => boolean;
  message: string;
}

const validationRules: ValidationRule[] = [
  {
    field: 'dietary_pattern',
    required: true,
    message: 'Please select a dietary pattern',
  },
  {
    field: 'allergies',
    validator: (allergies) =>
      !allergies.includes('peanut') || allergies.length > 1,
    message: 'Please specify all allergies if you have a peanut allergy',
  },
  {
    field: 'time_per_meal',
    required: true,
    message: 'Please select your preferred cooking time',
  },
];

export const validateOnboardingData = (
  data: OnboardingFormData
): ValidationResult => {
  const errors: ValidationError[] = [];

  validationRules.forEach((rule) => {
    const value = data[rule.field];

    if (
      rule.required &&
      (!value || (Array.isArray(value) && value.length === 0))
    ) {
      errors.push({ field: rule.field, message: rule.message });
    }

    if (rule.validator && !rule.validator(value)) {
      errors.push({ field: rule.field, message: rule.message });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};
```

## Privacy and Data Management

### 1. Privacy Controls Component

```typescript
// src/components/settings/PrivacySettings.tsx
const PrivacySettings: React.FC = () => {
  const [privacySettings, setPrivacySettings] = useState({
    shareAnalytics: true,
    shareUsageData: false,
    allowPersonalization: true,
    allowMarketing: false
  });

  return (
    <SettingsSection title="Privacy & Data">
      <div className="privacy-options">
        <PrivacyToggle
          title="Share Analytics"
          description="Help us improve by sharing anonymous usage data"
          checked={privacySettings.shareAnalytics}
          onChange={(checked) => setPrivacySettings({ ...privacySettings, shareAnalytics: checked })}
        />

        <PrivacyToggle
          title="Personalization"
          description="Use your data to provide personalized recipe recommendations"
          checked={privacySettings.allowPersonalization}
          onChange={(checked) => setPrivacySettings({ ...privacySettings, allowPersonalization: checked })}
        />

        <PrivacyToggle
          title="Marketing Communications"
          description="Receive updates about new features and recipes"
          checked={privacySettings.allowMarketing}
          onChange={(checked) => setPrivacySettings({ ...privacySettings, allowMarketing: checked })}
        />
      </div>

      <div className="data-actions">
        <Button variant="outline" onClick={handleExportData}>
          Export My Data
        </Button>
        <Button variant="destructive" onClick={handleDeleteData}>
          Delete My Data
        </Button>
      </div>
    </SettingsSection>
  );
};
```

### 2. Data Export/Deletion

```typescript
// src/utils/dataManagement.ts
export const exportUserData = async (userId: string) => {
  const data = await supabase
    .from('profiles')
    .select(
      `
      *,
      user_safety(*),
      user_health(*),
      user_preferences(*),
      household_members(*)
    `
    )
    .eq('id', userId)
    .single();

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `recipe-generator-data-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const deleteUserData = async (userId: string) => {
  const confirmed = window.confirm(
    'This will permanently delete all your data. This action cannot be undone. Are you sure?'
  );

  if (confirmed) {
    await supabase.auth.admin.deleteUser(userId);
    toast({
      title: 'Account Deleted',
      description: 'Your account and all data have been permanently deleted.',
    });
  }
};
```

## Mobile-Responsive Design

### 1. Responsive Layout System

```typescript
// src/components/layout/ResponsiveContainer.tsx
const ResponsiveContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="responsive-container">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
```

### 2. Mobile-Optimized Forms

```typescript
// src/components/forms/MobileFormField.tsx
interface MobileFormFieldProps {
  label: string;
  type: 'text' | 'select' | 'checkbox' | 'radio';
  value: any;
  onChange: (value: any) => void;
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
  error?: string;
}

const MobileFormField: React.FC<MobileFormFieldProps> = ({
  label,
  type,
  value,
  onChange,
  options,
  required,
  error
}) => {
  return (
    <div className="mobile-form-field">
      <label className="field-label">
        {label}
        {required && <span className="required">*</span>}
      </label>

      <div className="field-input">
        {type === 'select' && (
          <Select
            value={value}
            onValueChange={onChange}
            options={options}
            className="mobile-select"
          />
        )}

        {type === 'checkbox' && (
          <CheckboxGroup
            options={options}
            selected={value}
            onChange={onChange}
            className="mobile-checkbox-group"
          />
        )}
      </div>

      {error && <div className="field-error">{error}</div>}
    </div>
  );
};
```

## Accessibility Implementation

### 1. Keyboard Navigation

```typescript
// src/hooks/useKeyboardNavigation.ts
const useKeyboardNavigation = (
  totalSteps: number,
  onNext: () => void,
  onBack: () => void
) => {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowRight':
        case 'Enter':
          event.preventDefault();
          onNext();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          onBack();
          break;
        case 'Escape':
          event.preventDefault();
          // Handle escape action
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [onNext, onBack]);
};
```

### 2. Screen Reader Support

```typescript
// src/components/accessibility/ScreenReaderAnnouncement.tsx
const ScreenReaderAnnouncement: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
};
```

## Implementation Timeline

### Week 1: Core Settings Page

- Settings page layout and navigation
- Safety settings component
- Basic form validation

### Week 2: Onboarding Wizard

- Multi-step wizard container
- Progress indicators
- Basic step components

### Week 3: Advanced Features

- Profile templates
- Privacy controls
- Data export/import

### Week 4: Polish & Testing

- Mobile optimization
- Accessibility improvements
- User testing & iteration

## Success Metrics

### Usability Metrics

- Time to complete settings setup
- Error rate in form submission
- Mobile vs desktop completion rates
- Accessibility compliance score

### User Engagement

- Settings page visit frequency
- Profile completion rates
- Template usage statistics
- Privacy setting adoption

### Technical Metrics

- Form validation error rates
- Data export/import success rates
- Mobile performance scores
- Accessibility audit results

This implementation provides a comprehensive, accessible, and user-friendly interface for profile management while maintaining the clean, atomic component architecture of the existing codebase.
