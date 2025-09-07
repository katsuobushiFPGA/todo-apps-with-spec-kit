-- TODO管理アプリケーション データベーススキーマ
-- SQLite3用スキーマ定義

-- tasksテーブル: TODOタスクの管理
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL CHECK(length(title) > 0 AND length(title) <= 500),
  due_date TEXT,  -- ISO 8601 format (YYYY-MM-DD)
  progress INTEGER NOT NULL DEFAULT 0 CHECK(progress >= 0 AND progress <= 100),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- インデックス: パフォーマンス向上のため
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);

-- トリガー: updated_atの自動更新
CREATE TRIGGER update_tasks_updated_at
  AFTER UPDATE ON tasks
  FOR EACH ROW
BEGIN
  UPDATE tasks SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- トリガー: 完了状態と進捗率の整合性
CREATE TRIGGER sync_completion_progress
  AFTER UPDATE OF completed ON tasks
  FOR EACH ROW
  WHEN NEW.completed = TRUE AND OLD.completed = FALSE
BEGIN
  UPDATE tasks SET progress = 100 WHERE id = NEW.id;
END;

-- トリガー: 進捗率100%時の自動完了
CREATE TRIGGER sync_progress_completion
  AFTER UPDATE OF progress ON tasks
  FOR EACH ROW
  WHEN NEW.progress = 100 AND OLD.progress != 100
BEGIN
  UPDATE tasks SET completed = TRUE WHERE id = NEW.id;
END;
