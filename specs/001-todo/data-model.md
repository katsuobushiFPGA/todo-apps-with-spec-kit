# Data Model: TODO管理アプリケーション

## Core Entities

### Task Entity
```typescript
interface Task {
  id: number;           // Primary key, auto-increment
  title: string;        // タスクの内容 (required, max 500 chars)
  dueDate: Date | null; // 期限日 (optional)
  progress: number;     // 進捗率 0-100 (default: 0)
  completed: boolean;   // 完了状態 (default: false)
  createdAt: Date;      // 作成日時 (auto-generated)
  updatedAt: Date;      // 更新日時 (auto-generated)
}
```

## Database Schema (SQLite)

### tasks テーブル
```sql
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL CHECK(length(title) <= 500),
  due_date TEXT,  -- ISO 8601 format (YYYY-MM-DD)
  progress INTEGER NOT NULL DEFAULT 0 CHECK(progress >= 0 AND progress <= 100),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
```

## Validation Rules

### Task Validation
- **title**: 必須、1-500文字、空文字列不可
- **dueDate**: 任意、有効な日付形式（YYYY-MM-DD）
- **progress**: 0-100の整数、デフォルト0
- **completed**: boolean、デフォルトfalse

### Business Rules
1. **進捗と完了状態の整合性**:
   - completed=true の場合、progress=100 に自動設定
   - progress=100 の場合、completed=true に自動設定（オプション）

2. **期限日の制約**:
   - 過去の日付も許可（既存タスクの管理のため）
   - 新規作成時は警告表示（UI層で処理）

3. **タスクの並び順**:
   - デフォルト: 作成日時の降順（新しい順）
   - オプション: 期限日の昇順（期限が近い順）

## State Transitions

### Task Lifecycle
```
[作成] → [進行中] → [完了]
   ↓        ↓        ↑
   └────────┴────────┘
      (編集・削除可能)
```

### Progress Update Flow
```
progress: 0-99  → completed: false
progress: 100   → completed: true (auto)
completed: true → progress: 100 (auto)
```

## API Data Transfer

### Request/Response DTOs
```typescript
// Create Task Request
interface CreateTaskRequest {
  title: string;
  dueDate?: string; // ISO 8601 format
}

// Update Task Request
interface UpdateTaskRequest {
  title?: string;
  dueDate?: string | null;
  progress?: number;
  completed?: boolean;
}

// Task Response (same as entity)
interface TaskResponse {
  id: number;
  title: string;
  dueDate: string | null;
  progress: number;
  completed: boolean;
  createdAt: string; // ISO 8601 format
  updatedAt: string; // ISO 8601 format
}
```

## Database Operations

### Core CRUD Operations
```typescript
interface TaskRepository {
  create(task: CreateTaskRequest): Promise<Task>;
  findAll(orderBy?: 'created' | 'dueDate'): Promise<Task[]>;
  findById(id: number): Promise<Task | null>;
  update(id: number, data: UpdateTaskRequest): Promise<Task>;
  delete(id: number): Promise<boolean>;
}
```

### Specialized Queries
```typescript
interface TaskQueries {
  findByStatus(completed: boolean): Promise<Task[]>;
  findOverdue(): Promise<Task[]>;
  countByStatus(): Promise<{ completed: number; pending: number }>;
}
```
