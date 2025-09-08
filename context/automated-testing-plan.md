# Automated Testing Plan for Note Persistence

## Overview
This document outlines a comprehensive automated testing strategy to prevent and detect note persistence bugs in the VeMorable application. The tests focus on ensuring notes persist correctly across navigation and are accessible to all application features.

## Test Framework & Architecture

### Technology Stack
- **Test Framework**: Vitest + Testing Library (React Testing Library)
- **E2E Testing**: Playwright (for full user journey tests)
- **Mocking**: Vitest's `vi.mock()` for API calls and external dependencies
- **Database**: In-memory test database or mocked Supabase client

### Test Organization (Following CLAUDE.md Guidelines)
```
src/features/
├── voice-notes/
│   ├── components/
│   │   ├── NotesList.tsx
│   │   ├── NotesList.test.tsx          # Test file next to source
│   │   ├── NoteCard.tsx
│   │   └── NoteCard.test.tsx
│   ├── hooks/
│   │   ├── useNotes.ts
│   │   ├── useNotes.test.ts            # Hook tests
│   │   ├── useNotePersistence.ts
│   │   └── useNotePersistence.test.ts
│   └── api/
│       ├── notes.api.ts
│       └── notes.api.test.ts           # API layer tests
├── chat/
│   ├── components/
│   │   ├── ChatInterface.tsx
│   │   └── ChatInterface.test.tsx
│   ├── hooks/
│   │   ├── useChatWithNotes.ts
│   │   └── useChatWithNotes.test.ts
│   └── api/
│       ├── chat.api.ts
│       └── chat.api.test.ts
└── shared/
    ├── contexts/
    │   ├── NotesContext.tsx
    │   └── NotesContext.test.tsx        # Context persistence tests
    └── lib/
        ├── supabase.ts
        └── supabase.test.ts             # Database layer tests
```

## Test Categories

### 1. Unit Tests for Data Persistence

#### A. Hook Tests (`useNotes.test.ts`)
```typescript
describe('useNotes Hook', () => {
  beforeEach(() => {
    // Mock Supabase client
    vi.mock('../../../shared/lib/supabase', () => ({
      supabase: {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockNotes,
              error: null
            })
          }),
          insert: vi.fn().mockResolvedValue({
            data: mockNewNote,
            error: null
          })
        })
      }
    }));
  });

  it('should fetch notes on mount', async () => {
    // Test that notes are loaded when component mounts
  });

  it('should persist new notes to database', async () => {
    // Test that createNote calls the API correctly
  });

  it('should maintain notes in state after API calls', async () => {
    // Test that notes remain in hook state
  });

  it('should handle API failures gracefully', async () => {
    // Test error scenarios
  });
});
```

#### B. API Layer Tests (`notes.api.test.ts`)
```typescript
describe('Notes API', () => {
  beforeEach(() => {
    // Mock fetch or Supabase calls
    vi.clearAllMocks();
  });

  it('should successfully create note in database', async () => {
    // Mock successful API response
    // Call createNote API function  
    // Verify correct API call made
    // Verify returned data structure
  });

  it('should successfully fetch user notes', async () => {
    // Mock API response with notes data
    // Call fetchNotes API function
    // Verify correct query parameters
    // Verify returned notes format
  });

  it('should handle authentication errors', async () => {
    // Mock 401 response
    // Verify error handling
  });

  it('should handle network failures', async () => {
    // Mock network error
    // Verify retry logic (if implemented)
  });
});
```

### 2. Component Integration Tests

#### A. Notes List Component (`NotesList.test.tsx`)
```typescript
describe('NotesList Component', () => {
  const mockNotes = [
    {
      id: '1',
      title: 'Test Note',
      content: 'Test content',
      createdAt: '2025-09-08T08:35:00Z'
    }
  ];

  beforeEach(() => {
    // Mock the useNotes hook
    vi.mock('../hooks/useNotes', () => ({
      useNotes: () => ({
        notes: mockNotes,
        loading: false,
        error: null,
        createNote: vi.fn(),
        refreshNotes: vi.fn()
      })
    }));
  });

  it('should display notes when available', () => {
    render(<NotesList />);
    expect(screen.getByText('Test Note')).toBeInTheDocument();
  });

  it('should show empty state when no notes', () => {
    // Mock empty notes
    render(<NotesList />);
    expect(screen.getByText('No notes')).toBeInTheDocument();
  });

  it('should refresh notes when component remounts', () => {
    const mockRefresh = vi.fn();
    // Test that refreshNotes is called on remount
  });
});
```

#### B. Chat Interface Component (`ChatInterface.test.tsx`)
```typescript
describe('ChatInterface Component', () => {
  beforeEach(() => {
    // Mock useChatWithNotes hook
    vi.mock('../hooks/useChatWithNotes', () => ({
      useChatWithNotes: () => ({
        availableNotes: mockNotes,
        chatSessions: [],
        sendMessage: vi.fn(),
        loading: false
      })
    }));
  });

  it('should have access to user notes for chat context', () => {
    render(<ChatInterface />);
    // Verify notes are available for chat context
  });

  it('should indicate when notes are available for chat', () => {
    render(<ChatInterface />);
    // Should show some indicator that notes exist
  });

  it('should handle empty notes state gracefully', () => {
    // Mock no notes available
    render(<ChatInterface />);
    // Verify appropriate messaging
  });
});
```

### 3. Context/State Management Tests

#### A. Notes Context Tests (`NotesContext.test.tsx`)
```typescript
describe('NotesContext', () => {
  const NotesContextTestComponent = () => {
    const { notes, addNote, refreshNotes } = useNotesContext();
    return (
      <div>
        <div data-testid="notes-count">{notes.length}</div>
        <button onClick={() => addNote(mockNote)}>Add Note</button>
        <button onClick={refreshNotes}>Refresh</button>
      </div>
    );
  };

  it('should maintain notes state across component updates', () => {
    // Test state persistence in context
  });

  it('should sync with database on refresh', () => {
    // Test that refresh actually fetches from API
  });

  it('should update state when new notes added', () => {
    // Test optimistic updates and API sync
  });
});
```

### 4. Navigation Persistence Tests (React Router)

#### A. Route-based Tests
```typescript
describe('Navigation Persistence', () => {
  const renderWithRouter = (initialRoute = '/dashboard') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <NotesProvider>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/chat" element={<Chat />} />
          </Routes>
        </NotesProvider>
      </MemoryRouter>
    );
  };

  it('should maintain notes data when navigating between routes', async () => {
    const { getByText, getByRole } = renderWithRouter();
    
    // Verify notes exist on dashboard
    await waitFor(() => {
      expect(getByText('Test Note')).toBeInTheDocument();
    });
    
    // Navigate to chat
    fireEvent.click(getByRole('link', { name: 'Chat' }));
    
    // Navigate back to dashboard
    fireEvent.click(getByRole('link', { name: 'My Notes' }));
    
    // Verify notes still exist
    await waitFor(() => {
      expect(getByText('Test Note')).toBeInTheDocument();
    });
  });

  it('should make notes available to chat component', async () => {
    const { getByRole } = renderWithRouter('/dashboard/chat');
    
    // Verify chat has access to notes data
    await waitFor(() => {
      // Check for indication that notes are available
      expect(getByTestId('notes-available-indicator')).toBeInTheDocument();
    });
  });
});
```

### 5. End-to-End Tests (Playwright)

#### A. Full User Journey Tests
```typescript
// e2e/note-persistence.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Note Persistence E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses for consistent testing
    await page.route('**/api/notes', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          json: { data: [], error: null }
        });
      }
      if (route.request().method() === 'POST') {
        await route.fulfill({
          json: { 
            data: {
              id: 'test-note-1',
              title: 'Test Note Analysis',
              content: 'This is a test note',
              createdAt: new Date().toISOString()
            }, 
            error: null 
          }
        });
      }
    });
    
    await page.goto('/dashboard');
  });

  test('should persist notes across navigation', async ({ page }) => {
    // Create note
    await page.getByRole('button', { name: 'Create new note' }).click();
    await page.getByRole('button', { name: 'Text Note' }).click();
    await page.fill('[data-testid="note-input"]', 'Test persistence note');
    await page.getByRole('button', { name: 'Save Note' }).click();
    
    // Wait for processing
    await page.waitForSelector('[data-testid="note-card"]');
    
    // Navigate away
    await page.getByRole('link', { name: 'Chat' }).click();
    await expect(page).toHaveURL('/dashboard/chat');
    
    // Navigate back
    await page.getByRole('link', { name: 'My Notes' }).click();
    await expect(page).toHaveURL('/dashboard');
    
    // Verify note still exists
    await expect(page.getByTestId('note-card')).toBeVisible();
    await expect(page.getByText('Test persistence note')).toBeVisible();
  });

  test('should make notes available in chat', async ({ page }) => {
    // Create note first
    await page.getByRole('button', { name: 'Create new note' }).click();
    await page.getByRole('button', { name: 'Text Note' }).click();
    await page.fill('[data-testid="note-input"]', 'Chat test note');
    await page.getByRole('button', { name: 'Save Note' }).click();
    
    // Navigate to chat
    await page.getByRole('link', { name: 'Chat' }).click();
    
    // Verify notes are accessible to chat
    await expect(page.getByTestId('notes-available')).toBeVisible();
    // Or verify by trying to send a message that would require notes
    await page.fill('[data-testid="chat-input"]', 'What notes do I have?');
    await page.getByRole('button', { name: 'Send' }).click();
    
    // Should get response indicating notes are available
    await expect(page.getByText(/You have 1 note/)).toBeVisible();
  });
});
```

### 6. Database/API Integration Tests

#### A. Supabase Integration Tests
```typescript
describe('Supabase Integration', () => {
  let testClient: SupabaseClient;

  beforeAll(() => {
    // Setup test database connection
    testClient = createTestSupabaseClient();
  });

  beforeEach(async () => {
    // Clean test database
    await testClient.from('notes').delete().neq('id', '');
  });

  it('should persist notes to database', async () => {
    const noteData = {
      title: 'Integration Test Note',
      content: 'Test content',
      user_id: 'test-user-id'
    };

    const { data, error } = await testClient
      .from('notes')
      .insert(noteData)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.title).toBe(noteData.title);
  });

  it('should fetch user notes correctly', async () => {
    // Insert test note
    await testClient.from('notes').insert({
      title: 'Test Note',
      content: 'Content',
      user_id: 'test-user-id'
    });

    const { data, error } = await testClient
      .from('notes')
      .select('*')
      .eq('user_id', 'test-user-id');

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data[0].title).toBe('Test Note');
  });
});
```

## Test Execution Strategy

### CI/CD Integration

#### GitHub Actions Workflow (`.github/workflows/test-note-persistence.yml`)
```yaml
name: Note Persistence Tests

on:
  pull_request:
    paths:
      - 'src/features/voice-notes/**'
      - 'src/features/chat/**' 
      - 'src/shared/contexts/**'
  push:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
        
      - name: Run unit tests
        run: npm run test:unit -- --coverage
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        
      - name: Start test database
        run: docker run -d -p 54322:5432 supabase/postgres
        
      - name: Run integration tests
        run: npm run test:integration
        
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        
      - name: Install Playwright
        run: npx playwright install
        
      - name: Run E2E tests
        run: npm run test:e2e
        
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

### NPM Scripts (`package.json`)
```json
{
  "scripts": {
    "test:unit": "vitest run src/**/*.test.{ts,tsx}",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "test:persistence": "npm run test:unit && npm run test:integration && npm run test:e2e",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage"
  }
}
```

## Mock Strategy

### API Mocking Patterns
```typescript
// src/shared/lib/__mocks__/supabase.ts
export const mockSupabase = {
  from: vi.fn((table: string) => ({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: table === 'notes' ? mockNotes : [],
        error: null
      })
    }),
    insert: vi.fn().mockResolvedValue({
      data: mockNewNote,
      error: null
    }),
    update: vi.fn().mockResolvedValue({
      data: mockUpdatedNote,
      error: null
    })
  })),
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null
    })
  }
};

// Test data fixtures
export const mockNotes = [
  {
    id: '1',
    title: 'Test Note 1',
    content: 'Test content 1',
    user_id: 'test-user-id',
    created_at: '2025-09-08T08:35:00Z'
  },
  {
    id: '2', 
    title: 'Test Note 2',
    content: 'Test content 2',
    user_id: 'test-user-id',
    created_at: '2025-09-08T08:40:00Z'
  }
];
```

## Test Coverage Requirements

### Minimum Coverage Thresholds
- **Lines**: 90%
- **Functions**: 95%
- **Branches**: 85%
- **Statements**: 90%

### Critical Code Paths (100% Coverage Required)
1. Note creation and persistence
2. Data fetching on component mount
3. Navigation between routes
4. Context state management
5. API error handling
6. Chat-notes integration

## Implementation Timeline

### Phase 1: Foundation (Week 1)
- Set up Vitest configuration
- Create basic mock structure
- Implement unit tests for hooks and API layers

### Phase 2: Component Tests (Week 2)  
- Add component integration tests
- Implement context/state management tests
- Set up test data fixtures

### Phase 3: E2E Tests (Week 3)
- Configure Playwright
- Implement critical user journey tests
- Set up CI/CD integration

### Phase 4: Validation (Week 4)
- Run full test suite against current bugs
- Verify tests catch existing issues
- Refine test coverage and edge cases

## Success Criteria

### Test Suite Must:
1. **Catch existing bugs**: Tests should fail when Bug #1 and Bug #2 are present
2. **Pass after fixes**: Tests should pass once persistence issues are resolved
3. **Prevent regressions**: New code changes that break persistence should fail tests
4. **Run reliably**: Tests should be deterministic and not flaky
5. **Run quickly**: Full test suite should complete in under 5 minutes

### Coverage Goals:
- All critical persistence code paths covered
- Both positive and negative test cases
- Cross-component data sharing scenarios
- Error handling and edge cases

This comprehensive testing plan ensures that note persistence bugs are caught early and prevented from recurring, while maintaining the high code quality standards outlined in the VeMorable development guidelines.