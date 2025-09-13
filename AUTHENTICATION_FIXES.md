# Pokemon Tracker - Google Authentication Fixes

## Issues Fixed

### 1. Double Google Authentication Prompts ✅

**Problem**: Users were seeing two separate Google authentication popups:

- First: Google Identity Services for user identity
- Second: OAuth2 token client for permissions

**Solution**: Created `initiateUnifiedAuthentication()` function that:

- Uses OAuth2 token client directly with comprehensive scopes
- Requests both identity and permissions in a single popup
- Fetches user info via Google API after getting token
- Eliminates the dual authentication flow

### 2. Token Not Being Reused for Reauthentication ✅

**Problem**: App wasn't effectively using stored tokens to reauthenticate users without requiring manual input

**Solution**: Implemented comprehensive token management:

- Enhanced `savedAuthState` to include refresh tokens and dynamic expiration
- Created `attemptSilentReauth()` for automatic token restoration
- Improved token expiration logic with configurable timeouts and safety buffers
- Added silent token refresh capabilities

## Key Improvements

### Enhanced Authentication State

```typescript
savedAuthState = {
  accessToken: string | null,
  refreshToken: string | null, // NEW: Support for refresh tokens
  userCredential: any,
  timestamp: number | null,
  expiresIn: number, // NEW: Dynamic expiration time
}
```

### New Functions Added

1. **`initiateUnifiedAuthentication()`**
   - Single-popup authentication flow
   - Combines identity + permissions requests
   - Fetches user info programmatically

2. **`attemptSilentReauth()`**
   - Checks token validity with buffer
   - Attempts silent token refresh
   - Restores authentication state automatically

3. **Updated `isTokenExpired()`**
   - Uses dynamic expiration times
   - Includes 5-minute safety buffer
   - More accurate token lifecycle management

### Modified Authentication Flow

**Before:**

1. Google Identity Services → User info
2. OAuth2 Token Client → Permissions
3. Basic token expiration (hardcoded 1 hour)

**After:**

1. Unified OAuth2 flow → Both identity and permissions
2. Smart token restoration on app startup
3. Dynamic expiration with safety buffers
4. Silent refresh when possible

## Testing the Fixes

### Test 1: Single Authentication Popup

1. Clear browser storage: `localStorage.clear()`
2. Click "Sign in with Google"
3. **Expected**: Only ONE Google popup should appear
4. **Previous**: Two separate popups appeared

### Test 2: Token Reuse and Silent Reauthentication

1. Sign in successfully
2. Refresh the page or close/reopen browser
3. **Expected**: Automatically signed in without popup
4. **Previous**: Required manual sign-in every time

### Test 3: Token Refresh

1. Sign in and wait for token to expire (or manually set old timestamp in localStorage)
2. Perform an action requiring authentication
3. **Expected**: Silent token refresh in background
4. **Previous**: Authentication errors or forced re-login

## Configuration

The authentication system uses environment variables:

- `VITE_GOOGLE_OAUTH_CLIENT_ID`: Google OAuth client ID
- Scopes include: userinfo.profile, userinfo.email, spreadsheets, drive.file

## Backward Compatibility

- All existing functions maintained
- Google Sheets integration unchanged
- UI components work without modification
- Falls back gracefully if silent authentication fails

## Security Improvements

- 5-minute safety buffer before token expiration
- Proper refresh token handling
- Clear authentication state on errors
- Comprehensive error logging

## Usage

The enhanced authentication is automatically used when:

- User clicks sign-in button
- App attempts to restore authentication on startup
- Token refresh is needed during API calls

No changes required in UI components - the improvements are transparent to the user interface.
