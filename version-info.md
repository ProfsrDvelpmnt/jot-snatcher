# Version Information

## v1.0.0 - Working Release (September 12, 2025)

### What's Working
- ✅ Subscription tier correctly displays from Supabase database
- ✅ User authentication with proper sign out functionality
- ✅ Usage counter shows correct limits and remaining jobs
- ✅ Full Supabase integration with no hardcoded values
- ✅ Clean project structure with all extra files archived

### Key Files
- `src/services/directSupabaseAuth.ts` - Main authentication service
- `src/components/Popup/UsageCounter.tsx` - Usage display component
- `src/components/Iframe/IframeContent.tsx` - Main iframe interface
- `dist/` - Built extension ready for installation

### Archive
All development files, test scripts, and documentation moved to `archive/` folder.

### Installation
1. Run `npm install`
2. Run `npm run build`
3. Load `dist/` folder in Chrome as unpacked extension

### Git Commands for Versioning
```bash
# Create version tag
git tag -a v1.0.0 -m "Working release with full Supabase integration"

# Push tags (if using remote repository)
git push origin v1.0.0

# Create release branch
git checkout -b release-v1.0.0
git push origin release-v1.0.0
```

### Future Updates
- Make changes in a new branch
- Test thoroughly before merging
- Tag new versions as v1.1.0, v1.2.0, etc.
- Keep this working version safe in the v1.0.0 tag
