# Phase 2: Profile Onboarding Flow

## Overview

Implement a progressive, user-friendly onboarding system that collects essential personalization data while respecting user time and privacy. Focus on safety-critical data first, then build comprehensive profiles for optimal AI recommendations.

## Design Principles

1. **Safety First**: Allergies and dietary restrictions are mandatory
2. **Progressive Enhancement**: Start simple, add complexity based on engagement
3. **Skip-Friendly**: Users can complete minimal setup and return later
4. **Mobile-Optimized**: Touch-friendly, responsive design
5. **Clear Value**: Show immediate benefits of each data point

## Two-Tier Onboarding Approach

### Tier 1: Minimal Onboarding (60-90 seconds)

**Goal**: Get users cooking safely with basic personalization

**Required Fields**:

- Region & units (for recipe scaling and measurements)
- Dietary restrictions (allergies, intolerances, basic diet)
- Time per meal (for recipe filtering)

**Optional Fields**:

- Skill level
- Budget preference

**User Flow**:

1. Welcome screen with value proposition
2. Region & units selection (dropdown)
3. Safety checklist (allergies, intolerances, dietary restrictions)
4. Time preference (quick selection)
5. Optional: Skill level & budget
6. Start cooking immediately

### Tier 2: Advanced Onboarding (5 minutes)

**Goal**: Comprehensive personalization for optimal AI recommendations

**Additional Data**:

- Health context (conditions, medications, targets)
- Cultural preferences (cuisines, spice tolerance)
- Equipment availability
- Household members
- Traditional medicine preferences (optional)

**User Flow**:

1. Health context collection
2. Cultural & preference setup
3. Kitchen equipment inventory
4. Household member management
5. Traditional medicine opt-in
6. Review & confirmation

## Implementation Plan

### Step 1: Create Onboarding Components

```typescript
// src/components/onboarding/
├── OnboardingWizard.tsx          // Main wizard container
├── WelcomeStep.tsx               // Introduction & value prop
├── SafetyStep.tsx                // Allergies & dietary restrictions
├── PreferencesStep.tsx           // Basic preferences
├── HealthStep.tsx                // Health context (advanced)
├── CultureStep.tsx               // Cultural preferences (advanced)
├── EquipmentStep.tsx             // Kitchen equipment (advanced)
├── HouseholdStep.tsx             // Family members (advanced)
├── ReviewStep.tsx                // Summary & confirmation
└── OnboardingProgress.tsx        // Progress indicator
```

### Step 2: Data Collection Forms

```typescript
// src/components/onboarding/forms/
├── SafetyForm.tsx                // Allergies, intolerances, diet
├── PreferencesForm.tsx           // Time, skill, budget
├── HealthForm.tsx                // Health concerns, medications
├── CultureForm.tsx               // Cuisines, spice level, dislikes
├── EquipmentForm.tsx             // Available cooking equipment
└── HouseholdForm.tsx             // Family member management
```

### Step 3: Onboarding Context & State Management

```typescript
// src/contexts/OnboardingContext.tsx
interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  isMinimalMode: boolean;
  completedSteps: Set<number>;
  formData: OnboardingFormData;
  canSkip: boolean;
}

interface OnboardingFormData {
  // Safety data
  allergies: string[];
  intolerances: string[];
  dietary_pattern: string[];

  // Basic preferences
  region: string;
  units: 'metric' | 'imperial';
  time_per_meal: string;
  skill_level?: string;
  budget?: string;

  // Advanced data
  health_concerns?: string[];
  medications?: string[];
  cuisines?: string[];
  spice_level?: number;
  equipment?: string[];
  household_members?: HouseholdMember[];
}
```

## User Experience Design

### Minimal Onboarding Flow

```
Welcome → Safety → Preferences → Start Cooking
   ↓         ↓         ↓           ↓
  30s      30s       30s        Immediate
```

**Key Features**:

- Clear progress indicator
- Skip options for non-critical fields
- Immediate value demonstration
- Mobile-optimized touch targets

### Advanced Onboarding Flow

```
Welcome → Safety → Preferences → Health → Culture → Equipment → Household → Review
   ↓         ↓         ↓         ↓        ↓         ↓          ↓         ↓
  30s      30s       30s       60s      60s       60s        60s       30s
```

**Key Features**:

- Detailed explanations for each section
- Smart defaults based on region/culture
- Preview of AI recommendations
- Save progress functionality

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
