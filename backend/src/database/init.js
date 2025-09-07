const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

/**
 * データベース初期化スクリプト
 * SQLiteデータベースを作成し、スキーマを適用する
 */

const DB_PATH = path.join(__dirname, '../../data/todos.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

function initializeDatabase() {
  try {
    // データディレクトリを作成
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log(`✅ データディレクトリを作成しました: ${dataDir}`);
    }

    // データベース接続
    const db = new Database(DB_PATH);
    console.log(`✅ データベースに接続しました: ${DB_PATH}`);

    // スキーマファイルを読み込み
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
    console.log(`✅ スキーマファイルを読み込みました: ${SCHEMA_PATH}`);

    // スキーマを段階的に実行
    console.log('📝 スキーマを段階的に実行します...');

    // 1. テーブル作成
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL CHECK(length(title) > 0 AND length(title) <= 500),
        due_date TEXT,
        progress INTEGER NOT NULL DEFAULT 0 CHECK(progress >= 0 AND progress <= 100),
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `;
    
    db.exec(createTableSQL);
    console.log('✅ tasksテーブルを作成しました');

    // 2. インデックス作成
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date)',
      'CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed)',
      'CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at)'
    ];

    for (const indexSQL of indexes) {
      db.exec(indexSQL);
      console.log(`✅ インデックス作成: ${indexSQL.match(/idx_\w+/)[0]}`);
    }

    // 3. トリガー作成
    const triggers = [
      `CREATE TRIGGER IF NOT EXISTS update_tasks_updated_at
       AFTER UPDATE ON tasks
       FOR EACH ROW
       BEGIN
         UPDATE tasks SET updated_at = datetime('now') WHERE id = NEW.id;
       END`,
      
      `CREATE TRIGGER IF NOT EXISTS sync_completion_progress
       AFTER UPDATE OF completed ON tasks
       FOR EACH ROW
       WHEN NEW.completed = TRUE AND OLD.completed = FALSE
       BEGIN
         UPDATE tasks SET progress = 100 WHERE id = NEW.id;
       END`,
       
      `CREATE TRIGGER IF NOT EXISTS sync_progress_completion
       AFTER UPDATE OF progress ON tasks
       FOR EACH ROW
       WHEN NEW.progress = 100 AND OLD.progress != 100
       BEGIN
         UPDATE tasks SET completed = TRUE WHERE id = NEW.id;
       END`
    ];

    for (const triggerSQL of triggers) {
      db.exec(triggerSQL);
      const triggerName = triggerSQL.match(/(\w+_\w+_\w+)/)[0];
      console.log(`✅ トリガー作成: ${triggerName}`);
    }
    console.log('✅ スキーマの適用が完了しました');

    // テーブル存在確認
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table';").all();
    console.log('✅ 作成されたテーブル:', tables.map(t => t.name));

    // 接続を閉じる
    db.close();
    console.log('✅ データベース初期化が完了しました');

  } catch (error) {
    console.error('❌ データベース初期化エラー:', error.message);
    process.exit(1);
  }
}

// 直接実行された場合のみ初期化を実行
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase, DB_PATH };
