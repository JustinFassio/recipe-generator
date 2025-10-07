# Migration Utility Scripts

**Status:** 🟢 Ready to Extract  
**Priority:** P2 Medium  
**Type:** Tooling/Infrastructure  
**Estimated Effort:** XS (< 2 hours)  
**Created:** 2025-10-07  
**Last Updated:** 2025-10-07

## Problem Statement

### What is the issue?

During development of the `feature/debug-production-csp-errors` branch, three valuable utility scripts were created for database maintenance and diagnostics. These scripts are currently trapped in an unmerged branch but provide standalone value.

### Scripts Created

1. **`migrate-picsum-images.js`** - Replace picsum.photos URLs with local placeholders
2. **`migrate-dalle-images.js`** - Migrate DALL-E 2 URLs to DALL-E 3 format
3. **`diagnose-database-issues.js`** - Diagnostic tool for database connectivity and schema issues

### When was it discovered?

- Created during CSP and image handling fixes
- Identified as valuable standalone utilities
- Currently on `feature/debug-production-csp-errors` branch (commit `7b57dbc` and related)

### Impact Assessment

- **Users Affected:** Development team and database administrators
- **Severity:** Medium (improves maintainability and debugging)
- **Workaround Available:** Manual database queries (time-consuming and error-prone)

## Root Cause Analysis

### Why were these scripts needed?

1. **migrate-picsum-images.js**
   - Seed data historically used external picsum.photos service
   - CSP policy changes required migration to local resources
   - Needed bulk update capability for existing database records

2. **migrate-dalle-images.js**
   - OpenAI deprecated DALL-E 2 API
   - Existing image URLs in database using old format
   - Needed migration path to DALL-E 3 URLs

3. **diagnose-database-issues.js**
   - Complex database setup with multiple schemas and policies
   - Debugging connection issues difficult without tooling
   - Needed systematic diagnostic capability

### Contributing Factors

- Lack of existing migration script infrastructure
- No standardized database diagnostic tools
- Ad-hoc approach to schema changes

## Proposed Solution

### High-Level Approach

Extract these scripts to a dedicated branch and merge them as standalone utilities, independent of the CSP fixes.

### Technical Details

**Script Capabilities:**

1. **migrate-picsum-images.js** (118 lines)
   - Connects to Supabase database
   - Finds all records with picsum.photos URLs
   - Replaces with local placeholder (`/recipe-generator-logo.png`)
   - Provides dry-run mode for safety
   - Logs all changes for audit trail

2. **migrate-dalle-images.js** (168 lines)
   - Identifies DALL-E 2 format URLs
   - Converts to DALL-E 3 format
   - Handles various URL patterns
   - Includes error handling and rollback
   - Reports success/failure metrics

3. **diagnose-database-issues.js** (199 lines)
   - Tests database connectivity
   - Validates schema existence
   - Checks RLS policies
   - Verifies table permissions
   - Outputs detailed diagnostic report

### Alternatives Considered

1. **Include in CSP branch**
   - Pros: Related to image handling
   - Cons: Couples utility scripts with bug fixes
   - **Rejected:** Scripts have independent value

2. **Manual database operations**
   - Pros: No code needed
   - Cons: Error-prone, not repeatable
   - **Rejected:** Doesn't scale, hard to audit

3. **Use database GUI tools**
   - Pros: Visual interface
   - Cons: Not scriptable, no version control
   - **Rejected:** Lacks automation and documentation

**Chosen Approach:** Extract scripts to separate branch because they provide standalone value and may be needed regardless of CSP fixes.

## Implementation Plan

### Prerequisites

- [ ] Review scripts for any dependencies on CSP branch changes
- [ ] Ensure scripts work with current main branch database schema
- [ ] Add documentation/comments where needed

### Steps

1. **Create Utility Scripts Branch**

   ```bash
   git checkout -b chore/add-migration-utilities main
   ```

2. **Manually Copy Scripts** (cherry-pick would cause conflicts)

   ```bash
   # From feature/debug-production-csp-errors, copy these files:
   # - scripts/migrate-picsum-images.js
   # - scripts/migrate-dalle-images.js
   # - scripts/diagnose-database-issues.js
   ```

3. **Add Documentation**
   - Create `scripts/migrations/README.md`
   - Document usage for each script
   - Add safety warnings and best practices

4. **Add Safety Features**
   - Ensure all scripts have dry-run mode
   - Add confirmation prompts for destructive operations
   - Include backup recommendations

5. **Test Scripts**
   - Test on local database
   - Verify dry-run mode works
   - Confirm actual migrations work
   - Test rollback procedures

### Code Changes

#### Files to Create

- `scripts/migrations/migrate-picsum-images.js` - Picsum URL migration
- `scripts/migrations/migrate-dalle-images.js` - DALL-E URL migration
- `scripts/diagnostics/diagnose-database-issues.js` - Database diagnostic tool
- `scripts/migrations/README.md` - Migration script documentation
- `scripts/diagnostics/README.md` - Diagnostic tool documentation

#### Files to Modify

- `package.json` - Add script commands for convenience:
  ```json
  {
    "scripts": {
      "migrate:picsum": "node scripts/migrations/migrate-picsum-images.js",
      "migrate:dalle": "node scripts/migrations/migrate-dalle-images.js",
      "diagnose:db": "node scripts/diagnostics/diagnose-database-issues.js"
    }
  }
  ```

### Testing Strategy

#### Script Testing Checklist

**migrate-picsum-images.js:**

- [ ] Dry-run mode displays correct records to update
- [ ] Actual run updates only intended records
- [ ] No unintended side effects
- [ ] Logging captures all changes
- [ ] Works with production credentials

**migrate-dalle-images.js:**

- [ ] Correctly identifies DALL-E 2 URLs
- [ ] Conversion logic produces valid DALL-E 3 URLs
- [ ] Handles edge cases (null URLs, malformed URLs)
- [ ] Rollback works if needed
- [ ] Reports accurate statistics

**diagnose-database-issues.js:**

- [ ] Connects to database successfully
- [ ] Identifies missing tables
- [ ] Reports RLS policy issues
- [ ] Validates schema integrity
- [ ] Outputs readable diagnostic report

## Migration Path

### Breaking Changes

None - these are new utility scripts

### Backward Compatibility

Not applicable - new additions only

### Rollback Plan

If scripts cause issues, simply don't run them. They can be removed from the repository without impacting application functionality.

## Success Criteria

### Functional Requirements

- [ ] All three scripts execute successfully
- [ ] Scripts have dry-run modes
- [ ] Clear documentation provided
- [ ] Package.json commands added
- [ ] Error handling robust

### Non-Functional Requirements

- [ ] Scripts follow Node.js best practices
- [ ] Code is well-commented
- [ ] Documentation is clear and complete
- [ ] Safety measures in place

### Validation

- [ ] Local testing complete
- [ ] Code review passed
- [ ] Documentation reviewed
- [ ] Scripts run successfully on staging database

## Dependencies

### Blocked By

None - ready to implement

### Blocks

- CSP fixes may use picsum migration script
- Future image migrations may use DALL-E script

### Related Work

- CSP and Image Handling Fixes ([csp-and-image-handling.md](./csp-and-image-handling.md))

## Risks & Mitigation

| Risk                   | Probability | Impact   | Mitigation                                             |
| ---------------------- | ----------- | -------- | ------------------------------------------------------ |
| Script corrupts data   | Low         | Critical | Dry-run mode, backup requirements, transaction support |
| Database timeout       | Medium      | Low      | Add connection retry logic, increase timeout           |
| Permission issues      | Low         | Medium   | Document required permissions, test with service role  |
| Script incompatibility | Low         | Medium   | Test on local DB first, version control all changes    |

## Lessons Learned

### From Previous Attempts

- Creating utilities during feature development is valuable
- Scripts should be extracted and shared early
- Good documentation prevents misuse
- Safety features (dry-run, confirmations) are essential

### Key Insights

1. **Utility scripts have value independent of features**
2. **Migration scripts should be versioned and documented**
3. **Diagnostic tools save debugging time**
4. **Dry-run mode is non-negotiable**
5. **Clear logging enables audit trails**

### Future Improvements

1. Create migration script template
2. Establish migration script naming convention
3. Add migration tracking table (which migrations ran when)
4. Create standardized logging format
5. Build CLI tool for running migrations

## Script Documentation

### migrate-picsum-images.js

**Purpose:** Replace all picsum.photos image URLs with local placeholder

**Usage:**

```bash
# Dry run (shows what would change)
npm run migrate:picsum -- --dry-run

# Actual migration
npm run migrate:picsum

# With custom placeholder
npm run migrate:picsum -- --placeholder=/custom-image.png
```

**Safety Features:**

- Dry-run mode enabled by default
- Confirmation prompt before making changes
- Transaction-based updates (all or nothing)
- Detailed logging of all changes

**Database Impact:**

- Updates `recipes` table `image_url` column
- May affect user-uploaded recipes if they used picsum URLs

---

### migrate-dalle-images.js

**Purpose:** Migrate DALL-E 2 image URLs to DALL-E 3 format

**Usage:**

```bash
# Dry run
npm run migrate:dalle -- --dry-run

# Actual migration
npm run migrate:dalle

# Rollback to DALL-E 2 format
npm run migrate:dalle -- --rollback
```

**Safety Features:**

- Dry-run mode
- Stores original URLs for rollback
- Validates new URLs before updating
- Reports success/failure statistics

**Database Impact:**

- Updates `recipes` table `image_url` column
- May update `recipe_images` table if implemented

---

### diagnose-database-issues.js

**Purpose:** Comprehensive database health check and diagnostic tool

**Usage:**

```bash
# Full diagnostic
npm run diagnose:db

# Specific checks
npm run diagnose:db -- --check=connectivity
npm run diagnose:db -- --check=schema
npm run diagnose:db -- --check=rls

# Output to file
npm run diagnose:db > db-diagnostic-report.txt
```

**Checks Performed:**

1. Database connectivity
2. Schema existence and integrity
3. Table permissions
4. RLS policy validation
5. Function availability
6. Trigger status
7. Index health

**Output Format:**

```
=== Database Diagnostic Report ===
Generated: 2025-10-07 14:30:00

[✓] Database Connection: OK
[✓] Schema 'public': EXISTS
[✓] Table 'recipes': EXISTS (1234 rows)
[✗] RLS Policy 'recipe_select_policy': MISSING
[!] Table 'recipe_images': SLOW QUERIES DETECTED

=== Summary ===
Total Checks: 15
Passed: 12
Failed: 2
Warnings: 1
```

## Timeline

| Phase                  | Duration | Start Date | End Date   | Status      |
| ---------------------- | -------- | ---------- | ---------- | ----------- |
| Documentation          | 1 hour   | 2025-10-07 | 2025-10-07 | ✅ Complete |
| Script Extraction      | 1 hour   | TBD        | TBD        | 🟡 Pending  |
| Documentation Creation | 1 hour   | TBD        | TBD        | 🟡 Pending  |
| Testing                | 2 hours  | TBD        | TBD        | 🟡 Pending  |
| Code Review            | 1 day    | TBD        | TBD        | 🟡 Pending  |
| Merge                  | 15 min   | TBD        | TBD        | 🟡 Pending  |

**Total Estimated Time:** 5 hours of active work + 1 day review

## Resources

### Documentation

- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

### References

- Original scripts from commit `7b57dbc` and related

### Examples

- Supabase migration examples: [Community Scripts](https://github.com/supabase/supabase/tree/master/examples)

## Notes

### Implementation Notes

- Test scripts on local database first
- Always backup production database before running migrations
- Monitor database performance after migrations
- Keep migration logs for audit purposes

### Review Notes

Reviewers should focus on:

- SQL query correctness
- Error handling robustness
- Safety features (dry-run, confirmations)
- Documentation clarity

### Deployment Notes

These scripts are developer tools and don't require "deployment" in the traditional sense. However:

1. Ensure team members know the scripts exist
2. Document when each script should be run
3. Add to onboarding documentation
4. Include in DevOps runbooks

---

**Assignee:** TBD  
**Reviewer:** TBD  
**Branch:** `chore/add-migration-utilities`  
**PR:** TBD

## Quick Start

```bash
# Create branch
git checkout -b chore/add-migration-utilities main

# Create directory structure
mkdir -p scripts/migrations scripts/diagnostics

# Copy scripts from feature branch (manually)
# ... copy files ...

# Create documentation
cat > scripts/migrations/README.md << 'EOF'
# Migration Scripts

[Add documentation here]
EOF

# Test locally
npm run migrate:picsum -- --dry-run
npm run diagnose:db

# Commit and push
git add scripts/
git add package.json
git commit -m "chore: add database migration and diagnostic utilities"
git push origin chore/add-migration-utilities
```
