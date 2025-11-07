# Backend Integration TODO

## 1. Profile Picture Upload

### Overview
The frontend now supports uploading profile pictures for assistants. Currently, images are stored as base64 strings temporarily. Backend implementation is required for persistent storage.

## 2. Starring Feature for Assistants and Chats ⭐ **NEW**

### Overview
The frontend now supports starring/favoriting assistants and chats. Starred items appear at the top of their respective lists and can be reordered via drag-and-drop. Backend implementation is required for persistent storage.

## 3. Authentication & User Profile 🔐 **NEW**

### Overview
The frontend now supports user authentication and account management with an account menu. The login functionality is currently hardcoded. Backend implementation is required for proper authentication, session management, and user profile endpoints.

**Current State:**
- Login is hardcoded (email: `kc@gmail.com`, password: `123`)
- User data stored in Redux (`UserSlice`)
- Account menu displays user email and logout functionality
- No backend authentication or token validation

---

## Database Changes Required

### 1. Update Assistant Table Schema (Profile Pictures & Starring)
Add new columns to store avatar image URL and starring information:

```sql
ALTER TABLE assistants
ADD COLUMN avatar_image_url VARCHAR(500) NULL,
ADD COLUMN avatar_color VARCHAR(7) NULL,
ADD COLUMN is_starred BOOLEAN DEFAULT FALSE,
ADD COLUMN star_order INT NULL;
```

**Fields:**
- `avatar_image_url`: URL to the stored image (from cloud storage)
- `avatar_color`: Hex color code for fallback (when no image uploaded)
- `is_starred`: Boolean indicating if assistant is starred
- `star_order`: Integer for ordering starred assistants (lower number = higher in list)

**Note:** Keep existing `avatarUrl` field for backward compatibility, or migrate data.

### 2. Update Chat Table Schema (Starring)
Add new columns to support chat starring:

```sql
ALTER TABLE chats
ADD COLUMN is_starred BOOLEAN DEFAULT FALSE,
ADD COLUMN star_order INT NULL;
```

**Fields:**
- `is_starred`: Boolean indicating if chat is starred
- `star_order`: Integer for ordering starred chats within an assistant (lower number = higher in list)

### 3. Update User Table Schema (Authentication)
Ensure the users table has the necessary fields for authentication and profile management:

```sql
-- If table doesn't exist, create it
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NULL,
    avatar_url VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Preferences
    theme VARCHAR(20) DEFAULT 'dark',
    language VARCHAR(10) DEFAULT 'en',
    notifications BOOLEAN DEFAULT TRUE,
    -- Session management
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Add indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);
```

**Fields:**
- `id`: Unique user identifier
- `email`: User's email address (unique)
- `password_hash`: Hashed password (use bcrypt or similar)
- `name`: User's display name (required for registration)
- `role`: User's work function/role (e.g., "Marketing", "Engineering", "Sales") - set in Settings
- `avatar_url`: URL to profile picture (optional)
- `theme`: UI theme preference ('dark' or 'light')
- `language`: Language preference (ISO code)
- `notifications`: Whether notifications are enabled
- `last_login`: Timestamp of last successful login
- `is_active`: Account status (for soft deletion/suspension)

**Role Options (for validation):**
- Marketing
- Product Management
- Engineering
- Human Resources
- Finance
- Sales
- Operations
- Data Science
- Design
- Legal
- Other

### 4. Create Sessions Table (Optional but Recommended)
For managing user sessions and tokens:

```sql
CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    token VARCHAR(500) NOT NULL,
    refresh_token VARCHAR(500) NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    is_valid BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(token);
CREATE INDEX idx_sessions_expires_at ON user_sessions(expires_at);
```

**Fields:**
- `id`: Unique session identifier
- `user_id`: Reference to user
- `token`: JWT access token
- `refresh_token`: Refresh token for extending sessions
- `expires_at`: When the session expires
- `ip_address`: IP address of the session (for security)
- `user_agent`: Browser/client information
- `is_valid`: Whether session is still valid (for forced logout)

## API Endpoints Required

### 1. Upload Avatar Image
```
POST /api/users/{userId}/assistants/{assistantId}/avatar
```

**Request:**
- Content-Type: `multipart/form-data`
- Body: `image` (file upload)

**Response:**
```json
{
  "success": true,
  "avatarUrl": "https://storage.example.com/avatars/123456.jpg"
}
```

**Backend Processing:**
1. Validate file (size < 5MB, format: JPG/PNG)
2. Generate unique filename
3. Upload to cloud storage (AWS S3, Cloudinary, etc.)
4. Update database with image URL
5. Return URL to frontend

### 2. Delete Avatar Image
```
DELETE /api/users/{userId}/assistants/{assistantId}/avatar
```

**Response:**
```json
{
  "success": true
}
```

**Backend Processing:**
1. Delete image from cloud storage
2. Clear `avatar_image_url` in database
3. Keep `avatar_color` for fallback

## Cloud Storage Setup

### Recommended Services:
1. **AWS S3** - Most common, reliable
2. **Cloudinary** - Image optimization included
3. **Azure Blob Storage** - If using Azure
4. **Google Cloud Storage** - If using GCP

### Storage Structure:
```
/avatars/
  ├── user_{userId}/
  │   ├── assistant_{assistantId}_v1.jpg
  │   ├── assistant_{assistantId}_v2.jpg
  │   └── ...
```

**Versioning:** Use version numbers or timestamps to handle updates.

### Image Optimization:
- Resize to 200x200px (server-side)
- Compress to ~50-80% quality
- Convert to JPEG for smaller file size
- Generate thumbnail if needed

## Frontend Integration Points

### Current Implementation:
**File:** `src/components/EditAssistantModal.tsx`

```typescript
// Line 108: Currently sends base64 or color
avatarUrl: avatarImage || avatarColor

// TODO: Change to API call
// 1. Upload image to backend API
// 2. Receive URL from backend
// 3. Save URL in avatarUrl field
```

### Required Changes:

**1. Add API Service** (`src/services/AvatarService.ts`):
```typescript
export async function uploadAvatar(
  userId: string,
  assistantId: string,
  file: File
): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(
    `/api/users/${userId}/assistants/${assistantId}/avatar`,
    {
      method: 'POST',
      body: formData
    }
  );

  const data = await response.json();
  return data.avatarUrl;
}
```

**2. Update EditAssistantModal**:
```typescript
const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setUploadingImage(true);

  try {
    // Upload to backend instead of converting to base64
    const avatarUrl = await uploadAvatar(userId, assistant.id, file);
    setAvatarImage(avatarUrl);

    showNotification({
      type: 'success',
      title: 'Image uploaded',
      message: 'Profile image uploaded successfully'
    });
  } catch (error) {
    showNotification({
      type: 'error',
      title: 'Upload failed',
      message: 'Failed to upload image'
    });
  }

  setUploadingImage(false);
};
```

## Security Considerations

### 1. File Validation (Backend)
- Check file type (whitelist: JPG, PNG only)
- Check file size (max 5MB)
- Scan for malware if possible
- Validate image dimensions

### 2. Access Control
- Only authenticated users can upload
- Users can only modify their own assistants
- Validate userId and assistantId ownership

### 3. Storage Security
- Use signed URLs for private images
- Set proper CORS policies
- Enable versioning for backup
- Set lifecycle policies for old versions

### 4. Rate Limiting
- Limit uploads per user per hour
- Prevent abuse and spam

## Migration Strategy

### For Existing Assistants:
1. **Option A:** Keep using initials + colors (no migration needed)
2. **Option B:** Generate placeholder images using initials
3. **Option C:** Allow users to upload images gradually

### Database Migration:
```sql
-- Set default color for existing assistants
UPDATE assistants
SET avatar_color = '#7C6F5D'
WHERE avatar_color IS NULL;
```

## Testing Checklist

### Frontend Testing:
- [ ] Upload JPG image
- [ ] Upload PNG image
- [ ] Try uploading > 5MB file (should fail)
- [ ] Try uploading PDF (should fail)
- [ ] Upload, then remove image
- [ ] Select different colors
- [ ] Save with image
- [ ] Save with color only
- [ ] Check initials display correctly

### Backend Testing:
- [ ] Image uploads to cloud storage
- [ ] Database updates correctly
- [ ] Image deletion works
- [ ] File validation works
- [ ] Access control enforced
- [ ] Rate limiting works
- [ ] Error handling correct

## Estimated Development Time
- Database schema update: 1 hour
- Cloud storage setup: 2-4 hours
- API endpoints: 4-6 hours
- Frontend integration: 2-3 hours
- Testing: 2-3 hours
- **Total: ~12-18 hours**

## Future Enhancements
1. **Image editing:** Allow crop/rotate in frontend
2. **AI-generated avatars:** Generate unique avatars from names
3. **GIF support:** Allow animated avatars
4. **Multiple sizes:** Generate thumbnails automatically
5. **CDN integration:** Faster image delivery

### 3. Toggle Star Status (Assistants)
```
PATCH /api/users/{userId}/assistants/{assistantId}/star
```

**Request:**
```json
{
  "isStarred": true
}
```

**Response:**
```json
{
  "success": true,
  "assistant": {
    "id": "123",
    "isStarred": true,
    "starOrder": 3
  }
}
```

**Backend Processing:**
1. Toggle `is_starred` field
2. If starring: Assign `star_order` = current max + 1
3. If unstarring: Set `star_order` = NULL
4. Return updated assistant data

### 4. Toggle Star Status (Chats)
```
PATCH /api/users/{userId}/chats/{chatId}/star
```

**Request:**
```json
{
  "isStarred": true
}
```

**Response:**
```json
{
  "success": true,
  "chat": {
    "id": "456",
    "assistantId": "123",
    "isStarred": true,
    "starOrder": 2
  }
}
```

**Backend Processing:**
1. Toggle `is_starred` field
2. If starring: Assign `star_order` = current max for that assistant + 1
3. If unstarring: Set `star_order` = NULL
4. Return updated chat data

### 5. Update Star Order (Assistants)
```
PATCH /api/users/{userId}/assistants/star-order
```

**Request:**
```json
{
  "updates": [
    {"id": "123", "starOrder": 1},
    {"id": "456", "starOrder": 2},
    {"id": "789", "starOrder": 3}
  ]
}
```

**Response:**
```json
{
  "success": true,
  "updated": 3
}
```

**Backend Processing:**
1. Update `star_order` for each assistant in the request
2. Validate all assistants belong to the user
3. Return success status

### 6. Update Star Order (Chats)
```
PATCH /api/users/{userId}/chats/star-order
```

**Request:**
```json
{
  "assistantId": "123",
  "updates": [
    {"id": "chat1", "starOrder": 1},
    {"id": "chat2", "starOrder": 2}
  ]
}
```

**Response:**
```json
{
  "success": true,
  "updated": 2
}
```

**Backend Processing:**
1. Update `star_order` for each chat in the request
2. Validate all chats belong to the specified assistant and user
3. Return success status

### 7. User Login (Authentication) 🔐
```
POST /api/auth/login
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "user_password"
}
```

**Response (Success):**
```json
{
  "success": true,
  "user": {
    "id": "user123",
    "email": "user@example.com",
    "name": "John Doe",
    "avatarUrl": "https://example.com/avatar.jpg",
    "preferences": {
      "theme": "dark",
      "language": "en",
      "notifications": true
    }
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_here",
  "expiresIn": 3600
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

**Backend Processing:**
1. Validate email format
2. Look up user by email
3. Verify password using bcrypt.compare()
4. Generate JWT access token (expires in 1 hour)
5. Generate refresh token (expires in 7 days)
6. Create session record in `user_sessions` table
7. Update `last_login` timestamp
8. Return user data and tokens

**Security:**
- Use bcrypt/argon2 for password hashing
- Implement rate limiting (max 5 attempts per 15 minutes)
- Log failed login attempts
- Use HTTPS only
- Set secure, httpOnly cookies for tokens

### 8. User Logout 🔐
```
POST /api/auth/logout
```

**Request Headers:**
```
Authorization: Bearer {token}
```

**Request (Optional):**
```json
{
  "allDevices": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Backend Processing:**
1. Verify JWT token
2. If `allDevices` is true: Invalidate all sessions for the user
3. If `allDevices` is false: Invalidate only the current session
4. Set `is_valid = false` in `user_sessions` table
5. Clear server-side session data
6. Return success response

**Frontend Integration:**
- Clear Redux user state (already implemented)
- Clear local storage tokens
- Redirect to login page

### 9. Get Current User Profile 🔐
```
GET /api/users/me
```

**Request Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user123",
    "email": "user@example.com",
    "name": "John Doe",
    "avatarUrl": "https://example.com/avatar.jpg",
    "preferences": {
      "theme": "dark",
      "language": "en",
      "notifications": true
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "lastLogin": "2024-01-15T12:30:00Z"
  }
}
```

**Backend Processing:**
1. Verify JWT token
2. Extract user ID from token
3. Fetch user data from database
4. Return user profile

**Usage:**
- Called on app initialization to restore user session
- Called after login to sync latest user data
- Can be called to refresh user profile

### 10. Update User Profile 🔐
```
PATCH /api/users/me
```

**Request Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "name": "Updated Name",
  "preferences": {
    "theme": "light",
    "language": "es",
    "notifications": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user123",
    "email": "user@example.com",
    "name": "Updated Name",
    "avatarUrl": "https://example.com/avatar.jpg",
    "preferences": {
      "theme": "light",
      "language": "es",
      "notifications": false
    }
  }
}
```

**Backend Processing:**
1. Verify JWT token
2. Validate request data
3. Update user record in database
4. Set `updated_at` timestamp
5. Return updated user profile

**Fields that can be updated:**
- `name`: User's display name
- `preferences.theme`: UI theme
- `preferences.language`: Language preference
- `preferences.notifications`: Notification settings
- `avatarUrl`: Profile picture (via separate upload endpoint)

**Fields that CANNOT be updated via this endpoint:**
- `email`: Requires separate email change flow with verification
- `password`: Requires separate password change flow
- `id`: Never changeable

### 11. Refresh Token 🔐
```
POST /api/auth/refresh
```

**Request:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "token": "new_access_token_here",
  "refreshToken": "new_refresh_token_here",
  "expiresIn": 3600
}
```

**Backend Processing:**
1. Verify refresh token is valid and not expired
2. Look up session in `user_sessions` table
3. Check `is_valid` flag
4. Generate new access token
5. Optionally rotate refresh token
6. Update session record
7. Return new tokens

**Usage:**
- Called when access token expires (401 response)
- Allows user to stay logged in without re-entering credentials
- Implement in axios interceptor on frontend

### 12. Validate Token 🔐
```
POST /api/auth/validate
```

**Request Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "valid": true,
  "userId": "user123",
  "expiresAt": "2024-01-15T13:30:00Z"
}
```

**Backend Processing:**
1. Verify JWT token signature
2. Check token expiration
3. Look up session in database
4. Verify session is still valid
5. Return validation result

**Usage:**
- Called on app startup to validate stored token
- Can be used before making important requests
- Helps detect if user was logged out elsewhere

---

## Frontend State Management

### Current Implementation
- **Redux Slices**: `AssistantSlice.ts` and `ChatSlice.ts`
- **Actions**:
  - `toggleStarAssistant(assistantId)` - Toggles star status
  - `toggleStarChat(chatId)` - Toggles star status
  - `updateAssistantStarOrder({id, starOrder})` - Updates order
  - `updateChatStarOrder({id, starOrder})` - Updates order

### Sorting Logic
- **Assistants List**: Starred first (by `starOrder`), then unstarred (original order)
- **Chats within Assistant**: Starred first (by `starOrder`), then unstarred (by most recent)
- **Recent Chats**: Starred chats show separately before recents section

---

## Questions for Backend Team

### Profile Pictures:
1. Which cloud storage service should we use?
2. What's the image URL format preference?
3. Should we support image versioning?
4. Any existing image upload patterns to follow?
5. What's the preferred error response format?

### Starring Feature:
1. Should starred status be per-user or global?
2. Do we need to sync star order changes in real-time across devices?
3. Should there be a limit on how many items can be starred?
4. How should we handle conflicts if two devices update star order simultaneously?

### Authentication & User Profile:
1. Which JWT library should be used for token generation and validation?
2. What should be the token expiration times (access token: 1 hour, refresh token: 7 days)?
3. Should we implement session management with a sessions table or use stateless JWT only?
4. Do we want to support "remember me" functionality (longer-lived sessions)?
5. Should we implement email verification on registration?
6. Do we need password reset functionality via email?
7. Should we support OAuth (Google, Microsoft) in addition to email/password?
8. What's the policy for handling multiple active sessions (allow/limit)?
9. Should we log login attempts and detect suspicious activity?
10. Do we need to implement 2FA (two-factor authentication)?

---

## Frontend Integration for Authentication

### Current Files Modified:
1. **`src/components/AccountMenu.tsx`** - Account menu with logout and settings functionality
2. **`src/components/Sidebar.tsx`** - Displays user name/initials, integrates AccountMenu
3. **`src/components/SettingsModal.tsx`** - Settings modal with profile, role, and theme sections
4. **`src/renderer.tsx`** - Login handler with Redux integration, logout handler, settings modal
5. **`src/slices/UserSlice.ts`** - Redux state management for user authentication (includes role field)
6. **`src/utils/avatarUtils.ts`** - Avatar initials and color generation

### Implementation Status:
- ✅ Account menu UI created
- ✅ User display in sidebar with initials and colored avatars
- ✅ Settings modal with full name and work role
- ✅ Redux state management setup with role field
- ✅ Logout handler implemented
- ✅ Theme UI (Dark active, Light coming soon)
- ❌ Backend API integration (pending)
- ❌ Token storage and refresh (pending)
- ❌ Protected route middleware (pending)
- ❌ Actual theme switching (CSS/dark mode) (pending)

### Settings Modal Features:
**Profile Section:**
- Full name input with live avatar preview
- Avatar shows initials from full name
- Avatar has colored background (hash-based color selection)
- Auto-saves on blur

**Work Role Section:**
- Dropdown with pre-defined options matching Claude reference
- Options: Marketing, Product Management, Engineering, Human Resources, Finance, Sales, Operations, Data Science, Design, Legal, Other
- Blue highlight on selected item
- Saves to Redux user.role field

**Appearance Section:**
- Dark theme (currently active, default)
- Light theme (grayed out with "Coming Soon" label)
- UI infrastructure ready for theme switching

### Next Steps for Frontend:
1. **Create Authentication Service** (`src/services/AuthService.ts`):
   ```typescript
   export async function login(email: string, password: string) {
     const response = await fetch('/api/auth/login', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ email, password })
     });
     return response.json();
   }

   export async function logout(token: string) {
     await fetch('/api/auth/logout', {
       method: 'POST',
       headers: { 'Authorization': `Bearer ${token}` }
     });
   }

   export async function getCurrentUser(token: string) {
     const response = await fetch('/api/users/me', {
       headers: { 'Authorization': `Bearer ${token}` }
     });
     return response.json();
   }
   ```

2. **Update LoginForm** (`src/components/LoginForm.tsx`):
   - Replace hardcoded login with API call
   - Show loading state during authentication
   - Handle and display error messages
   - Store tokens in secure location

3. **Implement Token Management**:
   - Store tokens in electron-store or secure local storage
   - Implement axios interceptor for automatic token refresh
   - Handle 401 responses and redirect to login
   - Clear tokens on logout

4. **Add Request Middleware**:
   - Automatically attach Authorization header to API requests
   - Intercept 401 responses and attempt token refresh
   - Redirect to login if refresh fails

5. **Session Persistence**:
   - Check for stored token on app startup
   - Validate token with backend
   - Restore user session if valid
   - Clear and show login if invalid

### Security Considerations:
- **Token Storage**: Use electron-store with encryption for token storage (not localStorage due to XSS risk in Electron)
- **CSRF Protection**: Implement CSRF tokens for state-changing requests
- **Rate Limiting**: Frontend should respect rate limiting and show appropriate messages
- **Secure Transmission**: Ensure all API calls use HTTPS in production
- **Token Refresh**: Implement automatic refresh before expiration
- **Logout on Close**: Consider auto-logout on app close (configurable)

---

## Testing Checklist - Authentication

### Frontend Testing:
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (show error)
- [ ] Login form validation (email format, required fields)
- [ ] Logout functionality clears all state
- [ ] User email displays correctly in sidebar
- [ ] Account menu opens and closes properly
- [ ] Session persists after app restart
- [ ] Token refresh works automatically
- [ ] Expired token redirects to login
- [ ] Protected routes require authentication

### Backend Testing:
- [ ] Login with correct credentials returns token
- [ ] Login with wrong password fails
- [ ] Login with non-existent email fails
- [ ] Rate limiting prevents brute force
- [ ] Logout invalidates token
- [ ] Token validation works correctly
- [ ] Expired tokens are rejected
- [ ] Refresh token extends session
- [ ] Profile fetch returns correct user data
- [ ] Profile update works correctly
- [ ] Session table properly tracks active sessions
- [ ] Password hashing is secure (bcrypt)

### Security Testing:
- [ ] SQL injection protection on login
- [ ] XSS protection in user data
- [ ] CSRF tokens validated
- [ ] Tokens have proper expiration
- [ ] Failed login attempts are logged
- [ ] Rate limiting enforced
- [ ] Tokens stored securely on frontend
- [ ] HTTPS enforced in production

---

## Estimated Development Time - Authentication

### Backend:
- Database schema (users, sessions): 2 hours
- Login endpoint with JWT: 3-4 hours
- Logout endpoint: 1-2 hours
- User profile endpoints (GET, PATCH): 2-3 hours
- Token refresh endpoint: 2 hours
- Token validation middleware: 2 hours
- Rate limiting implementation: 2 hours
- Security hardening: 2-3 hours
- **Subtotal: ~16-20 hours**

### Frontend:
- Auth service integration: 2-3 hours
- LoginForm API integration: 2 hours
- Token storage and management: 3-4 hours
- Axios interceptors: 2-3 hours
- Session persistence: 2 hours
- Error handling: 1-2 hours
- **Subtotal: ~12-16 hours**

### Testing:
- Backend tests: 4-5 hours
- Frontend tests: 3-4 hours
- Integration tests: 3-4 hours
- Security testing: 2-3 hours
- **Subtotal: ~12-16 hours**

### **Total Estimated Time: 40-52 hours**

---
