# Implementation Plan: VeMorable Core Note-Taking Platform

**Branch**: `001-we-already-have` | **Date**: 2025-09-09 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-we-already-have/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, or `GEMINI.md` for Gemini CLI).
6. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
VeMorable is an AI-powered voice and text note-taking platform that automatically organizes, tags, and enables intelligent search of personal notes without user-managed folders or categories. The system uses LLMs for transcription, semantic analysis, automatic tagging, and natural language search capabilities. Primary focus is resolving production-blocking bugs, ensuring security, and achieving production-readiness.

## Technical Context
**Language/Version**: TypeScript 5.x, Node.js 18+  
**Primary Dependencies**: Next.js 14, Supabase (PostgreSQL + Auth), OpenAI API, Web Speech API  
**Storage**: PostgreSQL (Supabase) with vector embeddings for semantic search  
**Testing**: Vitest, Testing Library, Playwright for E2E  
**Target Platform**: Web application (responsive design)  
**Project Type**: web (frontend + backend)  
**Performance Goals**: <2s voice transcription, <500ms search responses, support 10k+ notes per user  
**Constraints**: Real-time voice recording, offline-capable search, secure API key management  
**Scale/Scope**: Multi-tenant SaaS, 1k+ concurrent users, enterprise-ready security  
**Production Context**: Resolve authentication bypass vulnerabilities, fix E2E test failures, implement proper error handling, secure API endpoints

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 2 (frontend Next.js app, backend API routes)
- Using framework directly? Yes (Next.js API routes, no wrapper abstractions)
- Single data model? Yes (unified Note entity with embeddings)
- Avoiding patterns? Yes (direct Supabase client, no repository layer initially)

**Architecture**:
- EVERY feature as library? Yes (voice-notes, authentication, chat, search features)
- Libraries listed: voice-notes (recording/transcription), authentication (Clerk/Supabase Auth), chat (LLM interaction), search (semantic search), note-processing (AI tagging/summarization)
- CLI per library: Development CLI tools for note processing, embedding generation
- Library docs: llms.txt format planned for AI context

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? Yes - tests written first for all new features
- Git commits show tests before implementation? Yes - test commits precede implementation
- Order: Contract→Integration→E2E→Unit strictly followed? Yes
- Real dependencies used? Yes (actual Supabase instance, OpenAI API)
- Integration tests for: Authentication flows, voice transcription, AI processing pipelines, search functionality
- FORBIDDEN: Implementation before test, skipping RED phase

**Observability**:
- Structured logging included? Yes - JSON logging with correlation IDs
- Frontend logs → backend? Yes - error reporting to backend with user context
- Error context sufficient? Yes - full error traces with user actions

**Versioning**:
- Version number assigned? 1.0.0 for production release
- BUILD increments on every change? Yes - automated via CI/CD
- Breaking changes handled? Yes - API versioning strategy with backward compatibility

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
src/
├── features/
│   ├── authentication/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   └── types/
│   ├── voice-notes/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   └── types/
│   ├── chat/
│   └── search/
├── shared/
│   ├── components/
│   ├── lib/
│   ├── types/
│   └── utils/
└── pages/
    └── api/

tests/
├── contract/
├── integration/
└── unit/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: Web application structure (Option 2) - Next.js frontend with API routes backend

## Phase 0: Outline & Research

1. **Extract unknowns from Technical Context** above:
   - Voice transcription accuracy and language support requirements
   - Processing time expectations for AI operations  
   - Authentication and user account system architecture
   - Specific privacy and security requirements for production
   - Production deployment and scaling considerations

2. **Generate and dispatch research agents**:
   ```
   Task: "Research voice transcription solutions comparing Web Speech API vs OpenAI Whisper for accuracy and language support"
   Task: "Research Next.js production deployment best practices for Vercel with Supabase"
   Task: "Research authentication security patterns for Next.js apps with Supabase Auth"
   Task: "Research vector database optimization for semantic search performance"
   Task: "Research production monitoring and error handling for AI-powered applications"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Note entity with content, embeddings, tags, metadata
   - User entity with preferences and permissions
   - Tag entity with automatic generation metadata
   - Summary entity for synthesized content

2. **Generate API contracts** from functional requirements:
   - Voice note creation and transcription endpoints
   - Text note CRUD operations
   - Semantic search with natural language queries
   - AI summarization and tagging endpoints
   - User authentication and session management
   - Output OpenAPI schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - Voice upload and transcription flow tests
   - Note creation and retrieval tests
   - Search functionality tests with various query types
   - AI processing pipeline tests
   - Authentication and authorization tests

4. **Extract test scenarios** from user stories:
   - Complete voice note capture workflow
   - Natural language search scenarios
   - Note summarization and organization flows
   - Error handling and edge cases

5. **Update agent file incrementally** (O(1) operation):
   - Run `/scripts/update-agent-context.sh claude` for Claude Code
   - Add current Next.js, Supabase, OpenAI configuration
   - Include production security requirements
   - Update with bug fixes and security patches

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, CLAUDE.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base
- Generate production-readiness tasks from security audit
- Each API endpoint → security hardening task [P]
- Each authentication flow → security test task [P] 
- Each AI processing pipeline → error handling task
- E2E test fixes for authentication bypass issues
- Production deployment configuration tasks

**Ordering Strategy**:
- Security fixes first (authentication bypass, API security)
- TDD order: Security tests before implementation fixes
- Core functionality: Voice recording → Transcription → AI processing → Search
- Production deployment: Database setup → API deployment → Frontend deployment

**Estimated Output**: 35-40 numbered, ordered tasks in tasks.md focusing on production readiness

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Vector embeddings storage | Semantic search requires similarity matching | Full-text search insufficient for natural language queries |
| Multiple AI API integrations | Different models for transcription vs processing | Single model insufficient for quality requirements |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*