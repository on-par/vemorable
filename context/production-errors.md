# VeMorable Production Errors

## Test Date: 2025-09-05

## Summary
Testing note creation functionality on production (vemorable.com) reveals a critical issue with saving notes to the database after successful AI processing.

## Critical Issue: Note Creation Failure

### Error Details
- **Error Type**: HTTP 400 Bad Request
- **Failing Endpoint**: `POST /api/notes`
- **User Impact**: Users cannot save any notes, making the application unusable
- **Error Message**: "Failed to save note" (displayed in UI)

### Request Flow Analysis
1. ✅ User enters text note content: "Test note"
2. ✅ `POST /api/process-note` - Returns 200 (AI processing successful)
3. ❌ `POST /api/notes` - Returns 400 (Database save fails)

### Root Cause Analysis

Based on the error pattern and recent code changes, the most likely cause is a **property name mismatch** between the frontend and backend:

#### Evidence
- The frontend was recently fixed to use `processed_content` instead of `processedContent` (commit f55ef05)
- The `/api/process-note` endpoint returns data with `processed_content` property
- The `/api/notes` endpoint validation likely expects a different property name or structure

#### Suspected Issue
The API response from `/api/process-note` returns:
```json
{
  "data": {
    "processed_content": "...",  // Note: snake_case
    "title": "...",
    "summary": "...",
    "tags": [...]
  }
}
```

But the frontend is sending to `/api/notes`:
```json
{
  "raw_transcript": "Test note",
  "processed_content": "...",  // This might be undefined/null
  "title": "...",
  "summary": "...",
  "tags": [...]
}
```

The 400 error suggests validation failure, likely because `processed_content` is coming through as undefined or the wrong type.

## Tasks to Resolve

### Immediate Fixes (P0 - Critical)

- [ ] Verify the exact property names expected by the `/api/notes` endpoint validation schema
- [ ] Check if `/api/process-note` response structure matches what the frontend expects (data.processed_content vs data.processedContent)
- [ ] Ensure VoiceNoteModal.tsx correctly extracts processed_content from the AI processing response
- [ ] Add proper error logging to `/api/notes` endpoint to capture validation error details
- [ ] Test the fix locally with the same "Test note" input before deploying

### Data Flow Verification (P1 - High)

- [ ] Add console.log statements to track the processedData object structure after AI processing
- [ ] Verify that all required fields are present and non-null before calling `/api/notes`
- [ ] Check if the Zod schema in `/api/notes/route.ts` matches the actual request payload
- [ ] Ensure database schema supports all fields being sent in the request

### Testing & Monitoring (P1 - High)

- [ ] Add integration tests for the complete note creation flow (process → save)
- [ ] Implement proper error boundaries and user-friendly error messages
- [ ] Add Sentry or similar error tracking to capture production errors with full context
- [ ] Create E2E tests using Playwright to catch these issues before deployment

### Infrastructure Checks (P2 - Medium)

- [ ] Verify Supabase database connection and permissions in production
- [ ] Check if there are any database migration issues in production
- [ ] Ensure all environment variables are correctly set in Vercel
- [ ] Review the production logs in Vercel dashboard for additional error details

### Code Quality Improvements (P2 - Medium)

- [ ] Standardize property naming convention across the codebase (snake_case vs camelCase)
- [ ] Add TypeScript interfaces for all API request/response payloads
- [ ] Implement request/response interceptors for consistent error handling
- [ ] Add input validation on the frontend before making API calls

## Additional Observations

### Minor Issues

1. **Deprecated Clerk Warning**: 
   - Message: "The prop 'afterSignInUrl' is deprecated"
   - Impact: Low - Just a warning, not affecting functionality
   - [ ] Update Clerk configuration to use 'fallbackRedirectUrl' or 'forceRedirectUrl'

2. **Missing Error Details**:
   - The 400 error doesn't provide specific validation failure details
   - [ ] Enhance error responses to include field-specific validation errors

## Reproduction Steps

1. Navigate to https://vemorable.com
2. Click the blue "+" floating action button
3. Select "Text Note"
4. Enter "Test note" in the text field
5. Click "Save Note"
6. Observe: "Failed to save note" error message

## Screenshots

- Landing/Dashboard: `.playwright-mcp/vemorable-landing.png`
- Error State: `.playwright-mcp/vemorable-save-note-error.png`

## Recommended Next Steps

1. **Immediate**: Fix the property name mismatch issue (most likely root cause)
2. **Today**: Deploy fix and verify in production
3. **This Week**: Implement proper error tracking and monitoring
4. **This Sprint**: Add comprehensive E2E tests for all user flows