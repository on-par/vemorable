# Tasks: VeMorable Core Note-Taking Platform

**Input**: Design documents from `/specs/001-we-already-have/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Web app**: Next.js vertical slice architecture
- Feature-based structure: `src/features/[feature-name]/`
- Tests co-located with implementation files
- API routes in `src/pages/api/`

## Phase 3.1: Project Setup & Security Foundation ✅ COMPLETED
- [x] T001 Audit existing codebase for authentication bypass vulnerabilities
- [x] T002 [P] Configure strict TypeScript settings in tsconfig.json
- [x] T003 [P] Setup Vitest configuration in vitest.config.ts
- [x] T004 [P] Configure Playwright for E2E testing in playwright.config.ts
- [x] T005 [P] Setup ESLint with security rules in .eslintrc.json
- [x] T006 [P] Configure Supabase RLS policies migration in supabase/migrations/
- [x] T007 [P] Setup environment validation in src/shared/lib/env.ts
- [x] T008 [P] Configure Sentry error tracking in src/shared/lib/sentry.ts

## Phase 3.2: Security Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Authentication Security Tests
- [x] T009 [P] Auth bypass security test in tests/contract/auth-security.test.ts
- [x] T010 [P] JWT token validation test in tests/contract/jwt-validation.test.ts
- [x] T011 [P] RLS policy enforcement test in tests/contract/rls-policies.test.ts
- [x] T012 [P] API rate limiting test in tests/contract/rate-limiting.test.ts

### API Contract Tests
- [ ] T013 [P] Contract test GET /api/health in tests/contract/health.test.ts
- [ ] T014 [P] Contract test POST /api/notes in tests/contract/notes-post.test.ts
- [ ] T015 [P] Contract test GET /api/notes in tests/contract/notes-get.test.ts
- [ ] T016 [P] Contract test GET /api/notes/[id] in tests/contract/notes-get-id.test.ts
- [ ] T017 [P] Contract test PUT /api/notes/[id] in tests/contract/notes-put.test.ts
- [ ] T018 [P] Contract test DELETE /api/notes/[id] in tests/contract/notes-delete.test.ts
- [ ] T019 [P] Contract test POST /api/notes/voice in tests/contract/notes-voice.test.ts
- [ ] T020 [P] Contract test POST /api/search in tests/contract/search.test.ts
- [ ] T021 [P] Contract test GET /api/summaries in tests/contract/summaries-get.test.ts
- [ ] T022 [P] Contract test POST /api/summaries in tests/contract/summaries-post.test.ts
- [ ] T023 [P] Contract test GET /api/tags in tests/contract/tags.test.ts

### Integration Tests from Quickstart Scenarios
- [ ] T024 [P] Integration test: Account creation & authentication in tests/integration/auth-flow.test.ts
- [ ] T025 [P] Integration test: Text note creation workflow in tests/integration/text-note-creation.test.ts
- [ ] T026 [P] Integration test: Voice note transcription workflow in tests/integration/voice-note-creation.test.ts
- [ ] T027 [P] Integration test: Semantic search functionality in tests/integration/semantic-search.test.ts
- [ ] T028 [P] Integration test: AI summary generation in tests/integration/ai-summary.test.ts
- [ ] T029 [P] Integration test: Note processing pipeline in tests/integration/note-processing.test.ts

## Phase 3.3: Database Models & Security (ONLY after tests are failing)

### Core Database Types
- [ ] T030 [P] Database types generation from Supabase in src/shared/types/database.types.ts
- [ ] T031 [P] User preferences types in src/features/authentication/types/user.types.ts
- [ ] T032 [P] Note entity types in src/features/voice-notes/types/notes.types.ts
- [ ] T033 [P] Tag entity types in src/features/voice-notes/types/tags.types.ts
- [ ] T034 [P] Summary entity types in src/features/chat/types/summary.types.ts

### Database Models with RLS
- [ ] T035 [P] User preferences model with RLS in src/features/authentication/utils/user.utils.ts
- [ ] T036 [P] Note model with embeddings and RLS in src/features/voice-notes/utils/notes.utils.ts
- [ ] T037 [P] Tag model with auto-generation logic in src/features/voice-notes/utils/tags.utils.ts
- [ ] T038 [P] Note-Tag junction operations in src/features/voice-notes/utils/note-tags.utils.ts
- [ ] T039 [P] Summary model with expiration logic in src/features/chat/utils/summary.utils.ts

## Phase 3.4: Core API Implementation

### Security & Middleware
- [ ] T040 Authentication middleware with JWT validation in src/shared/lib/auth.ts
- [ ] T041 Rate limiting middleware for API routes in src/shared/lib/rate-limit.ts
- [ ] T042 Request validation middleware with Zod in src/shared/lib/validation.ts
- [ ] T043 Error handling middleware with Sentry in src/shared/lib/error-handler.ts
- [ ] T044 CORS and security headers in src/shared/lib/security.ts

### API Routes Implementation
- [ ] T045 Health check endpoint in src/pages/api/health.ts
- [ ] T046 Notes list endpoint with pagination in src/pages/api/notes/index.ts
- [ ] T047 Note CRUD operations in src/pages/api/notes/[id].ts
- [ ] T048 Voice note upload endpoint in src/pages/api/notes/voice.ts
- [ ] T049 Semantic search endpoint in src/pages/api/search.ts
- [ ] T050 Summaries list endpoint in src/pages/api/summaries/index.ts
- [ ] T051 Summary generation endpoint in src/pages/api/summaries/generate.ts
- [ ] T052 Tags list endpoint in src/pages/api/tags.ts

## Phase 3.5: AI Processing Services

### OpenAI Integration
- [ ] T053 [P] OpenAI client configuration in src/shared/lib/openai.ts
- [ ] T054 [P] Whisper transcription service in src/features/voice-notes/utils/transcription.utils.ts
- [ ] T055 [P] Text embedding generation service in src/features/voice-notes/utils/embeddings.utils.ts
- [ ] T056 [P] Note processing service with GPT-4o-mini in src/features/voice-notes/utils/processing.utils.ts
- [ ] T057 [P] AI summarization service with GPT-4o in src/features/chat/utils/summarization.utils.ts
- [ ] T058 [P] Auto-tagging service in src/features/voice-notes/utils/auto-tagging.utils.ts

### Background Processing
- [ ] T059 Note processing queue system in src/shared/lib/queue.ts
- [ ] T060 Processing status state machine in src/features/voice-notes/utils/processing-states.utils.ts
- [ ] T061 Audio cleanup service (24h expiration) in src/features/voice-notes/utils/audio-cleanup.utils.ts
- [ ] T062 Summary expiration service (30 days) in src/features/chat/utils/summary-cleanup.utils.ts

## Phase 3.6: Frontend Components & Hooks

### Authentication Feature
- [ ] T063 [P] useAuth hook in src/features/authentication/hooks/useAuth.ts
- [ ] T064 [P] LoginForm component in src/features/authentication/components/LoginForm.tsx
- [ ] T065 [P] SignUpForm component in src/features/authentication/components/SignUpForm.tsx
- [ ] T066 [P] UserButton component in src/features/authentication/components/UserButton.tsx

### Voice Notes Feature
- [ ] T067 [P] useVoiceRecording hook in src/features/voice-notes/hooks/useVoiceRecording.ts
- [ ] T068 [P] useNotes hook with optimistic updates in src/features/voice-notes/hooks/useNotes.ts
- [ ] T069 [P] VoiceRecorder component in src/features/voice-notes/components/VoiceRecorder.tsx
- [ ] T070 [P] NotesList component in src/features/voice-notes/components/NotesList.tsx
- [ ] T071 [P] NoteCard component with status display in src/features/voice-notes/components/NoteCard.tsx
- [ ] T072 [P] NoteEditor component in src/features/voice-notes/components/NoteEditor.tsx

### Search Feature  
- [ ] T073 [P] useSearch hook with debouncing in src/features/search/hooks/useSearch.ts
- [ ] T074 [P] SearchBar component in src/features/search/components/SearchBar.tsx
- [ ] T075 [P] SearchResults component in src/features/search/components/SearchResults.tsx

### Chat/Summary Feature
- [ ] T076 [P] useSummaries hook in src/features/chat/hooks/useSummaries.ts
- [ ] T077 [P] SummaryGenerator component in src/features/chat/components/SummaryGenerator.tsx
- [ ] T078 [P] SummaryCard component in src/features/chat/components/SummaryCard.tsx

## Phase 3.7: Shared UI Components
- [ ] T079 [P] Button component in src/shared/components/ui/Button.tsx
- [ ] T080 [P] Input component in src/shared/components/ui/Input.tsx
- [ ] T081 [P] Loading component in src/shared/components/ui/Loading.tsx
- [ ] T082 [P] ErrorBoundary component in src/shared/components/ui/ErrorBoundary.tsx
- [ ] T083 [P] Layout component in src/shared/components/layout/Layout.tsx

## Phase 3.8: E2E Tests & Production Scenarios
- [ ] T084 Fix existing E2E authentication bypass failures in tests/e2e/auth-bypass.spec.ts
- [ ] T085 [P] E2E test: Complete user onboarding flow in tests/e2e/user-onboarding.spec.ts
- [ ] T086 [P] E2E test: Voice note creation workflow in tests/e2e/voice-note-workflow.spec.ts
- [ ] T087 [P] E2E test: Text note creation workflow in tests/e2e/text-note-workflow.spec.ts
- [ ] T088 [P] E2E test: Search functionality across note types in tests/e2e/search-workflow.spec.ts
- [ ] T089 [P] E2E test: AI summarization workflow in tests/e2e/summary-workflow.spec.ts
- [ ] T090 [P] E2E test: Note processing pipeline in tests/e2e/processing-workflow.spec.ts
- [ ] T091 [P] E2E test: Error handling scenarios in tests/e2e/error-handling.spec.ts

## Phase 3.9: Performance & Monitoring
- [ ] T092 [P] Performance monitoring setup in src/shared/lib/analytics.ts
- [ ] T093 [P] Audio compression utilities in src/features/voice-notes/utils/audio.utils.ts
- [ ] T094 [P] Vector search optimization in src/features/search/utils/search.utils.ts
- [ ] T095 [P] Caching layer for embeddings in src/shared/lib/cache.ts
- [ ] T096 [P] API response caching in src/shared/lib/api-cache.ts

## Phase 3.10: Production Deployment & Polish
- [ ] T097 Production environment configuration in .env.production
- [ ] T098 [P] Database migration scripts in supabase/migrations/production/
- [ ] T099 [P] CI/CD pipeline configuration in .github/workflows/
- [ ] T100 [P] Vercel deployment configuration in vercel.json
- [ ] T101 [P] Security headers configuration in next.config.js
- [ ] T102 Manual testing using quickstart.md scenarios
- [ ] T103 Performance testing with k6 scripts in tests/load/
- [ ] T104 [P] Production monitoring alerts in src/shared/lib/monitoring.ts
- [ ] T105 [P] API documentation updates in docs/api.md

## Dependencies

### Critical Path (Security First)
- Setup (T001-T008) → Security Tests (T009-T029) → Models (T030-T039) → API Implementation (T040-T052)

### Feature Development Path  
- Models (T030-T039) → API Routes (T045-T052) → AI Services (T053-T062) → Frontend (T063-T083)

### Testing Path
- Contract Tests (T013-T023) → Integration Tests (T024-T029) → E2E Tests (T084-T091)

### Production Path
- Core Implementation → Performance (T092-T096) → Deployment (T097-T105)

## Parallel Execution Examples

### Security Tests Phase (Run together)
```
Task: "Auth bypass security test in tests/contract/auth-security.test.ts"
Task: "JWT token validation test in tests/contract/jwt-validation.test.ts" 
Task: "RLS policy enforcement test in tests/contract/rls-policies.test.ts"
Task: "API rate limiting test in tests/contract/rate-limiting.test.ts"
```

### Contract Tests Phase (Run together)
```
Task: "Contract test POST /api/notes in tests/contract/notes-post.test.ts"
Task: "Contract test GET /api/notes in tests/contract/notes-get.test.ts"
Task: "Contract test POST /api/search in tests/contract/search.test.ts"
Task: "Contract test GET /api/tags in tests/contract/tags.test.ts"
```

### Database Models Phase (Run together)
```
Task: "Note model with embeddings and RLS in src/features/voice-notes/utils/notes.utils.ts"
Task: "Tag model with auto-generation logic in src/features/voice-notes/utils/tags.utils.ts"
Task: "Summary model with expiration logic in src/features/chat/utils/summary.utils.ts"
Task: "User preferences model with RLS in src/features/authentication/utils/user.utils.ts"
```

### AI Services Phase (Run together)  
```
Task: "Whisper transcription service in src/features/voice-notes/utils/transcription.utils.ts"
Task: "Text embedding generation service in src/features/voice-notes/utils/embeddings.utils.ts"
Task: "AI summarization service with GPT-4o in src/features/chat/utils/summarization.utils.ts"
Task: "Auto-tagging service in src/features/voice-notes/utils/auto-tagging.utils.ts"
```

## Notes
- [P] tasks = different files, no dependencies
- **Security priority**: Complete T009-T012 before any API implementation
- **TDD mandatory**: All tests must fail before implementation
- Commit after each task completion
- Run `npm run lint && npm run type-check` after each phase
- Monitor production metrics during deployment phase

## Task Generation Rules
*Applied during main() execution*

1. **From Contracts** (api-spec.yaml):
   - 8 endpoints → 11 contract test tasks [P]
   - Each endpoint → implementation task with security
   
2. **From Data Model** (data-model.md):
   - 5 entities → 5 model creation tasks [P]
   - Relationships → service layer tasks
   
3. **From Quickstart** (test scenarios):
   - 5 user stories → 5 integration tests [P]
   - Production deployment → E2E validation tasks

4. **From Production Context** (security focus):
   - Authentication bypass → Security test priority
   - E2E failures → Dedicated fix tasks
   - Error handling → Comprehensive middleware

5. **Ordering**:
   - Security → Tests → Models → Services → API → Frontend → E2E → Production
   - Dependencies block parallel execution

## Validation Checklist
*GATE: Checked by main() before returning*

- [x] All contracts have corresponding tests (T013-T023)
- [x] All entities have model tasks (T030-T039)
- [x] All tests come before implementation (TDD enforced)
- [x] Security tests prioritized (T009-T012)
- [x] Parallel tasks truly independent (different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] E2E test failures addressed (T084)
- [x] Production deployment covered (T097-T105)
- [x] Performance targets addressed (T092-T096)

## Execution Summary
**Total Tasks**: 105 production-ready tasks
**Parallel Opportunities**: 67 tasks marked [P] for concurrent execution
**Critical Path**: Security → TDD Tests → Core Implementation → Production
**Estimated Timeline**: 8-10 sprints for full production deployment
**Success Criteria**: All quickstart scenarios pass, security vulnerabilities resolved, production metrics within targets