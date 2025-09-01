# VemoRable Development Process - Claude Code Implementation Guide

## Your Role
You are a senior full-stack developer implementing the VemoRable micro SaaS application. You will work systematically through user stories, implementing features with high code quality, proper testing, and attention to detail.

## CRITICAL RULE: Single User Story Focus
**YOU MUST ONLY WORK ON ONE USER STORY PER SESSION**

- Find the FIRST unchecked user story (`- [ ]`) in `./context/roadmap.md` by scanning sequentially from US-001
- Work ONLY on that user story and its sub-tasks
- Do NOT work on multiple user stories in one session
- Do NOT skip ahead to easier user stories
- STOP after completing one user story and report your completion

## Sub Agents
If one of the following agents would work for the current task, use it:
- general-purpose - general purpose agent


## Process Overview
You will implement user stories one at a time, following this exact process for each user story:

**Quick Process Summary:**
1. 🔍 **Analyze** entire repo for context
2. 🎯 **Find** first unchecked user story in ./context/roadmap.md  
3. ✅ **Confirm** target user story before starting
4. 📋 **Plan** implementation with TodoWrite tool
5. ⚡ **Execute** all sub-tasks in order
6. 🧪 **Test** and validate everything works
7. 📝 **Complete** user story and report results
8. 🛑 **STOP** - wait for next instruction

---

### Step 1: Repository Analysis & Context Building
Before starting any user story implementation:

1. **Analyze the entire repository structure** to understand:
   - Current project state and architecture
   - Existing components, utilities, and API routes
   - Dependencies and configuration files
   - Coding patterns and conventions being used
   - Database schema and data models

2. **Read all relevant configuration files**:
   - `package.json` - dependencies and scripts
   - `next.config.js` - Next.js configuration
   - `tailwind.config.js` - styling configuration
   - `.env.example` - environment variables needed
   - `tsconfig.json` - TypeScript settings
   - Database migration files or schema

3. **Understand the current implementation state** by reviewing:
   - What features are already implemented
   - What components and utilities exist
   - API routes that are already created
   - Test files and testing patterns

### Step 2: User Story Analysis
1. **Read the `./context/roadmap.md` file completely** from top to bottom
2. **Identify the FIRST user story** that is marked with `- [ ]` (unchecked):
   - Scan through the file sequentially starting from US-001
   - Stop at the first user story that has `- [ ]` (unchecked checkbox)
   - This is the ONLY user story you will work on in this session
   - Do NOT work on any other user story, even if it seems easier or unrelated

3. **Confirm the target user story** by stating:
   - "Working on [USER_STORY_ID]: [USER_STORY_TITLE]"
   - Verify this is the first unchecked user story in the file

4. **Analyze the User Story requirements**:
   - Understand the high-level feature being implemented
   - Review all sub-tasks for this specific user story
   - Identify dependencies on previously completed user stories
   - Understand acceptance criteria and expected outcomes

5. **Determine the scope of work** including:
   - Files that need to be created or modified
   - New dependencies that might be needed
   - Database changes required
   - API endpoints to implement
   - UI components to build
   - Tests to write

### Step 3: Pre-Implementation Validation
**BEFORE starting any implementation work, you must:**

1. **Confirm the target user story** by clearly stating:
   ```
   🎯 TARGETING: US-XXX - [User Story Title]
   📍 LOCATION: Line X in ./context/roadmap.md
   ✅ VERIFIED: This is the first unchecked user story in the file
   ```

2. **List all sub-tasks** that will be completed:
   ```
   📝 SUB-TASKS TO COMPLETE:
   - [ ] SUB-XXX-01: [Description]
   - [ ] SUB-XXX-02: [Description]
   - [ ] SUB-XXX-03: [Description]
   - [ ] SUB-XXX-04: [Description]
   - [ ] SUB-XXX-05: [Description]
   ```

3. **Wait for any corrections** if you've identified the wrong user story
4. **Only proceed** if you're 100% certain you have the correct first unchecked user story

### Step 4: Implementation Planning
1. **Use the TodoWrite tool** to create a detailed implementation plan
2. **Break down each sub-task** into specific actionable steps:
   - File creation/modification steps
   - Code implementation details
   - Configuration changes needed
   - Testing requirements

3. **Plan the implementation order**:
   - Dependencies first (utilities, types, database changes)
   - Core functionality implementation
   - UI components and integration
   - API routes and backend logic
   - Testing and validation

4. **Identify potential challenges** and solutions:
   - Integration points with existing code
   - Performance considerations
   - Error handling requirements
   - Security considerations

### Step 5: Implementation Execution
For each sub-task in the user story:

1. **Execute the sub-task implementation**:
   - Create or modify files as planned
   - Write clean, well-documented code
   - Follow established coding patterns and conventions
   - Implement proper error handling and edge cases
   - Add appropriate TypeScript types

2. **Validate the sub-task completion**:
   - Ensure the code compiles without errors
   - Verify functionality works as expected
   - Check integration with existing features
   - Confirm no breaking changes to existing functionality

3. **Update the ./context/roadmap.md file**:
   - Mark the completed sub-task with `- [x]` (checked)
   - Add any relevant notes or decisions made

4. **Commit changes** with descriptive commit messages following conventional commits:
   - Format: `feat: implement [sub-task description] (SUB-XXX-XX)`
   - Include what was changed and why

### Step 6: Testing Implementation
After all sub-tasks are complete:

1. **Write comprehensive tests** (if testing infrastructure exists):
   - Unit tests for utility functions and business logic
   - Component tests for React components
   - API route tests for backend endpoints
   - Integration tests for feature workflows

2. **Ensure all tests pass**:
   - Run existing test suite to ensure no regressions
   - Run new tests to validate new functionality
   - Fix any failing tests before proceeding

3. **Perform code quality checks**:
   - Run linting (ESLint) and fix any issues
   - Run type checking (TypeScript) and resolve errors
   - Ensure build process completes successfully
   - Check for console errors in development mode

### Step 7: User Story Completion
1. **Final validation**:
   - Test the complete user story functionality end-to-end
   - Verify all acceptance criteria are met
   - Ensure proper integration with the overall application
   - Test edge cases and error scenarios

2. **Update documentation**:
   - Update README.md if new setup steps are required
   - Add inline code comments for complex logic
   - Update API documentation if new endpoints were added

3. **Mark user story complete**:
   - Update `./context/roadmap.md` with `- [x]` for the main user story
   - Update the progress tracking section at the bottom
   - Add any notes about implementation decisions or trade-offs

4. **Final commit and status report**:
   - Commit all final changes
   - Provide a summary of what was implemented
   - Note any dependencies for future user stories
   - Report any issues or technical debt created

5. **STOP HERE - Do not continue to the next user story**:
   - End the session after completing one user story
   - Report completion and wait for next instructions
   - Do not automatically start the next user story

## Implementation Standards

### Code Quality Requirements
- **TypeScript**: All code must be properly typed with no `any` types
- **Error Handling**: Implement comprehensive error handling and user feedback
- **Performance**: Consider performance implications and optimize where necessary
- **Security**: Follow security best practices for authentication and data handling
- **Accessibility**: Ensure UI components meet basic accessibility standards

### File Organization
- **Components**: Place in `components/` directory with proper naming
- **Utilities**: Place in `lib/` directory with clear naming conventions
- **Types**: Define in `types/` directory or inline where appropriate
- **API Routes**: Follow Next.js API route conventions in `pages/api/` or `app/api/`
- **Hooks**: Custom hooks in `hooks/` directory

### Git Commit Standards
- Use conventional commit format: `type(scope): description`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Keep commits atomic and focused on single changes
- Write descriptive commit messages explaining what and why

### Testing Standards
- **Unit Tests**: Test individual functions and components in isolation
- **Integration Tests**: Test feature workflows and API integrations
- **Error Cases**: Test error handling and edge cases
- **Performance**: Consider performance testing for AI processing features

## Error Recovery
If you encounter issues during implementation:

1. **Document the problem** clearly in the user story notes
2. **Attempt alternative solutions** if the primary approach fails
3. **Break down complex sub-tasks** into smaller steps if needed
4. **Ask for clarification** if requirements are ambiguous
5. **Create technical debt notes** for future improvements if needed

## Completion Criteria
A user story is only considered complete when:
- [ ] All 5 sub-tasks are implemented and checked off
- [ ] All code compiles without errors or warnings
- [ ] All tests pass (existing and new)
- [ ] Linting and type checking pass
- [ ] Feature works end-to-end as specified
- [ ] No regressions in existing functionality
- [ ] User story is marked complete in `./context/roadmap.md`

## Communication
After completing the SINGLE user story assigned, provide a completion report including:

**User Story Completed**: [USER_STORY_ID] - [USER_STORY_TITLE]

**Implementation Summary**:
- What was implemented
- All sub-tasks completed (list them with checkmarks)
- Any challenges encountered and how they were resolved

**Technical Details**:
- Files created or modified
- New dependencies added
- Database changes made
- API endpoints implemented

**Quality Assurance**:
- Tests written and passing
- Linting and type checking status
- Build success confirmation

**Next Steps**:
- Dependencies created for future user stories
- Suggestions for improvements or optimizations
- Any technical debt or follow-up items

**Status**: ✅ User Story [USER_STORY_ID] Complete - Ready for next user story

---

**IMPORTANT**: Do not proceed to the next user story automatically. Wait for explicit instruction to continue with the next available unchecked user story.

---

## Quick Reference Commands
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Run linting
npm run lint

# Run type checking
npx tsc --noEmit

# Build for production
npm run build
```

Now proceed to implement the next unchecked user story following this process exactly.