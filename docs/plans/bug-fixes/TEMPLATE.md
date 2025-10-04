# [Bug/Issue Name]

**Status:** 🟢 Ready | 🟡 Planning | 🔴 Blocked  
**Priority:** P0 Critical | P1 High | P2 Medium | P3 Low  
**Type:** Bug Fix | Refactoring | Feature | Performance  
**Estimated Effort:** XS (< 2h) | S (< 1 day) | M (1-3 days) | L (< 1 week) | XL (> 1 week)  
**Created:** YYYY-MM-DD  
**Last Updated:** YYYY-MM-DD

## Problem Statement

### What is the issue?

[Clear description of the problem]

### How does it manifest?

[User-visible symptoms, error messages, broken functionality]

### When was it discovered?

[Branch, PR, production, user report, etc.]

### Impact Assessment

- **Users Affected:** [All users | Specific subset | Edge case]
- **Severity:** [Critical | High | Medium | Low]
- **Workaround Available:** [Yes/No - describe if yes]

## Root Cause Analysis

### Why does this issue exist?

[Technical explanation of the underlying cause]

### Contributing Factors

1. [Factor 1]
2. [Factor 2]
3. [Factor 3]

### Code References

```typescript
// Location: src/path/to/file.ts:123
// Current problematic code
```

## Proposed Solution

### High-Level Approach

[Overview of the fix strategy]

### Technical Details

[Specific implementation details]

### Alternatives Considered

1. **Option A:** [Description]
   - Pros: [...]
   - Cons: [...]
2. **Option B:** [Description]
   - Pros: [...]
   - Cons: [...]

**Chosen Approach:** [Option X] because [reasoning]

## Implementation Plan

### Prerequisites

- [ ] [Dependency 1]
- [ ] [Dependency 2]

### Steps

1. **[Step 1 Title]**
   - Action: [What to do]
   - Files: [Which files to modify]
   - Tests: [What tests to add/update]

2. **[Step 2 Title]**
   - Action: [What to do]
   - Files: [Which files to modify]
   - Tests: [What tests to add/update]

3. **[Step 3 Title]**
   - Action: [What to do]
   - Files: [Which files to modify]
   - Tests: [What tests to add/update]

### Code Changes

#### Files to Modify

- `src/path/to/file1.ts` - [Purpose of changes]
- `src/path/to/file2.ts` - [Purpose of changes]

#### Files to Create

- `src/path/to/newfile.ts` - [Purpose of new file]

#### Files to Delete

- `src/path/to/oldfile.ts` - [Reason for deletion]

### Testing Strategy

- [ ] Unit tests for [specific functionality]
- [ ] Integration tests for [specific workflow]
- [ ] E2E tests for [user journey]
- [ ] Manual testing checklist:
  - [ ] [Test case 1]
  - [ ] [Test case 2]

## Migration Path

### Breaking Changes

[List any breaking changes and their impact]

### Backward Compatibility

[How to maintain compatibility during transition]

### Rollback Plan

[How to revert if something goes wrong]

## Success Criteria

### Functional Requirements

- [ ] [Requirement 1]
- [ ] [Requirement 2]

### Non-Functional Requirements

- [ ] No TypeScript errors
- [ ] All tests passing
- [ ] No performance regression
- [ ] Linter passes
- [ ] Build succeeds

### Validation

- [ ] Local testing complete
- [ ] Code review passed
- [ ] QA verification
- [ ] Deployed to staging
- [ ] Monitoring shows no errors

## Dependencies

### Blocked By

- [Issue/PR that must be completed first]

### Blocks

- [Issues/PRs waiting for this fix]

### Related Work

- [Related PRs, issues, or documentation]

## Risks & Mitigation

| Risk     | Probability  | Impact       | Mitigation            |
| -------- | ------------ | ------------ | --------------------- |
| [Risk 1] | High/Med/Low | High/Med/Low | [Mitigation strategy] |
| [Risk 2] | High/Med/Low | High/Med/Low | [Mitigation strategy] |

## Lessons Learned

### From Previous Attempts

[What was tried before and why it didn't work]

### Key Insights

- [Insight 1]
- [Insight 2]

### Future Improvements

- [How to prevent this issue in the future]
- [Process improvements needed]

## Timeline

| Phase          | Duration | Start Date | End Date | Status   |
| -------------- | -------- | ---------- | -------- | -------- |
| Planning       | [X days] | [Date]     | [Date]   | [Status] |
| Implementation | [X days] | [Date]     | [Date]   | [Status] |
| Testing        | [X days] | [Date]     | [Date]   | [Status] |
| Review         | [X days] | [Date]     | [Date]   | [Status] |
| Deployment     | [X days] | [Date]     | [Date]   | [Status] |

## Resources

### Documentation

- [Link to related docs]

### References

- [External articles, Stack Overflow, etc.]

### Examples

- [Link to similar fixes in other projects]

## Notes

### Implementation Notes

[Additional context for implementers]

### Review Notes

[What reviewers should focus on]

### Deployment Notes

[Special considerations for deployment]

---

**Assignee:** [Name]  
**Reviewer:** [Name]  
**Branch:** `[branch-name]`  
**PR:** #[PR number]
