# User Account System

This document outlines the user account system implemented for the Recipe Generator application.

## Overview

The user account system provides secure authentication and profile management, designed to be future-proof for the planned "Friend Bubbles" sharing feature.

## Features

### Authentication
- **Email + Password**: Traditional sign-up and sign-in
- **Magic Link**: Passwordless authentication via email
- **Password Reset**: Secure password recovery
- **Session Management**: Automatic token refresh and persistence

### Profile Management
- **User Profiles**: Full name, avatar, and optional username
- **Username System**: Unique, case-insensitive usernames with reservation system
- **Avatar Upload**: Profile picture storage with automatic resizing
- **Account Settings**: Email and password updates

### Security
- **Row Level Security (RLS)**: Database-level access control
- **Reserved Usernames**: System protection against username squatting
- **Atomic Username Claims**: Race-condition-free username reservation
- **Audit Trail**: Account events logging for security monitoring

## Database Schema

### Core Tables

#### `profiles`
- Stores user profile information
- Public-readable for future sharing features
- One-to-one relationship with `auth.users`

#### `usernames`
- Username registry for atomic reservation
- Ensures case-insensitive uniqueness
- Supports quick availability checks

#### `account_events`
- Audit log for account-related events
- Tracks username claims, profile updates, etc.
- Includes IP address and user agent for security

#### `reserved_usernames`
- System-protected usernames
- Prevents users from claiming admin, api, etc.

### Storage
- **Avatars bucket**: User profile pictures
- **RLS policies**: User can only manage their own files
- **Public read access**: Avatars are publicly viewable

## API Endpoints

### Authentication Functions
- `signUp(email, password, fullName)`: Create new account
- `signIn(email, password)`: Email/password authentication
- `signInWithMagicLink(email)`: Passwordless authentication
- `resetPassword(email)`: Password recovery

### Profile Functions
- `updateProfile(updates)`: Update profile information
- `claimUsername(username)`: Reserve a username
- `checkUsernameAvailability(username)`: Check if username is available
- `uploadAvatar(file)`: Upload profile picture

### Edge Functions
- **set-username**: Atomic username reservation with validation
- Rate limiting and abuse prevention
- Comprehensive error handling

## Frontend Components

### Authentication
- **AuthProvider**: React context for auth state management
- **AuthForm**: Multi-tab authentication UI (sign-in, sign-up, magic link, reset)
- **ProtectedRoute**: Route protection component
- **PublicRoute**: Redirects authenticated users

### Profile Management
- **ProfilePage**: Comprehensive account settings interface
- **Avatar Upload**: Drag-and-drop file upload with validation
- **Username Claim**: Real-time availability checking
- **Account Settings**: Email and password management

### Navigation
- **Header**: User dropdown with profile info and settings
- **Mobile Menu**: Responsive navigation with user info

## Future-Proofing for Friend Bubbles

The system is designed to support the upcoming "Friend Bubbles" sharing feature:

### Public Profile Data
- Profiles are public-readable for user discovery
- Username system enables @mentions and user lookups
- Avatar URLs support profile display in shared contexts

### Sharing Infrastructure Ready
- RLS policies can be extended for bubble membership
- User relationships can be built on the profile system
- Account events can track sharing activities

### Scalable Architecture
- Edge Functions handle complex operations atomically
- Database functions ensure data consistency
- Audit trail provides security and compliance foundation

## Security Considerations

### Data Protection
- All sensitive operations use RLS policies
- Edge Functions validate all inputs
- Passwords are handled by Supabase Auth (never stored directly)

### Username Security
- Reserved username list prevents abuse
- Atomic claiming prevents race conditions
- Rate limiting prevents brute force attempts

### Audit and Monitoring
- All account changes are logged
- IP addresses and user agents tracked
- Failed attempts can be monitored for abuse

## Usage Examples

### Basic Authentication
```typescript
// Sign up new user
const { success, error } = await signUp(
  'user@example.com', 
  'securePassword123', 
  'John Doe'
);

// Sign in existing user
const { success, error } = await signIn(
  'user@example.com', 
  'securePassword123'
);
```

### Profile Management
```typescript
// Claim a username
const { success, error } = await claimUsername('johndoe');

// Update profile
const { success, error } = await updateProfile({
  full_name: 'John Smith'
});

// Upload avatar
const { success, avatarUrl, error } = await uploadAvatar(file);
```

### Using Auth Context
```typescript
const { user, profile, loading, signOut } = useAuth();

if (loading) return <LoadingSpinner />;
if (!user) return <SignInForm />;

return (
  <div>
    <p>Welcome, {profile?.full_name || user.email}!</p>
    {profile?.username && <p>@{profile.username}</p>}
  </div>
);
```

## Migration and Deployment

### Database Migrations
1. Run `20250115000000_user_accounts.sql` for core schema
2. Run `20250115000001_username_claim_function.sql` for functions
3. Deploy Edge Function to Supabase

### Environment Variables
Ensure these are set in your deployment:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for Edge Functions)

### Testing
- Test all authentication flows
- Verify RLS policies are working
- Test username claiming race conditions
- Validate file upload permissions

## Troubleshooting

### Common Issues
- **Username already taken**: Use Edge Function for atomic claiming
- **Avatar upload fails**: Check storage bucket permissions
- **Profile not loading**: Verify RLS policies and user session
- **Magic link not working**: Check email redirect URLs

### Debug Steps
1. Check browser console for client-side errors
2. Verify Supabase logs for server-side issues
3. Test database queries directly in Supabase dashboard
4. Validate RLS policies with different user contexts
