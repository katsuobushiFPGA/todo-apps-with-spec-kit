# Tasks: TODO管理アプリケーション

**Input**: Design documents from `/home/kbushi/workspace/todo-apps-with-spec-kit/todo-apps2/specs/001-todo/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory ✓
   → Extracted: Vue3 + Vite + Express.js + SQLite3 stack
   → Structure: Web app (backend/ + frontend/)
2. Load optional design documents: ✓
   → data-model.md: Task entity → model tasks
   → contracts/api.yaml: 4 endpoints → contract test tasks
   → research.md: Technical decisions → setup tasks
3. Generate tasks by category: ✓
   → Setup: project structure, dependencies, database
   → Tests: 4 contract tests, 4 integration tests
   → Core: Task model, API endpoints, Vue components
   → Integration: database connection, API service
   → Polish: unit tests, performance validation
4. Apply task rules: ✓
   → Different files marked [P] for parallel
   → Same file sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001-T032) ✓
6. Generate dependency graph ✓
7. Create parallel execution examples ✓
8. Validate task completeness: ✓
   → All 4 API contracts have tests ✓
   → Task entity has model ✓
   → All endpoints implemented ✓
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Web app**: `backend/src/`, `frontend/src/` (per implementation plan)
- **Tests**: `backend/tests/`, `frontend/tests/`
- All paths relative to repository root

## Phase 3.1: Setup & Infrastructure
- [ ] T001 Create project structure with backend/ and frontend/ directories per implementation plan
- [ ] T002 Initialize backend Node.js project with Express.js, better-sqlite3, cors dependencies in backend/
- [ ] T003 Initialize frontend Vite project with Vue 3, @vitejs/plugin-vue dependencies in frontend/
- [ ] T004 [P] Configure ESLint and Prettier for backend in backend/.eslintrc.js
- [ ] T005 [P] Configure ESLint and Prettier for frontend in frontend/.eslintrc.js
- [ ] T006 Create SQLite database schema from data-model.md in backend/src/database/schema.sql
- [ ] T007 Create database initialization script in backend/src/database/init.js

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T008 [P] Contract test POST /api/tasks in backend/tests/contract/test_tasks_post.test.js
- [ ] T009 [P] Contract test GET /api/tasks in backend/tests/contract/test_tasks_get.test.js  
- [ ] T010 [P] Contract test PUT /api/tasks/:id in backend/tests/contract/test_tasks_put.test.js
- [ ] T011 [P] Contract test DELETE /api/tasks/:id in backend/tests/contract/test_tasks_delete.test.js
- [ ] T012 [P] Integration test task creation flow in backend/tests/integration/test_task_creation.test.js
- [ ] T013 [P] Integration test task progress update flow in backend/tests/integration/test_task_progress.test.js
- [ ] T014 [P] Integration test task completion flow in backend/tests/integration/test_task_completion.test.js
- [ ] T015 [P] Integration test task list display flow in backend/tests/integration/test_task_list.test.js

## Phase 3.3: Backend Core Implementation (ONLY after tests are failing)
- [ ] T016 [P] Task model with validation in backend/src/models/Task.js
- [ ] T017 [P] Database connection utility in backend/src/database/connection.js
- [ ] T018 TaskService CRUD operations in backend/src/services/TaskService.js
- [ ] T019 POST /api/tasks endpoint in backend/src/routes/tasks.js
- [ ] T020 GET /api/tasks endpoint in backend/src/routes/tasks.js
- [ ] T021 PUT /api/tasks/:id endpoint in backend/src/routes/tasks.js
- [ ] T022 DELETE /api/tasks/:id endpoint in backend/src/routes/tasks.js
- [ ] T023 Input validation middleware in backend/src/middleware/validation.js
- [ ] T024 Error handling middleware in backend/src/middleware/error.js
- [ ] T025 Express server setup in backend/src/app.js

## Phase 3.4: Frontend Core Implementation
- [ ] T026 [P] API service layer in frontend/src/services/taskService.js
- [ ] T027 [P] TaskList Vue component in frontend/src/components/TaskList.vue
- [ ] T028 [P] TaskItem Vue component in frontend/src/components/TaskItem.vue
- [ ] T029 [P] TaskForm Vue component in frontend/src/components/TaskForm.vue
- [ ] T030 [P] ProgressBar Vue component in frontend/src/components/ProgressBar.vue
- [ ] T031 Main App Vue component in frontend/src/App.vue
- [ ] T032 Vite configuration in frontend/vite.config.js

## Phase 3.5: Integration & Polish
- [ ] T033 [P] Frontend component unit tests in frontend/tests/unit/components.test.js
- [ ] T034 [P] Backend service unit tests in backend/tests/unit/TaskService.test.js
- [ ] T035 End-to-end test following quickstart scenarios in tests/e2e/quickstart.test.js
- [ ] T036 Performance validation tests (<100ms UI, <200ms API) in tests/performance/
- [ ] T037 [P] Update API documentation in specs/001-todo/contracts/api.yaml
- [ ] T038 Manual testing following quickstart.md validation scenarios

## Dependencies
```
Setup Phase (T001-T007):
T001 → T002, T003
T002 → T004, T006, T007
T003 → T005, T032

Test Phase (T008-T015):
All can run in parallel [P] - different files

Backend Implementation (T016-T025):
T006, T007 → T017
T016, T017 → T018
T018 → T019, T020, T021, T022
T019, T020, T021, T022 → T025

Frontend Implementation (T026-T032):
T026 can run parallel with T027-T030 [P]
T027, T028, T029, T030 → T031
T031 → T032

Polish Phase (T033-T038):
T025, T032 → T033, T034, T035, T036, T037, T038
```

## Parallel Execution Examples

### Phase 3.2: All contract tests in parallel
```bash
# Launch T008-T011 together (different test files):
Task: "Contract test POST /api/tasks in backend/tests/contract/test_tasks_post.test.js"
Task: "Contract test GET /api/tasks in backend/tests/contract/test_tasks_get.test.js"
Task: "Contract test PUT /api/tasks/:id in backend/tests/contract/test_tasks_put.test.js"
Task: "Contract test DELETE /api/tasks/:id in backend/tests/contract/test_tasks_delete.test.js"

# Launch T012-T015 together (different integration test files):
Task: "Integration test task creation flow in backend/tests/integration/test_task_creation.test.js"
Task: "Integration test task progress update flow in backend/tests/integration/test_task_progress.test.js"
Task: "Integration test task completion flow in backend/tests/integration/test_task_completion.test.js"
Task: "Integration test task list display flow in backend/tests/integration/test_task_list.test.js"
```

### Phase 3.3: Independent model and utility files
```bash
# Launch T016-T017 together (different files):
Task: "Task model with validation in backend/src/models/Task.js"
Task: "Database connection utility in backend/src/database/connection.js"
```

### Phase 3.4: All Vue components in parallel
```bash
# Launch T027-T030 together (different component files):
Task: "TaskList Vue component in frontend/src/components/TaskList.vue"
Task: "TaskItem Vue component in frontend/src/components/TaskItem.vue"
Task: "TaskForm Vue component in frontend/src/components/TaskForm.vue"
Task: "ProgressBar Vue component in frontend/src/components/ProgressBar.vue"
```

## Task Generation Rules Applied

### From Contracts (api.yaml):
- POST /api/tasks → T008, T019
- GET /api/tasks → T009, T020
- PUT /api/tasks/:id → T010, T021
- DELETE /api/tasks/:id → T011, T022

### From Data Model (data-model.md):
- Task entity → T016 (model creation)
- Database schema → T006, T007 (setup)
- CRUD operations → T018 (service layer)

### From User Stories (quickstart.md):
- Task creation flow → T012
- Progress update flow → T013
- Task completion flow → T014
- Task list display flow → T015

### TDD Ordering:
- All tests (T008-T015) before implementation (T016-T032)
- Contract tests before endpoint implementation
- Integration tests for user flow validation

## Validation Checklist
*GATE: All items verified before task execution*

- [x] All 4 API contracts have corresponding contract tests (T008-T011)
- [x] Task entity has model creation task (T016)
- [x] All 4 endpoints have implementation tasks (T019-T022)
- [x] Tests come before implementation (Phase 3.2 → 3.3)
- [x] Parallel tasks truly independent (different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] All user stories have integration tests (T012-T015)
- [x] TDD cycle enforced (RED tests → GREEN implementation)

## Notes
- **TDD Enforcement**: Tasks T008-T015 MUST fail before proceeding to implementation
- **Parallel Execution**: [P] tasks can run simultaneously (different files)
- **File Conflicts**: No [P] tasks modify the same file (routes.js tasks sequential)
- **Commit Strategy**: Commit after each task completion
- **Error Strategy**: If any test doesn't fail initially, investigate and fix test before implementation
