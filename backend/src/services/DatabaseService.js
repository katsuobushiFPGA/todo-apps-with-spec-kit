/**
 * Database Service
 * 
 * SQLiteデータベースへのアクセスを管理するサービス層
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class DatabaseService {
  constructor() {
    this.db = null;
    this.dbPath = process.env.NODE_ENV === 'test' 
      ? ':memory:' 
      : path.join(__dirname, '../../data/todos.db');
  }

  /**
   * データベース接続を初期化
   */
  async init() {
    try {
      // データディレクトリの作成（テスト時は不要）
      if (this.dbPath !== ':memory:') {
        const dataDir = path.dirname(this.dbPath);
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
      }

      // データベース接続
      this.db = new Database(this.dbPath);
      
      // WAL mode for better concurrent access
      this.db.pragma('journal_mode = WAL');
      
      // Foreign key constraints
      this.db.pragma('foreign_keys = ON');

      // スキーマの初期化
      await this.initSchema();

      console.log(`Database initialized: ${this.dbPath}`);
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * データベーススキーマの初期化
   */
  async initSchema() {
    const createTasksTable = `
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL CHECK(length(title) > 0 AND length(title) <= 500),
        due_date TEXT,
        progress INTEGER NOT NULL DEFAULT 0 CHECK(progress >= 0 AND progress <= 100),
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
      )
    `;

    const createIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed)',
      'CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date)',
      'CREATE INDEX IF NOT EXISTS idx_tasks_progress ON tasks(progress)',
      'CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at)'
    ];

    const createTriggers = [
      `CREATE TRIGGER IF NOT EXISTS tasks_updated_at_trigger
       AFTER UPDATE ON tasks
       BEGIN
         UPDATE tasks SET updated_at = datetime('now', 'localtime') WHERE id = NEW.id;
       END`,
      
      `CREATE TRIGGER IF NOT EXISTS tasks_progress_completed_sync
       AFTER UPDATE OF progress ON tasks
       BEGIN
         UPDATE tasks SET completed = (NEW.progress = 100) WHERE id = NEW.id AND NEW.progress = 100;
       END`,
      
      `CREATE TRIGGER IF NOT EXISTS tasks_completed_progress_sync
       AFTER UPDATE OF completed ON tasks
       BEGIN
         UPDATE tasks SET progress = 100 WHERE id = NEW.id AND NEW.completed = 1 AND progress < 100;
       END`
    ];

    try {
      // テーブル作成
      this.db.exec(createTasksTable);

      // インデックス作成
      for (const index of createIndexes) {
        this.db.exec(index);
      }

      // トリガー作成
      for (const trigger of createTriggers) {
        this.db.exec(trigger);
      }

    } catch (error) {
      console.error('Schema initialization failed:', error);
      throw error;
    }
  }

  /**
   * 新しいタスクを作成
   * @param {Object} taskData - タスクデータ
   * @returns {Object} 作成されたタスク
   */
  createTask(taskData) {
    const stmt = this.db.prepare(`
      INSERT INTO tasks (title, due_date, progress, completed)
      VALUES (?, ?, ?, ?)
    `);

    try {
      const result = stmt.run(
        taskData.title,
        taskData.dueDate,
        taskData.progress || 0,
        taskData.completed ? 1 : 0  // boolean を integer に変換
      );

      return this.getTaskById(result.lastInsertRowid);
    } catch (error) {
      console.error('Task creation failed:', error);
      throw error;
    }
  }

  /**
   * IDでタスクを取得
   * @param {number} id - タスクID
   * @returns {Object|null} タスクデータ
   */
  getTaskById(id) {
    const stmt = this.db.prepare('SELECT * FROM tasks WHERE id = ?');
    
    try {
      const result = stmt.get(id);
      return result || null;
    } catch (error) {
      console.error('Task retrieval failed:', error);
      throw error;
    }
  }

  /**
   * 全タスクを取得（フィルタリング・ソート対応）
   * @param {Object} options - 取得オプション
   * @returns {Array} タスク配列
   */
  getAllTasks(options = {}) {
    let query = 'SELECT * FROM tasks';
    const params = [];
    const conditions = [];

    // フィルタリング
    if (options.completed !== undefined) {
      conditions.push('completed = ?');
      params.push(options.completed ? 1 : 0);  // boolean を integer に変換
    }

    if (options.dueDateFrom) {
      conditions.push('due_date >= ?');
      params.push(options.dueDateFrom);
    }

    if (options.dueDateTo) {
      conditions.push('due_date <= ?');
      params.push(options.dueDateTo);
    }

    if (options.progressMin !== undefined) {
      conditions.push('progress >= ?');
      params.push(options.progressMin);
    }

    if (options.progressMax !== undefined) {
      conditions.push('progress <= ?');
      params.push(options.progressMax);
    }

    // WHERE句の追加
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // ソート
    const validSortFields = ['id', 'title', 'due_date', 'progress', 'completed', 'created_at', 'updated_at'];
    const sortBy = validSortFields.includes(options.sortBy) ? options.sortBy : 'created_at';
    const sortOrder = options.sortOrder === 'asc' ? 'ASC' : 'DESC';
    
    query += ` ORDER BY ${sortBy} ${sortOrder}`;

    // リミット
    if (options.limit && options.limit > 0) {
      query += ' LIMIT ?';
      params.push(options.limit);

      if (options.offset && options.offset > 0) {
        query += ' OFFSET ?';
        params.push(options.offset);
      }
    }

    const stmt = this.db.prepare(query);
    
    try {
      return stmt.all(...params);
    } catch (error) {
      console.error('Tasks retrieval failed:', error);
      throw error;
    }
  }

  /**
   * タスクを更新
   * @param {number} id - タスクID
   * @param {Object} updateData - 更新データ
   * @returns {Object|null} 更新されたタスク
   */
  updateTask(id, updateData) {
    const updateFields = [];
    const params = [];

    // 更新フィールドの動的構築
    const allowedFields = ['title', 'due_date', 'progress', 'completed'];
    const fieldMap = {
      title: 'title',
      dueDate: 'due_date',
      progress: 'progress',
      completed: 'completed'
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (updateData[key] !== undefined && allowedFields.includes(dbField)) {
        updateFields.push(`${dbField} = ?`);
        
        // booleanを整数に変換
        if (key === 'completed') {
          params.push(updateData[key] ? 1 : 0);
        } else {
          params.push(updateData[key]);
        }
      }
    }

    if (updateFields.length === 0) {
      return this.getTaskById(id);
    }

    params.push(id);
    const query = `UPDATE tasks SET ${updateFields.join(', ')} WHERE id = ?`;
    const stmt = this.db.prepare(query);

    try {
      const result = stmt.run(...params);
      
      if (result.changes === 0) {
        return null; // タスクが見つからない
      }

      return this.getTaskById(id);
    } catch (error) {
      console.error('Task update failed:', error);
      throw error;
    }
  }

  /**
   * タスクを削除
   * @param {number} id - タスクID
   * @returns {boolean} 削除成功の場合true
   */
  deleteTask(id) {
    const stmt = this.db.prepare('DELETE FROM tasks WHERE id = ?');
    
    try {
      const result = stmt.run(id);
      return result.changes > 0;
    } catch (error) {
      console.error('Task deletion failed:', error);
      throw error;
    }
  }

  /**
   * タスク数を取得
   * @param {Object} options - フィルタオプション
   * @returns {number} タスク数
   */
  getTaskCount(options = {}) {
    let query = 'SELECT COUNT(*) as count FROM tasks';
    const params = [];
    const conditions = [];

    // フィルタリング（getAllTasks と同じロジック）
    if (options.completed !== undefined) {
      conditions.push('completed = ?');
      params.push(options.completed ? 1 : 0);  // boolean を integer に変換
    }

    if (options.dueDateFrom) {
      conditions.push('due_date >= ?');
      params.push(options.dueDateFrom);
    }

    if (options.dueDateTo) {
      conditions.push('due_date <= ?');
      params.push(options.dueDateTo);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const stmt = this.db.prepare(query);
    
    try {
      const result = stmt.get(...params);
      return result.count;
    } catch (error) {
      console.error('Task count failed:', error);
      throw error;
    }
  }

  /**
   * データベーストランザクション実行
   * @param {Function} callback - トランザクション内で実行する処理
   * @returns {*} コールバックの戻り値
   */
  transaction(callback) {
    const txn = this.db.transaction(callback);
    return txn();
  }

  /**
   * データベース接続を閉じる
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * データベースの健全性チェック
   * @returns {boolean} 健全性チェック結果
   */
  healthCheck() {
    try {
      const result = this.db.prepare('SELECT 1 as test').get();
      return result && result.test === 1;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  /**
   * 全データを削除（テスト用）
   */
  clearAllData() {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('clearAllData can only be used in test environment');
    }
    
    try {
      this.db.exec('DELETE FROM tasks');
    } catch (error) {
      console.error('Clear all data failed:', error);
      throw error;
    }
  }
}

// シングルトンインスタンス
let instance = null;

/**
 * DatabaseServiceのシングルトンインスタンスを取得
 * @returns {DatabaseService} DatabaseServiceインスタンス
 */
function getInstance() {
  if (!instance) {
    instance = new DatabaseService();
  }
  return instance;
}

module.exports = {
  DatabaseService,
  getInstance
};
