# Phase 2: Profile Onboarding Flow

## Overview

**Feature-First Implementation**: Implement a progressive, user-friendly onboarding system that collects essential personalization data while respecting user time and privacy. Build atomic components that align with the revised Phase 1 database schema and follow established codebase patterns.

## Design Principles

1. **Safety First**: Allergies and dietary restrictions are mandatory
2. **Progressive Enhancement**: Start simple, add complexity based on engagement
3. **Skip-Friendly**: Users can complete minimal setup and return later
4. **Mobile-Optimized**: Touch-friendly, responsive design
5. **Clear Value**: Show immediate benefits of each data point

## Feature-Aligned Onboarding Approach

### Phase 1A Onboarding: Basic Profile Setup (60-90 seconds)

**Goal**: Collect data for Phase 1A database schema (extended profiles table)

**Required Fields**:

- Region (text field)
- Units (metric/imperial selection)
- Time per meal (10-120 minutes slider)

**Optional Fields**:

- Language (dropdown with default 'en')
- Skill level (beginner/intermediate/advanced)

### Phase 1B Onboarding: Safety Data (30-60 seconds)

**Goal**: Collect data for Phase 1B database schema (user_safety table)

**Required Fields**:

- Allergies (multi-select from common allergens + custom input)
- Dietary restrictions (multi-select: vegan, vegetarian, etc.)

### Phase 1C Onboarding: Cooking Preferences (30-60 seconds)

**Goal**: Collect data for Phase 1C database schema (cooking_preferences table)

**Optional Fields**:

- Preferred cuisines (multi-select)
- Available equipment (multi-select)
- Disliked ingredients (text input)
- Spice tolerance (1-5 scale)

## Incremental User Flow Strategy

### Immediate Onboarding (Post-Signup)

**Trigger**: After user completes account creation
**Components**: Phase 1A onboarding only
**Goal**: Get basic personalization data to start using the app

1. Welcome screen with value proposition
2. Region & units selection
3. Time per meal preference
4. Optional: Language and skill level
5. Start cooking immediately

### Progressive Enhancement (Settings Page)

**Trigger**: User visits settings or after using app 2-3 times
**Components**: Phase 1B and 1C onboarding
**Goal**: Collect safety and preference data for better personalization

1. Safety data collection (Phase 1B)
   - Allergies and dietary restrictions
   - Clear safety value proposition
2. Cooking preferences (Phase 1C)
   - Cuisines and equipment
   - Spice tolerance and dislikes

## Implementation Plan

### Step 1: Create Atomic Onboarding Components

```typescript
// src/components/onboarding/
├── OnboardingWizard.tsx          // Main wizard container
├── WelcomeStep.tsx               // Introduction & value prop
├── BasicProfileStep.tsx          // Phase 1A: region, units, time, skill
├── SafetyStep.tsx                // Phase 1B: allergies & dietary restrictions
├── CookingPreferencesStep.tsx    // Phase 1C: cuisines, equipment, spice
├── OnboardingProgress.tsx        // Progress indicator
└── OnboardingNavigation.tsx      // Navigation controls
```

### Step 2: Atomic Form Components

```typescript
// src/components/onboarding/forms/
├── BasicProfileForm.tsx          // Phase 1A: region, units, time, skill
├── SafetyForm.tsx                // Phase 1B: allergies, dietary restrictions
└── CookingPreferencesForm.tsx    // Phase 1C: cuisines, equipment, spice
```

### Step 3: Aligned Onboarding Context & State Management

```typescript
// src/contexts/OnboardingContext.tsx
interface OnboardingState {
  currentPhase: '1A' | '1B' | '1C';
  currentStep: number;
  totalSteps: number;
  completedPhases: Set<string>;
  formData: OnboardingFormData;
  canSkip: boolean;
}

interface OnboardingFormData {
  // Phase 1A: Basic profile extensions
  region?: string;
  language?: string;
  units?: 'metric' | 'imperial';
  time_per_meal?: number;
  skill_level?: 'beginner' | 'intermediate' | 'advanced';

  // Phase 1B: Safety data
  allergies?: string[];
  dietary_restrictions?: string[];

  // Phase 1C: Cooking preferences
  preferred_cuisines?: string[];
  available_equipment?: string[];
  disliked_ingredients?: string[];
  spice_tolerance?: number;
}
```

## User Experience Design

### Immediate Onboarding Flow (Phase 1A)

```
Welcome → Basic Profile Setup → Start Cooking
   ↓         ↓                    ↓
  30s      60-90s              Immediate
```

**Key Features**:

- Essential data only (region, units, time, skill)
- Clear progress indicator
- Skip options for optional fields
- Mobile-optimized touch targets

### Progressive Enhancement Flow (Phase 1B + 1C)

```
Settings Prompt → Safety Data → Cooking Preferences → Enhanced Experience
       ↓              ↓              ↓                    ↓
      30s           30-60s         30-60s              Immediate
```

**Key Features**:

- Triggered contextually (after 2-3 app uses)
- Safety-first messaging
- Clear value proposition for each phase
- Independent completion (can do 1B without 1C)

## Component Architecture

### OnboardingWizard Component

```typescript
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

  const steps = mode === 'minimal' ? minimalSteps : advancedSteps;

  return (
    <div className="onboarding-wizard">
      <OnboardingProgress
        currentStep={currentStep}
        totalSteps={steps.length}
      />

      {steps[currentStep]}

      <OnboardingNavigation
        currentStep={currentStep}
        totalSteps={steps.length}
        onNext={() => setCurrentStep(prev => prev + 1)}
        onBack={() => setCurrentStep(prev => prev - 1)}
        onSkip={onSkip}
        canSkip={steps[currentStep].canSkip}
      />
    </div>
  );
};
```

### Safety Form Component

```typescript
const SafetyForm: React.FC<SafetyFormProps> = ({ data, onChange }) => {
  const commonAllergies = [
    'peanut', 'tree_nut', 'milk', 'egg', 'wheat',
    'soy', 'fish', 'shellfish', 'sesame'
  ];

  return (
    <div className="safety-form">
      <h2>Safety First</h2>
      <p>Help us keep you safe by sharing any allergies or dietary restrictions.</p>

      <div className="allergies-section">
        <h3>Food Allergies</h3>
        <CheckboxGroup
          options={commonAllergies}
          selected={data.allergies}
          onChange={(allergies) => onChange({ ...data, allergies })}
        />
        <TextInput
          placeholder="Other allergies..."
          value={data.other_allergens}
          onChange={(other_allergens) => onChange({ ...data, other_allergens })}
        />
      </div>

      <div className="dietary-section">
        <h3>Dietary Preferences</h3>
        <RadioGroup
          options={['omnivore', 'vegetarian', 'vegan', 'pescatarian']}
          selected={data.dietary_pattern[0]}
          onChange={(pattern) => onChange({ ...data, dietary_pattern: [pattern] })}
        />
      </div>
    </div>
  );
};
```

## Integration Points

### 1. Profile Page Integration

```typescript
// src/pages/profile-page.tsx
const ProfilePage = () => {
  const { profile, user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Show onboarding if profile is incomplete
  useEffect(() => {
    if (profile && !profile.time_per_meal) {
      setShowOnboarding(true);
    }
  }, [profile]);

  return (
    <div>
      {showOnboarding ? (
        <OnboardingWizard
          mode="minimal"
          onComplete={handleOnboardingComplete}
          onSkip={() => setShowOnboarding(false)}
        />
      ) : (
        <ProfileContent />
      )}
    </div>
  );
};
```

### 2. Settings Page Integration

```typescript
// src/pages/settings-page.tsx
const SettingsPage = () => {
  const sections = [
    { id: 'safety', title: 'Safety & Dietary', component: SafetySettings },
    { id: 'preferences', title: 'Preferences', component: PreferencesSettings },
    { id: 'health', title: 'Health Context', component: HealthSettings },
    { id: 'household', title: 'Household', component: HouseholdSettings },
  ];

  return (
    <div className="settings-page">
      <h1>Account Settings</h1>
      {sections.map(section => (
        <SettingsSection key={section.id} {...section} />
      ))}
    </div>
  );
};
```

## Data Persistence Strategy

### 1. Progressive Saving

```typescript
const useOnboardingData = () => {
  const saveProgress = async (data: Partial<OnboardingFormData>) => {
    // Save to localStorage for offline support
    localStorage.setItem('onboarding_progress', JSON.stringify(data));

    // Save to database when possible
    if (user) {
      await updateUserProfile(data);
    }
  };

  const loadProgress = () => {
    const saved = localStorage.getItem('onboarding_progress');
    return saved ? JSON.parse(saved) : {};
  };

  return { saveProgress, loadProgress };
};
```

### 2. Validation & Error Handling

```typescript
const validateOnboardingData = (data: OnboardingFormData): ValidationResult => {
  const errors: string[] = [];

  // Safety validation
  if (!data.dietary_pattern?.length) {
    errors.push('Please select a dietary pattern');
  }

  // Region validation
  if (!data.region) {
    errors.push('Please select your region');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
```

## Success Metrics

### Completion Rates

- Minimal onboarding completion: Target 85%
- Advanced onboarding completion: Target 60%
- Time to complete minimal: Target <90 seconds
- Time to complete advanced: Target <5 minutes

### User Engagement

- Profile completion rate by section
- Return rate after skipping
- Settings page usage
- Data update frequency

### AI Performance

- Recipe relevance scores
- Safety incident rate
- User satisfaction with recommendations

## Implementation Timeline

### Week 1: Core Components

- OnboardingWizard container
- SafetyForm component
- Basic navigation

### Week 2: Data Collection

- PreferencesForm
- HealthForm (advanced)
- Data validation

### Week 3: Integration

- Profile page integration
- Settings page updates
- Progress persistence

### Week 4: Polish & Testing

- Mobile optimization
- Accessibility improvements
- User testing & iteration

This approach provides a smooth, progressive onboarding experience that respects user time while collecting the data needed for optimal AI recipe recommendations.
