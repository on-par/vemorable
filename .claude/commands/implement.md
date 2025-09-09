TASKS_FILE = $ARGUMENTS

## Phase Format
```markdown
## Phase x.x: Some Description
- [ ] T001 Task Description
- [ ] T002 Task Description
- [ ] T003 Task Description
...
- [ ] T### Task Description
```


## Definitions
Checked or Completed tasks are denoted with `- [x]`
Unchecked or incomplete tasks are denoted with `- [ ]`
An "available phase" is a Phase as defined by the "Phase Format" above with unchecked tasks
A task is considered "parallel-capable" if denoted with a [P] in line after the task ID (i.e. `- [ ] T001 [P] Task Description` is a parallel-capable task)
A task is considered complete when the task is accomplished along with the lint, build, type-check, and any tests (unit, integration, e2e) pass with zero errors (if the task is available).

## Core Objectives
Implement tasks for an available phase.
Utilize multiple sub agents (up to 5) if any parallel tasks available (only after completing non-parallel tasks before kicking off parallel tasks for parallel-capable tasks). Max of 5 parallel agents at a time.

## Action
Implement the first available phase TASKS_FILE completely.
Once each task is complete, update it's status to checked (i.e. `- [ ]` = unchecked -> `- [x]` = checked)
Once phase is complete, commit and push the code.
If a critical stopping point is encountered, stop, report necessary information, and wait for additional input.
