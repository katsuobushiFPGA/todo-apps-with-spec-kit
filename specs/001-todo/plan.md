# Implementation Plan: TODO管理アプリケーション

**Branch**: `001-todo` | **Date**: 2025-09-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/home/kbushi/workspace/todo-apps-with-spec-kit/todo-apps2/specs/001-todo/spec.md`

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
TODO管理アプリケーションの実装。ユーザーはタスクの内容と期限日を登録し、進捗をパーセンテージで管理し、完了/未完了状態を追跡できる。技術スタック：Vite + Vue3 + 標準的なHTML/CSS/JavaScript + SQLiteデータベース。最小限のライブラリ使用でシンプルな構成を採用。

## Technical Context
**Language/Version**: JavaScript ES2022, Node.js 18+  
**Primary Dependencies**: Vite (build tool), Vue 3, SQLite3, Vitest (testing)  
**Storage**: SQLite database (ローカルファイル)  
**Testing**: Vitest (unit/integration), Vue Testing Library  
**Target Platform**: Web browser (modern browsers supporting ES2022)
**Project Type**: web (frontend + backend API)  
**Performance Goals**: 瞬時UI応答 (<100ms), スムーズアニメーション (60fps)  
**Constraints**: 最小限ライブラリ使用, 標準技術優先, オフライン対応不要  
**Scale/Scope**: 単一ユーザー, ~1000タスク想定, 軽量アプリケーション

**User-provided Implementation Details**: アプリケーションは最小限のライブラリでViteを使用します。Vue3を利用します。可能な限り標準的なHTML、CSS、JavaScriptを使用します。メタデータはローカルのSQLiteデータベースに保存されます。

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 2 (frontend, backend API) - within max 3 limit
- Using framework directly? Yes (Vue 3 without wrappers, direct SQLite)
- Single data model? Yes (Task entity, no DTOs needed)
- Avoiding patterns? Yes (direct DB access, no Repository pattern for this simple app)

**Architecture**:
- EVERY feature as library? Yes (task-lib for core logic, todo-api for REST endpoints)
- Libraries listed: task-lib (task CRUD operations), todo-api (HTTP endpoints), todo-ui (Vue components)
- CLI per library: task-lib CLI (--help/--version), todo-api CLI (server commands)
- Library docs: llms.txt format planned? Yes

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? Yes (tests written first, must fail)
- Git commits show tests before implementation? Yes (commit strategy documented)
- Order: Contract→Integration→E2E→Unit strictly followed? Yes
- Real dependencies used? Yes (actual SQLite DB for integration tests)
- Integration tests for: task API endpoints, database operations, Vue component integration
- FORBIDDEN: Implementation before test, skipping RED phase

**Observability**:
- Structured logging included? Yes (console.log with structured format)
- Frontend logs → backend? Not needed (single-user local app)
- Error context sufficient? Yes (error boundaries in Vue, API error responses)

**Versioning**:
- Version number assigned? 1.0.0 (initial version)
- BUILD increments on every change? Yes (semantic versioning)
- Breaking changes handled? Yes (migration strategy for schema changes)

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
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: Option 2 (Web application) - Frontend (Vue3 SPA) + Backend (Node.js API server)

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `/scripts/update-agent-context.sh [claude|gemini|copilot]` for your AI assistant
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base structure
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Backend tasks: Database setup → Models → API endpoints → Integration tests
- Frontend tasks: Components → Services → Integration → E2E tests
- Each API endpoint contract → contract test task [P]
- Each entity (Task) → model creation task [P] 
- Each user story → integration test task
- Implementation tasks to make failing tests pass

**Task Categories & Order**:
1. **Infrastructure Tasks** (Backend foundation)
   - SQLite database initialization
   - Express.js server setup
   - CORS and middleware configuration

2. **Contract Test Tasks** [P] (Can run in parallel)
   - POST /api/tasks contract test
   - GET /api/tasks contract test  
   - PUT /api/tasks/:id contract test
   - DELETE /api/tasks/:id contract test

3. **Backend Model Tasks** [P]
   - Task entity model creation
   - Database operations (CRUD)
   - Data validation logic

4. **Backend API Implementation Tasks**
   - Task creation endpoint (make POST contract test pass)
   - Task retrieval endpoints (make GET contract tests pass)
   - Task update endpoint (make PUT contract test pass)
   - Task deletion endpoint (make DELETE contract test pass)

5. **Frontend Foundation Tasks**
   - Vite + Vue3 project setup
   - API service layer creation
   - Base component structure

6. **Frontend Component Tasks** [P]
   - TaskList component
   - TaskItem component  
   - TaskForm component
   - ProgressBar component

7. **Integration Test Tasks**
   - Task creation user flow test
   - Task progress update flow test
   - Task completion flow test
   - Task list display flow test

8. **End-to-End Validation Tasks**
   - Quickstart guide execution validation
   - Performance requirement validation
   - Error handling validation

**Ordering Strategy**:
- TDD order: Contract tests → Unit tests → Implementation → Integration tests
- Dependency order: Database → Models → API → Frontend services → Components
- Mark [P] for parallel execution when tasks are independent
- Backend tasks generally precede frontend tasks (API-first development)

**Estimated Task Breakdown**:
- Infrastructure: 3 tasks
- Contract tests: 4 tasks [P]
- Backend implementation: 8 tasks
- Frontend setup: 3 tasks  
- Frontend components: 6 tasks [P]
- Integration tests: 4 tasks
- Validation: 3 tasks
- **Total**: ~31 numbered, ordered tasks in tasks.md

**TDD Compliance**:
- Every implementation task has a corresponding failing test
- Tests are created before implementation in task order
- RED-GREEN-Refactor cycle enforced through task sequencing

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
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


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
- [ ] Complexity deviations documented

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*