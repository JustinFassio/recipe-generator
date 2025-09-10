# Nested Drawer Design for FilterBar

**Purpose**: Design specification for implementing nested drawer functionality in the FilterBar component  
**Target**: Mobile and tablet responsive behavior  
**Status**: 🔧 In Development

---

## 🎯 Problem Statement

The current drawer implementation shows all filter options at once, creating cognitive overload similar to the original problem. Users are presented with:

- Categories (with all category options expanded)
- Cuisines (with all cuisine options expanded)
- Moods (with all mood options expanded)
- Available Ingredients (with all ingredient options expanded)

This defeats the purpose of the drawer interface, which should simplify the user experience.

---

## 🏗️ Solution: Nested Drawer Architecture

### **Two-Level Drawer System**

#### **Level 1: Main Filter Drawer**

- Shows 4 filter type buttons only
- Clean, simple interface
- Each button shows selection count when filters are applied
- "Clear All" and "Done" actions

#### **Level 2: Individual Filter Drawer**

- Opens when a filter type is selected from Level 1
- Shows only the options for that specific filter type
- "Back" button to return to Level 1
- "Clear This Filter" action for the specific filter type

---

## 📱 User Experience Flow

### **Opening Filters**

1. User taps "Filters & Search" button
2. **Main drawer opens** showing:
   - Search bar
   - Categories button (with count if selected)
   - Cuisines button (with count if selected)
   - Moods button (with count if selected)
   - Available Ingredients button (with count if selected)
   - Clear All button (if any filters active)
   - Done button

### **Selecting a Filter Type**

1. User taps "Categories" button
2. **Nested drawer opens** showing:
   - "Categories" header with back arrow
   - Search bar for categories
   - Grouped category options
   - Clear Categories button
   - Done button

### **Navigation Options**

- **Back Arrow**: Returns to main drawer (Level 1)
- **Done**: Closes both drawers completely
- **Clear This Filter**: Clears only the current filter type
- **Clear All**: (from main drawer) Clears all filters

---

## 🔧 Technical Implementation

### **State Management**

```typescript
interface DrawerState {
  isMainDrawerOpen: boolean;
  activeNestedDrawer:
    | 'categories'
    | 'cuisines'
    | 'moods'
    | 'ingredients'
    | null;
}

const [drawerState, setDrawerState] = useState<DrawerState>({
  isMainDrawerOpen: false,
  activeNestedDrawer: null,
});
```

### **Main Drawer Interface**

```typescript
const MainDrawerContent = () => (
  <div className="space-y-4">
    {/* Search Bar */}
    <SearchInput />

    {/* Filter Type Buttons */}
    <div className="space-y-2">
      <FilterTypeButton
        type="categories"
        label="Categories"
        count={selectedCategories.length}
        onClick={() => openNestedDrawer('categories')}
      />
      <FilterTypeButton
        type="cuisines"
        label="Cuisines"
        count={selectedCuisines.length}
        onClick={() => openNestedDrawer('cuisines')}
      />
      <FilterTypeButton
        type="moods"
        label="Moods"
        count={selectedMoods.length}
        onClick={() => openNestedDrawer('moods')}
      />
      <FilterTypeButton
        type="ingredients"
        label="Available Ingredients"
        count={selectedIngredients.length}
        onClick={() => openNestedDrawer('ingredients')}
      />
    </div>

    {/* Actions */}
    <DrawerActions />
  </div>
);
```

### **Nested Drawer Interface**

```typescript
const NestedDrawerContent = ({ filterType }: { filterType: string }) => (
  <div className="space-y-4">
    {/* Header with Back Button */}
    <div className="flex items-center gap-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setDrawerState(prev => ({ ...prev, activeNestedDrawer: null }))}
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <h3 className="text-lg font-semibold">{filterType}</h3>
    </div>

    {/* Filter-Specific Content */}
    <FilterSectionContent filterType={filterType} />

    {/* Actions */}
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={() => clearSpecificFilter(filterType)}
        className="flex-1"
      >
        Clear {filterType}
      </Button>
      <Button
        onClick={() => closeAllDrawers()}
        className="flex-1"
      >
        Done
      </Button>
    </div>
  </div>
);
```

### **Filter Type Button Component**

```typescript
interface FilterTypeButtonProps {
  type: string;
  label: string;
  count: number;
  onClick: () => void;
}

const FilterTypeButton = ({ type, label, count, onClick }: FilterTypeButtonProps) => (
  <Button
    variant="outline"
    className="w-full justify-between p-4 h-auto"
    onClick={onClick}
  >
    <span className="font-medium">{label}</span>
    <div className="flex items-center gap-2">
      {count > 0 && (
        <Badge variant="secondary">{count}</Badge>
      )}
      <ChevronRight className="h-4 w-4" />
    </div>
  </Button>
);
```

---

## 🎨 Visual Design

### **Main Drawer Layout**

```
┌─────────────────────────┐
│ Filters & Search    [×] │
├─────────────────────────┤
│ 🔍 Search recipes...    │
├─────────────────────────┤
│ Categories          [2]►│
│ Cuisines            [1]►│
│ Moods                  ►│
│ Available Ingredients  ►│
├─────────────────────────┤
│ [Clear All]   [Done]    │
└─────────────────────────┘
```

### **Nested Drawer Layout**

```
┌─────────────────────────┐
│ ◄ Categories            │
├─────────────────────────┤
│ 🔍 Search categories... │
├─────────────────────────┤
│ Course                  │
│ ☑ Main Course           │
│ ☑ Dessert               │
│                         │
│ Diet                    │
│ ☐ Vegetarian            │
│ ☐ Vegan                 │
├─────────────────────────┤
│ [Clear Categories][Done]│
└─────────────────────────┘
```

---

## 🔄 Animation & Transitions

### **Drawer Transitions**

- **Main → Nested**: Slide left transition
- **Nested → Main**: Slide right transition
- **Open/Close**: Slide up/down from bottom

### **State Preservation**

- Search terms preserved when navigating between drawers
- Filter selections maintained throughout navigation
- Scroll positions reset when entering nested drawers

---

## ♿ Accessibility Considerations

### **ARIA Labels**

- `role="dialog"` for both drawer levels
- `aria-labelledby` for drawer headers
- `aria-describedby` for drawer content

### **Keyboard Navigation**

- Escape key behavior:
  - In nested drawer: Returns to main drawer
  - In main drawer: Closes all drawers
- Tab order maintained within each drawer level
- Focus management when transitioning between drawers

### **Screen Reader Announcements**

- Announce drawer level changes
- Announce filter count updates
- Announce navigation actions

---

## 🧪 Testing Requirements

### **User Interaction Tests**

- [ ] Main drawer opens and displays filter type buttons
- [ ] Nested drawer opens when filter type selected
- [ ] Back navigation returns to main drawer
- [ ] Done button closes all drawers
- [ ] Filter selections persist across navigation
- [ ] Search functionality works in both levels

### **Responsive Tests**

- [ ] Works correctly on mobile (< 768px)
- [ ] Works correctly on tablet (768px - 1024px)
- [ ] Smooth transitions between drawer states
- [ ] Proper touch interaction handling

### **Accessibility Tests**

- [ ] Screen reader compatibility
- [ ] Keyboard navigation functionality
- [ ] Focus management between drawer levels
- [ ] ARIA label correctness

---

## 📊 Success Metrics

### **User Experience**

- **Cognitive Load**: Reduced by showing only 4 options initially
- **Navigation Clarity**: Clear hierarchy and back navigation
- **Filter Efficiency**: Easy access to specific filter types

### **Technical**

- **Performance**: Smooth animations and transitions
- **Maintainability**: Clean state management
- **Accessibility**: Full WCAG 2.1 AA compliance

---

## 🚀 Implementation Plan

### **Phase 1: Core Structure**

1. Add nested drawer state management
2. Create FilterTypeButton component
3. Implement main drawer layout

### **Phase 2: Nested Functionality**

1. Add nested drawer navigation
2. Integrate existing filter sections
3. Implement back/done actions

### **Phase 3: Polish & Testing**

1. Add animations and transitions
2. Implement accessibility features
3. Comprehensive testing

---

**Status**: 🔧 Ready for Implementation  
**Priority**: High - Resolves cognitive overload issue  
**Timeline**: 1-2 days for complete implementation

---

_This nested drawer design provides a clean, intuitive interface that reduces cognitive overload while maintaining full filtering functionality._
