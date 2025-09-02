# VemoRable Development Guidelines

## Project Overview

VemoRable is a voice-first AI-powered note-taking micro SaaS application built with Next.js 14, TypeScript, Supabase, and OpenAI. The application enables verbal processors to capture thoughts via voice, automatically organize them with AI, and interact with their knowledge base through natural conversation.

## Architecture Principles

### Vertical Slice Architecture
Organize code by **features**, not by technical layers. Each feature should contain all necessary components within its own directory.

```
src/
├── features/
│   ├── authentication/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignUpForm.tsx
│   │   │   └── UserButton.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   ├── types/
│   │   │   └── auth.types.ts
│   │   └── utils/
│   │       └── auth.utils.ts
│   ├── voice-notes/
│   │   ├── components/
│   │   │   ├── VoiceRecorder.tsx
│   │   │   ├── NotesList.tsx
│   │   │   └── NoteCard.tsx
│   │   ├── hooks/
│   │   │   ├── useVoiceRecording.ts
│   │   │   └── useNotes.ts
│   │   ├── api/
│   │   │   ├── transcribe.ts
│   │   │   └── process-note.ts
│   │   ├── types/
│   │   │   └── notes.types.ts
│   │   └── utils/
│   │       └── audio.utils.ts
│   └── chat/
│       ├── components/
│       ├── hooks/
│       ├── api/
│       └── types/
├── shared/
│   ├── components/
│   │   ├── ui/          # Reusable UI components
│   │   └── layout/      # Layout components
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── openai.ts
│   │   └── validations.ts
│   ├── types/
│   │   └── database.types.ts
│   └── utils/
│       └── common.utils.ts
```

### SOLID Principles

**Single Responsibility Principle (SRP)**
- Each component, hook, and utility should have ONE clear responsibility
- Example: `useVoiceRecording` only handles audio recording, NOT transcription

**Open/Closed Principle (OCP)**
- Extend functionality through composition, not modification
- Use interfaces and abstract patterns for extensibility

**Liskov Substitution Principle (LSP)**
- Ensure derived classes can replace base classes without breaking functionality
- Apply to React component inheritance and API response types

**Interface Segregation Principle (ISP)**
- Create focused interfaces rather than large, monolithic ones
- Separate concerns: `NoteCreation` vs `NoteDisplay` vs `NoteSearch`

**Dependency Inversion Principle (DIP)**
- Depend on abstractions, not concretions
- Use dependency injection for services (Supabase client, OpenAI client)

## Code Quality Standards

### Clean Code Practices
- **Meaningful Names**: Use intention-revealing names (`transcribeAudioToText` not `processAudio`)
- **Small Functions**: Functions should do ONE thing and do it well
- **Clear Comments**: Comment WHY, not WHAT the code does
- **Error Handling**: Always handle errors gracefully with user-friendly messages

### DRY (Don't Repeat Yourself)
- Extract common patterns into reusable hooks and utilities
- Create shared TypeScript types for consistent data structures
- Use configuration objects for repeated API patterns

### YAGNI (You Aren't Gonna Need It)
- Build features when needed, not when anticipated
- Start simple, add complexity only when requirements demand it
- Avoid over-engineering initial implementations

## Testing Strategy (TDD)

### Test-Driven Development Approach
1. **Red**: Write failing test first
2. **Green**: Write minimal code to pass test
3. **Refactor**: Improve code while keeping tests green

### Testing Hierarchy
```
src/features/voice-notes/
├── components/
│   ├── VoiceRecorder.tsx
│   ├── VoiceRecorder.test.tsx
│   ├── NotesList.tsx
│   └── NotesList.test.tsx
├── hooks/
│   ├── useVoiceRecording.ts
│   └── useVoiceRecording.test.ts
├── utils/
│   ├── audio.utils.ts
│   └── audio.utils.test.ts
└── api/
    ├── transcribe.ts
    └── transcribe.test.ts
```

### Test Categories
- **Unit Tests**: Individual functions and components in isolation
- **Integration Tests**: Feature workflows (voice → transcription → AI processing)
- **End-to-End Tests**: Complete user journeys through the application

### Testing Standards
- Arrange, Act, Assert pattern
- Descriptive test names: `should create note when voice recording is transcribed successfully`
- Mock external dependencies (OpenAI API, Supabase)
- Test error scenarios, not just happy paths

## API Design Principles

### RESTful Patterns
```
GET    /api/notes           # List user's notes
POST   /api/notes           # Create new note
GET    /api/notes/[id]      # Get specific note
PUT    /api/notes/[id]      # Update note
DELETE /api/notes/[id]      # Delete note

POST   /api/transcribe      # Transcribe audio
POST   /api/process-note    # AI process transcript
POST   /api/chat            # Chat with notes
GET    /api/search          # Semantic search
```

### Error Handling
```typescript
// Standard API response format
type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
};
```

### Input Validation
- Use Zod schemas for all API inputs
- Validate on both client and server sides
- Provide clear, actionable error messages

## TypeScript Standards

### Strict Configuration
- Enable strict mode in `tsconfig.json`
- No `any` types (use `unknown` when necessary)
- Explicit return types for functions

### Type Organization
```typescript
// Feature-specific types
export interface VoiceNote {
  id: string;
  userId: string;
  title: string;
  rawTranscript: string;
  processedContent: string;
  summary: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// API types
export interface CreateNoteRequest {
  transcript: string;
}

export interface CreateNoteResponse {
  note: VoiceNote;
}
```

## Component Guidelines

### React Best Practices
- Use functional components with hooks
- Implement proper error boundaries
- Optimize performance with `useMemo`, `useCallback` when needed
- Follow the compound component pattern for complex UI

### Component Structure
```typescript
interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  onError: (error: string) => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  onError,
}) => {
  // Hooks
  const { isRecording, startRecording, stopRecording, error } = useVoiceRecording();
  
  // Effects
  useEffect(() => {
    if (error) {
      onError(error);
    }
  }, [error, onError]);

  // Handlers
  const handleStartRecording = useCallback(() => {
    startRecording();
  }, [startRecording]);

  // Render
  return (
    // JSX implementation
  );
};
```

## CI/CD Requirements

### GitHub Actions Structure
```
.github/
└── workflows/
    ├── pr-verify.yml    # Run on PR creation/updates
    └── deploy.yml       # Run on main branch merge
```

### PR Verification Workflow (`pr-verify.yml`)
Must include:
- **Install dependencies**: `npm ci`
- **Type checking**: `npx tsc --noEmit`
- **Linting**: `npm run lint`
- **Testing**: `npm run test`
- **Build verification**: `npm run build`
- **Security audit**: `npm audit`

### Deployment Workflow (`deploy.yml`)
Must include:
- All PR verification steps
- **Environment variable validation**
- **Database migration checks**
- **Deployment to Vercel**
- **Smoke tests on deployed environment**

### Branch Protection Rules
- Require PR reviews before merging
- Require status checks to pass
- Require branches to be up to date before merging
- Restrict push to main branch

## Environment Management

### Environment Variables
```bash
# Development
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
DATABASE_URL=

# Production (additional)
NEXT_PUBLIC_APP_URL=https://vemorable.com
WEBHOOK_SECRET=
```

### Configuration Management
- Use different configs for dev/staging/production
- Validate required environment variables at startup
- Never commit secrets to version control

## Performance Guidelines

### Core Web Vitals
- Largest Contentful Paint (LCP) < 2.5s
- First Input Delay (FID) < 100ms
- Cumulative Layout Shift (CLS) < 0.1

### Optimization Strategies
- Code splitting by feature
- Lazy load non-critical components
- Optimize bundle size with dynamic imports
- Implement proper caching strategies
- Monitor performance with Vercel Analytics

## Security Best Practices

### Authentication & Authorization
- Use Clerk for user management
- Implement proper RBAC (Role-Based Access Control)
- Validate user permissions on every API call

### Data Protection
- Sanitize all user inputs
- Use HTTPS everywhere
- Implement CSRF protection
- Rate limit API endpoints

### API Security
- Validate all inputs with Zod
- Use proper HTTP status codes
- Implement request logging
- Never expose internal errors to users

## Development Workflow

### Git Workflow
1. Create feature branch from `main`
2. Implement feature with TDD approach
3. Write/update tests
4. Run local verification (`npm run verify`)
5. Create PR with descriptive title and body
6. Address PR feedback
7. Merge after approval and passing checks

### Commit Messages
Follow Conventional Commits:
- `feat: add voice recording functionality`
- `fix: resolve audio permission handling`
- `docs: update API documentation`
- `test: add tests for note processing`

### Code Review Checklist
- [ ] Code follows established patterns
- [ ] Tests are comprehensive and passing
- [ ] TypeScript strict mode compliance
- [ ] No security vulnerabilities
- [ ] Performance considerations addressed
- [ ] Documentation updated if needed

## Common Patterns

### Error Boundaries
```typescript
export class FeatureErrorBoundary extends React.Component<Props, State> {
  // Implementation with proper error logging
}
```

### Custom Hooks
```typescript
export const useAsyncOperation = <T>(
  operation: () => Promise<T>
) => {
  const [state, setState] = useState<AsyncState<T>>({ status: 'idle' });
  
  const execute = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const result = await operation();
      setState({ status: 'success', data: result });
    } catch (error) {
      setState({ status: 'error', error: error as Error });
    }
  }, [operation]);

  return { ...state, execute };
};
```

### API Client Pattern
```typescript
export class ApiClient {
  constructor(private baseUrl: string, private auth: AuthService) {}
  
  async request<T>(endpoint: string, options: RequestOptions): Promise<T> {
    // Implement with proper error handling, retries, and logging
  }
}
```

Remember: **Build it right the first time, but don't over-engineer.** Focus on delivering working software that follows these principles, then iterate and improve based on real usage patterns.