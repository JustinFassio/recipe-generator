# User-to-User Recipe Sharing with Notifications

## Overview

This document outlines the implementation plan for user-to-user recipe sharing with notification system, allowing users to tag specific users when sharing recipes and providing a complete notification flow for recipe acceptance/decline.

## Feature Requirements

### Core Functionality

- User can share a recipe with a specific user (not just public sharing)
- Recipient receives a notification with recipe preview
- Recipient can accept (creates copy in their collection) or decline the shared recipe
- Notification system with unread counts and visual indicators
- Real-time updates and proper state management

## Database Schema Extensions

### 1. Recipe Shares Table

```sql
CREATE TABLE recipe_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE,
  from_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  message text, -- Optional message from sharer
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(recipe_id, from_user_id, to_user_id)
);
```

**Purpose**: Track recipe sharing between users with status management.

### 2. User Notifications Table

```sql
CREATE TABLE user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'recipe_share', 'recipe_accepted', etc.
  title text NOT NULL,
  message text,
  data jsonb, -- Flexible data storage for different notification types
  read_at timestamptz,
  created_at timestamptz DEFAULT now(),
  related_id uuid -- ID of related entity (recipe_id, share_id, etc.)
);
```

**Purpose**: Centralized notification system for all user interactions.

### 3. RLS Policies

```sql
-- Recipe shares: Users can only see shares they sent or received
CREATE POLICY "Users can view their recipe shares"
  ON recipe_shares
  FOR SELECT
  TO authenticated
  USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

-- Recipe shares: Users can only update status of shares they received
CREATE POLICY "Users can update received recipe shares"
  ON recipe_shares
  FOR UPDATE
  TO authenticated
  USING (to_user_id = auth.uid())
  WITH CHECK (to_user_id = auth.uid());

-- Notifications: Users can only see their own notifications
CREATE POLICY "Users can view their notifications"
  ON user_notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Notifications: Users can only update their own notifications
CREATE POLICY "Users can update their notifications"
  ON user_notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

## Backend API Functions

### Recipe Sharing Functions

```typescript
// Share recipe with specific user
async shareRecipeWithUser(
  recipeId: string,
  toUserId: string,
  message?: string
): Promise<void>

// Get pending recipe shares for current user
async getPendingRecipeShares(): Promise<RecipeShare[]>

// Accept a shared recipe (creates copy in user's collection)
async acceptSharedRecipe(shareId: string): Promise<void>

// Decline a shared recipe
async declineSharedRecipe(shareId: string): Promise<void>

// Get users available for sharing (friends, etc.)
async getShareableUsers(): Promise<User[]>
```

### Notification Functions

```typescript
// Create notification for user
async createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  data?: any
): Promise<void>

// Mark notification as read
async markNotificationAsRead(notificationId: string): Promise<void>

// Get unread notification count
async getUnreadNotificationCount(): Promise<number>

// Get user notifications
async getUserNotifications(
  limit?: number,
  offset?: number
): Promise<Notification[]>
```

## Frontend Components

### 1. Share Recipe Modal

**Location**: `src/components/recipes/share-recipe-modal.tsx`

**Features**:

- User search/selection with autocomplete
- Optional message input
- Share button with loading states
- Error handling and validation

**Props**:

```typescript
interface ShareRecipeModalProps {
  recipe: Recipe;
  isOpen: boolean;
  onClose: () => void;
  onShare: (toUserId: string, message?: string) => Promise<void>;
}
```

### 2. Notification Bell Component

**Location**: `src/components/layout/notification-bell.tsx`

**Features**:

- Badge showing unread count
- Dropdown with recent notifications
- Click to open notification center
- Real-time updates

**Props**:

```typescript
interface NotificationBellProps {
  unreadCount: number;
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onMarkAllRead: () => void;
}
```

### 3. Recipe Share Notification Modal

**Location**: `src/components/notifications/recipe-share-modal.tsx`

**Features**:

- Recipe preview with full details
- Sharer information and message
- Accept/Decline buttons with loading states
- Success/error feedback

**Props**:

```typescript
interface RecipeShareModalProps {
  share: RecipeShare;
  recipe: Recipe;
  sharer: User;
  isOpen: boolean;
  onAccept: () => Promise<void>;
  onDecline: () => Promise<void>;
  onClose: () => void;
}
```

### 4. Notification Center

**Location**: `src/components/notifications/notification-center.tsx`

**Features**:

- List all notifications with read/unread states
- Filtering by type, date, read status
- Bulk actions (mark all read)
- Pagination for large lists

## UI/UX Enhancements

### Header Updates

**Location**: `src/components/layout/header.tsx`

**Changes**:

- Add notification bell with unread count badge
- Add pending shares count to "My Recipes" button
- Update navigation to include notification center

### Recipe Card Updates

**Location**: `src/components/recipes/recipe-card.tsx`

**Changes**:

- Enhance share button with dropdown menu
- Add "Share with User" option
- Show share status indicators

### Navigation Updates

**Location**: `src/App.tsx`

**Changes**:

- Add notification center route
- Add pending shares route/page
- Update navigation structure

## State Management

### Notification State

```typescript
interface NotificationState {
  unreadCount: number;
  notifications: Notification[];
  pendingShares: RecipeShare[];
  loading: boolean;
  error: string | null;
}
```

### Actions

```typescript
// Notification actions
const markNotificationAsRead = (notificationId: string) => void;
const markAllNotificationsAsRead = () => void;
const addNotification = (notification: Notification) => void;
const updateNotificationCount = (count: number) => void;

// Share actions
const addPendingShare = (share: RecipeShare) => void;
const updateShareStatus = (shareId: string, status: string) => void;
const removePendingShare = (shareId: string) => void;
```

## User Experience Flow

### Sharing Flow

1. **User clicks "Share" on recipe card**
   - Modal opens with user search
   - User can search for recipients by username/email

2. **User selects recipient and adds message**
   - Autocomplete shows available users
   - Optional message field for personal note

3. **User clicks "Share Recipe"**
   - Loading state during API call
   - Success feedback shown
   - Modal closes

4. **Recipient receives notification**
   - Notification badge updates
   - Notification appears in dropdown
   - "My Recipes" shows pending count

### Receiving Flow

1. **Recipient sees notification indicators**
   - Header notification bell shows unread count
   - "My Recipes" button shows pending shares count

2. **Recipient clicks notification**
   - Recipe preview modal opens
   - Shows recipe details, sharer info, and message

3. **Recipient chooses action**
   - **Accept**: Creates copy in their collection, closes modal
   - **Decline**: Removes notification, closes modal

4. **State updates**
   - Notification marked as read
   - Share status updated in database
   - UI reflects changes immediately

## Security Considerations

### Access Control

- **User Validation**: Ensure users can only share with valid recipients
- **Rate Limiting**: Prevent spam sharing (max shares per day)
- **Content Validation**: Sanitize messages and validate recipe access

### Privacy

- **User Discovery**: Control who can find users to share with
- **Share Visibility**: Control what information is shared
- **Notification Privacy**: Ensure notifications are private to recipient

### Data Protection

- **RLS Policies**: Database-level access control
- **Input Sanitization**: Prevent XSS in messages
- **Audit Trail**: Log all sharing activities

## Performance Optimizations

### Database Indexing

```sql
-- Notification queries
CREATE INDEX idx_notifications_user_read ON user_notifications(user_id, read_at);
CREATE INDEX idx_notifications_created ON user_notifications(created_at DESC);

-- Share queries
CREATE INDEX idx_recipe_shares_to_user ON recipe_shares(to_user_id, status);
CREATE INDEX idx_recipe_shares_from_user ON recipe_shares(from_user_id);
```

### Caching

- **User List**: Cache shareable users for autocomplete
- **Notification Count**: Cache unread counts
- **Recipe Data**: Cache recipe details for notifications

### Optimistic Updates

- **Share Creation**: Optimistically show share as sent
- **Accept/Decline**: Optimistically update UI before API response
- **Notification Read**: Optimistically mark as read

## Real-time Features (Future Enhancement)

### WebSocket Integration

```typescript
// Real-time notification delivery
const subscribeToNotifications = (userId: string) => {
  return supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'user_notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        // Handle new notification
      }
    )
    .subscribe();
};
```

### Live Updates

- **Live Notifications**: Real-time notification delivery
- **Status Updates**: Live updates when shares are accepted/declined
- **Online Status**: Show when users are online for better UX

## Testing Requirements

### Unit Tests

```typescript
// API function tests
describe('Recipe Sharing API', () => {
  test('shareRecipeWithUser creates share and notification');
  test('acceptSharedRecipe creates recipe copy and updates status');
  test('declineSharedRecipe updates status and removes notification');
});

// Component tests
describe('Share Recipe Modal', () => {
  test('user search works correctly');
  test('share button triggers API call');
  test('loading states work properly');
});
```

### Integration Tests

```typescript
// End-to-end sharing flow
describe('Recipe Sharing Flow', () => {
  test('user can share recipe with another user');
  test('recipient receives notification');
  test('recipient can accept shared recipe');
  test('recipient can decline shared recipe');
});
```

### Edge Cases

- **Invalid Users**: Sharing with non-existent users
- **Duplicate Shares**: Preventing duplicate shares
- **Large Lists**: Performance with many notifications/shares
- **Network Errors**: Handling API failures gracefully

## Implementation Phases

### Phase 1: Database & API

1. Create database tables and migrations
2. Implement RLS policies
3. Create API functions for sharing and notifications
4. Add database indexes for performance

### Phase 2: Core Components

1. Build Share Recipe Modal
2. Create Notification Bell component
3. Implement Recipe Share Notification Modal
4. Add basic notification center

### Phase 3: Integration & State

1. Integrate components into existing pages
2. Implement state management for notifications
3. Add optimistic updates
4. Connect real-time features

### Phase 4: Testing & Polish

1. Write comprehensive tests
2. Performance optimization
3. UI/UX refinements
4. Security audit

## Success Metrics

### Functionality

- ✅ Users can share recipes with specific users
- ✅ Recipients receive notifications
- ✅ Accept/decline flow works correctly
- ✅ Notification system tracks read status

### User Experience

- ✅ Intuitive sharing interface
- ✅ Clear notification indicators
- ✅ Smooth accept/decline process
- ✅ Real-time updates

### Performance

- ✅ Fast user search and autocomplete
- ✅ Efficient notification queries
- ✅ Optimistic UI updates
- ✅ Minimal API calls

## Files to Create/Modify

### New Files

- `supabase/migrations/20250819000006_recipe_shares.sql`
- `supabase/migrations/20250819000007_user_notifications.sql`
- `src/components/recipes/share-recipe-modal.tsx`
- `src/components/layout/notification-bell.tsx`
- `src/components/notifications/recipe-share-modal.tsx`
- `src/components/notifications/notification-center.tsx`
- `src/pages/notifications-page.tsx`
- `src/hooks/use-notifications.ts`
- `src/hooks/use-recipe-shares.ts`

### Modified Files

- `src/lib/api.ts` - Add sharing and notification functions
- `src/components/recipes/recipe-card.tsx` - Add share dropdown
- `src/components/layout/header.tsx` - Add notification bell
- `src/App.tsx` - Add notification routes
- `src/lib/supabase.ts` - Add new types

This comprehensive plan provides a complete roadmap for implementing user-to-user recipe sharing with notifications, covering all aspects from database design to user experience.
