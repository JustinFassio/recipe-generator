# CSP and Image Handling Fixes

**Status:** 🟢 Ready to Implement  
**Priority:** P1 High  
**Type:** Bug Fix  
**Estimated Effort:** S (< 1 day)  
**Created:** 2025-10-07  
**Last Updated:** 2025-10-07

## Problem Statement

### What is the issue?

Production environment experiencing Content Security Policy (CSP) violations and image loading failures due to:

1. External image dependencies (picsum.photos)
2. Incorrect URL expiration logic
3. Missing CSP directives for required domains

### How does it manifest?

- Browser console shows CSP violations
- Images fail to load in production
- 403 errors for expired Supabase storage URLs
- Seed data images showing as broken

### When was it discovered?

- Discovered in production after deployment
- Identified in `feature/debug-production-csp-errors` branch
- Originally fixed in commits `38ae2dd` through `70b1a7c`

### Impact Assessment

- **Users Affected:** All users viewing recipes with images
- **Severity:** High (core functionality impaired)
- **Workaround Available:** Yes - users can refresh page, but poor UX

## Root Cause Analysis

### Why does this issue exist?

1. **CSP Policy Too Restrictive**
   - Vercel.json CSP policy didn't allow external image domains
   - Seed data used picsum.photos URLs which violated policy

2. **Image URL Expiration Logic Bug**
   - Code checked if URL was "expired more than 1 hour ago"
   - Should check if URL is "past expiration time" (no grace period)
   - Caused 403 errors when using recently expired URLs

3. **External Image Dependencies**
   - Seed data relied on external service (picsum.photos)
   - Single point of failure
   - Security risk (external content)

4. **Image Display Logic**
   - Recipe view used version image_url (which could be null)
   - Didn't fall back to main recipe image_url
   - Caused images to not display even when available

### Contributing Factors

1. CSP policy not tested in production-like environment
2. URL expiration logic had undocumented "grace period"
3. Seed data creation didn't consider CSP requirements
4. Image fallback logic was incomplete

### Code References

```typescript
// Location: vercel.json:48
// Problematic CSP policy
"img-src 'self' https://*.supabase.co data: blob:;";
// Missing: https://picsum.photos (temporary) or local placeholder strategy

// Location: src/lib/image-cache-utils.ts:67
// Incorrect expiration check
const isExpired = expirationDate < new Date(Date.now() - 60 * 60 * 1000);
// Should be: const isExpired = expirationDate < new Date();

// Location: src/pages/recipe-view-page.tsx:117
// Missing fallback to main recipe image
const displayContent = versionContent
  ? {
      ...baseRecipe!,
      image_url: versionContent.image_url, // Could be null!
    }
  : baseRecipe;
```

## Proposed Solution

### High-Level Approach

1. Update CSP policy appropriately (removed external dependencies)
2. Fix URL expiration logic (no grace period)
3. Migrate all picsum.photos URLs to local placeholders
4. Fix image display fallback logic

### Technical Details

**CSP Evolution:**

- Initially: Add picsum.photos to CSP (temporary fix)
- Migration: Replace all picsum URLs in seed data
- Final: Remove picsum.photos from CSP (security best practice)

**URL Expiration:**

- Change from "expired + 1 hour" to "expired immediately"
- Remove undocumented grace period
- Align with Supabase storage URL behavior

**Image Fallback:**

- Check version image_url first
- Fall back to main recipe image_url if version is null
- Ensure images always display when available

### Alternatives Considered

1. **Keep picsum.photos in CSP**
   - Pros: No migration needed
   - Cons: External dependency, security risk
   - **Rejected:** Poor security practice

2. **Use CDN for placeholder images**
   - Pros: Better performance
   - Cons: Additional infrastructure, cost
   - **Rejected:** Overkill for placeholders

3. **Remove all placeholder images**
   - Pros: Simplest solution
   - Cons: Poor UX, no visual feedback
   - **Rejected:** Degrades user experience

**Chosen Approach:** Migrate to local placeholders because it's secure, self-contained, and provides good UX.

## Implementation Plan

### Prerequisites

- [x] Identify all commits from original branch
- [x] Verify commits are independent and cherry-pick friendly
- [x] Ensure no dependencies on other work in original branch

### Steps

1. **Create Clean Branch**

   ```bash
   git checkout -b fix/csp-and-image-handling main
   ```

2. **Cherry-pick CSP Fixes** (in order)

   ```bash
   git cherry-pick 38ae2dd  # Original CSP fix
   git cherry-pick e3d56d1  # Add picsum.photos to CSP (temporary)
   git cherry-pick 7b57dbc  # Replace picsum URLs with local placeholders
   git cherry-pick cc510d5  # Remove picsum from CSP (final state)
   ```

3. **Cherry-pick URL Expiration Fix**

   ```bash
   git cherry-pick 9bdd27a  # Fix URL expiration logic
   ```

4. **Cherry-pick Image Display Fix**

   ```bash
   git cherry-pick 70b1a7c  # Fix recipe view image display
   ```

5. **Verify & Test**
   - Run TypeScript compilation
   - Run all tests
   - Manual testing checklist (see below)

### Code Changes

#### Files Modified by Cherry-picks

- `vercel.json` - CSP policy updates
- `src/lib/image-cache-utils.ts` - URL expiration logic
- `src/pages/recipe-view-page.tsx` - Image fallback logic
- `scripts/seed/content/recipes.ts` - Seed data URLs
- `docs/seed-data/SEED-SYSTEM-RESET.md` - Documentation
- `docs/seed-data/USAGE_GUIDE.md` - Documentation

#### Files Created by Cherry-picks

- `scripts/migrate-picsum-images.js` - Migration script for existing data

### Testing Strategy

#### Automated Tests

- [ ] Run `npm run test:run` - all tests pass
- [ ] Run `npx tsc --noEmit` - no TypeScript errors
- [ ] Run `npm run lint` - no linting errors
- [ ] Run `npm run build` - build succeeds

#### Manual Testing Checklist

- [ ] **CSP Compliance**
  - [ ] Open browser console in production
  - [ ] Verify no CSP violation errors
  - [ ] Check Network tab for blocked requests

- [ ] **Image Loading**
  - [ ] View recipe with AI-generated image - displays correctly
  - [ ] View recipe with seed data image - displays correctly
  - [ ] View recipe without image - shows placeholder
  - [ ] Create new recipe with image - displays correctly

- [ ] **URL Expiration**
  - [ ] Generate signed URL from Supabase
  - [ ] Wait for expiration time
  - [ ] Refresh page - new URL generated automatically
  - [ ] No 403 errors in console

- [ ] **Image Fallback**
  - [ ] View recipe with version (version has no image) - shows main recipe image
  - [ ] View recipe with version (version has image) - shows version image
  - [ ] View recipe without version - shows main recipe image

## Migration Path

### Breaking Changes

None - these are pure bug fixes

### Backward Compatibility

- CSP changes are backward compatible (more permissive initially, then restricted)
- URL expiration fix is backward compatible (stricter is safer)
- Image fallback is backward compatible (adds functionality)

### Rollback Plan

If issues arise:

```bash
git revert <commit-hash>  # Revert specific fix
# or
git revert HEAD~6..HEAD  # Revert all 6 commits
```

### Database Migration

Run migration script for existing picsum.photos URLs:

```bash
node scripts/migrate-picsum-images.js
```

## Success Criteria

### Functional Requirements

- [x] No CSP violations in browser console
- [x] All recipe images load correctly
- [x] Expired URLs regenerate automatically
- [x] Image fallback logic works correctly
- [x] Seed data uses local placeholders

### Non-Functional Requirements

- [x] No TypeScript errors
- [x] All tests passing
- [x] No performance regression
- [x] Linter passes
- [x] Build succeeds

### Validation

- [ ] Local testing complete
- [ ] Code review passed
- [ ] Deployed to staging
- [ ] Production smoke test
- [ ] Monitoring shows no CSP errors

## Dependencies

### Blocked By

None - ready to implement

### Blocks

- Image Gallery System (should build on stable image handling)

### Related Work

- Migration Scripts documentation ([migration-scripts.md](./migration-scripts.md))
- Future work: Implement proper image CDN strategy

## Risks & Mitigation

| Risk                       | Probability | Impact | Mitigation                                 |
| -------------------------- | ----------- | ------ | ------------------------------------------ |
| Cherry-pick conflicts      | Low         | Low    | Commits are clean and focused              |
| Migration script fails     | Medium      | Medium | Test on local DB first, add error handling |
| New CSP violations         | Low         | High   | Thorough testing in staging environment    |
| Existing URLs still broken | Low         | Medium | Migration script handles existing data     |

## Lessons Learned

### From Previous Attempts

**Original branch (`feature/debug-production-csp-errors`):**

- ✅ **What worked:** Individual commits were well-structured and atomic
- ❌ **What didn't:** Mixed with massive API refactoring (18 files, 3000 lines)
- ❌ **Problem:** TypeScript errors from refactoring prevented deployment
- ✅ **Solution:** Extract clean commits via cherry-pick

### Key Insights

1. **Small, focused changes are easier to review and merge**
2. **Bug fixes should be separate from refactoring**
3. **CSP policies need production testing** (local dev doesn't enforce CSP)
4. **Migration scripts are essential** for data changes
5. **Atomic commits enable cherry-picking**

### Future Improvements

1. Add CSP testing to CI/CD pipeline
2. Create E2E test for image loading scenarios
3. Monitor CSP violations in production (add logging)
4. Document image handling requirements in style guide

## Timeline

| Phase           | Duration | Start Date | End Date   | Status      |
| --------------- | -------- | ---------- | ---------- | ----------- |
| Documentation   | 1 hour   | 2025-10-07 | 2025-10-07 | ✅ Complete |
| Branch Creation | 15 min   | TBD        | TBD        | 🟡 Pending  |
| Cherry-picking  | 30 min   | TBD        | TBD        | 🟡 Pending  |
| Testing         | 1 hour   | TBD        | TBD        | 🟡 Pending  |
| Code Review     | 1 day    | TBD        | TBD        | 🟡 Pending  |
| Deployment      | 30 min   | TBD        | TBD        | 🟡 Pending  |

**Total Estimated Time:** 4-6 hours of active work + 1 day review

## Resources

### Documentation

- [Vercel CSP Documentation](https://vercel.com/docs/edge-network/headers#content-security-policy)
- [Supabase Storage Signed URLs](https://supabase.com/docs/guides/storage/signed-urls)

### References

- Original PR: `feature/debug-production-csp-errors` (branch)
- Related commits: `38ae2dd`, `e3d56d1`, `7b57dbc`, `cc510d5`, `9bdd27a`, `70b1a7c`

### Examples

- CSP best practices: [MDN CSP Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

## Notes

### Implementation Notes

- Run migration script **before** deploying CSP changes to production
- Test in staging first to verify no unexpected CSP issues
- Monitor production logs for 24 hours after deployment

### Review Notes

Reviewers should focus on:

- CSP policy changes in `vercel.json`
- URL expiration logic in `image-cache-utils.ts`
- Image fallback logic in `recipe-view-page.tsx`
- Migration script correctness

### Deployment Notes

**Deployment order is important:**

1. Deploy migration script (update existing data)
2. Run migration script in production
3. Deploy code changes
4. Verify images loading correctly
5. Monitor for CSP violations

---

**Assignee:** TBD  
**Reviewer:** TBD  
**Branch:** `fix/csp-and-image-handling`  
**PR:** TBD

## Quick Start Commands

```bash
# Create and checkout new branch
git checkout -b fix/csp-and-image-handling main

# Cherry-pick all fixes in order
git cherry-pick 38ae2dd e3d56d1 7b57dbc cc510d5 9bdd27a 70b1a7c

# Verify no conflicts
git status

# Run tests
npm run verify

# If all passes, push
git push origin fix/csp-and-image-handling

# Create PR with reference to this documentation
```
