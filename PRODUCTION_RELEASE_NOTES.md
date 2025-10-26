# JOT Snatcher v1.2.1 - Production Release

## Version Information
- **Version:** 1.2.1
- **Release Date:** October 26, 2025
- **Manifest:** Chrome Extension Manifest V3

## What's New

### Fixed Critical Issues
1. **Authentication Not Working**: Fixed extension login/sign-in functionality
2. **"JOT-HUB: Not Connected" Error**: Users can now successfully authenticate and connect
3. **"LICENSE: Not Verified" Error**: License verification now works correctly
4. **Auth State Propagation**: Fixed issue where auth state changes weren't being broadcast to all extension components

### Technical Improvements
1. **Sign-In Functionality**: Added `signIn()`, `signOut()`, and `refreshUserData()` methods to background script
2. **Webapp Auth Sync**: Improved handling of webapp authentication tokens
3. **Login Forms**: Updated all login components to properly communicate with background script
4. **Auth Broadcasting**: Added `broadcastAuthStateUpdate()` method that sends auth state to all tabs when it changes
5. **Content Script Listener**: Added `AUTH_STATE_UPDATE` message handler in content script
6. **No Subscription Handling**: Users without a subscription now default to free tier with 5 job limit
7. **Connection Status**: Fixed iframe connection status updates to reflect auth state changes
8. **Supabase Client Isolation**: Prevented iframe from creating conflicting Supabase client instances

## Files Changed
- `src/background/background-standalone.js` - Added sign-in/sign-out methods and broadcast functionality
- `src/components/LoginForm.tsx` - Updated to send messages to background script
- `src/components/DraggableLoginForm.tsx` - Updated to send messages to background script  
- `src/components/AdminLoginForm.tsx` - Updated to send messages to background script
- `src/components/Iframe/IframeContent.tsx` - Fixed connection status updates
- `src/content/content-script.ts` - Added AUTH_STATE_UPDATE message handler
- `src/services/directSupabaseAuth.ts` - Added iframe context detection to prevent conflicts
- `manifest.json` - Updated version to 1.2.1

## Production Package
- **File:** `SP-JOT-Snatcher-1.2.1-PRODUCTION.zip`
- **Location:** Root directory
- **Contents:** All files from `dist/` folder ready for Chrome Web Store submission

## Installation Instructions

### For Chrome Web Store Submission:
1. Upload `SP-JOT-Snatcher-1.2.1-PRODUCTION.zip` to Chrome Web Store
2. Update version number in listing
3. Add release notes about authentication fixes

### For Local Testing:
1. Go to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist` folder
5. Test authentication and job submission

## Testing Checklist
- [x] Login works for regular users
- [x] Login works for admin users  
- [x] JOT-HUB shows as "Connected" after login
- [x] LICENSE shows as "Verified" after login
- [x] Usage data displays correctly
- [x] Free tier users (no subscription) can authenticate
- [x] Sign out works properly
- [x] Job submission works
- [x] No console errors

## Known Issues
None - all authentication issues resolved.

## Next Steps
1. Submit to Chrome Web Store
2. Monitor for any user-reported issues
3. Consider adding analytics to track authentication success rates

