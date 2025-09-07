/**
 * Task Service
 * 
 * タスク管理のビジネスロジックを処理するサービス層
 */

const Task = require('../models/Task');
const { getInstance: getDbService } = require('./DatabaseService');

class TaskService {
  constructor() {
    this.db = getDbService();
  }

  /**
   * 新しいタスクを作成
   * @param {Object} taskData - タスク作成データ
   * @returns {Promise<Object>} 作成されたタスク
   */
  async createTask(taskData) {
    // 入力データの検証
    const validation = Task.validateForCreate(taskData);
    if (!validation.isValid) {
      const error = new Error('Validation failed');
      error.statusCode = 400;
      error.details = validation.errors;
      throw error;
    }

    try {
      // ビジネスルールの適用
      const processedData = Task.enforceBusinessRules({
        title: taskData.title.trim(),
        dueDate: taskData.dueDate || null,
        progress: 0,
        completed: false
      });

      // データベースに保存
      const dbRecord = this.db.createTask(processedData);
      
      // Taskモデルに変換してレスポンス
      const task = Task.fromDbRecord(dbRecord);
      return task.toApiResponse();

    } catch (error) {
      console.error('Task creation failed:', error);
      
      if (error.code === 'SQLITE_CONSTRAINT_CHECK') {
        const validationError = new Error('Data validation failed');
        validationError.statusCode = 400;
        validationError.details = ['タスクデータが制約に違反しています'];
        throw validationError;
      }
      
      const serviceError = new Error('Task creation failed');
      serviceError.statusCode = 500;
      throw serviceError;
    }
  }

  /**
   * IDでタスクを取得
   * @param {number} id - タスクID
   * @returns {Promise<Object|null>} タスクデータ
   */
  async getTaskById(id) {
    // IDの検証
    if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
      const error = new Error('Invalid task ID');
      error.statusCode = 400;
      throw error;
    }

    try {
      const dbRecord = this.db.getTaskById(Number(id));
      
      if (!dbRecord) {
        return null;
      }

      const task = Task.fromDbRecord(dbRecord);
      return task.toApiResponse();

    } catch (error) {
      console.error('Task retrieval failed:', error);
      const serviceError = new Error('Task retrieval failed');
      serviceError.statusCode = 500;
      throw serviceError;
    }
  }

  /**
   * 全タスクを取得（フィルタリング・ソート対応）
   * @param {Object} options - 取得オプション
   * @returns {Promise<Object>} タスク一覧とメタデータ
   */
  async getAllTasks(options = {}) {
    try {
      // クエリパラメータの検証と正規化
      const queryOptions = this.validateAndNormalizeQueryOptions(options);

      // タスクデータの取得
      const dbRecords = this.db.getAllTasks(queryOptions);
      const totalCount = this.db.getTaskCount({
        completed: queryOptions.completed,
        dueDateFrom: queryOptions.dueDateFrom,
        dueDateTo: queryOptions.dueDateTo,
        progressMin: queryOptions.progressMin,
        progressMax: queryOptions.progressMax
      });

      // Taskモデルに変換
      const tasks = dbRecords.map(record => {
        const task = Task.fromDbRecord(record);
        return task.toApiResponse();
      });

      // ページネーション情報の計算
      const limit = queryOptions.limit || totalCount;
      const offset = queryOptions.offset || 0;
      const hasMore = offset + limit < totalCount;
      const currentPage = Math.floor(offset / limit) + 1;
      const totalPages = Math.ceil(totalCount / limit);

      return {
        tasks,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore,
          currentPage,
          totalPages
        },
        filters: {
          completed: queryOptions.completed,
          dueDateFrom: queryOptions.dueDateFrom,
          dueDateTo: queryOptions.dueDateTo,
          progressMin: queryOptions.progressMin,
          progressMax: queryOptions.progressMax
        },
        sort: {
          sortBy: queryOptions.sortBy,
          sortOrder: queryOptions.sortOrder
        }
      };

    } catch (error) {
      if (error.statusCode) {
        throw error; // すでに適切なエラーの場合はそのまま
      }
      
      console.error('Tasks retrieval failed:', error);
      const serviceError = new Error('Tasks retrieval failed');
      serviceError.statusCode = 500;
      throw serviceError;
    }
  }

  /**
   * タスクを更新
   * @param {number} id - タスクID
   * @param {Object} updateData - 更新データ
   * @returns {Promise<Object|null>} 更新されたタスク
   */
  async updateTask(id, updateData) {
    // IDの検証
    if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
      const error = new Error('Invalid task ID');
      error.statusCode = 400;
      throw error;
    }

    // 更新データの検証
    const validation = Task.validateForUpdate(updateData);
    if (!validation.isValid) {
      const error = new Error('Validation failed');
      error.statusCode = 400;
      error.details = validation.errors;
      throw error;
    }

    try {
      // 既存タスクの確認
      const existing = await this.getTaskById(id);
      if (!existing) {
        return null;
      }

      // 更新データの準備
      const processedData = Task.enforceBusinessRules({
        title: updateData.title?.trim(),
        dueDate: updateData.dueDate,
        progress: updateData.progress,
        completed: updateData.completed
      });

      // 未定義フィールドを除去
      Object.keys(processedData).forEach(key => {
        if (processedData[key] === undefined) {
          delete processedData[key];
        }
      });

      // データベースを更新
      const dbRecord = this.db.updateTask(Number(id), processedData);
      
      if (!dbRecord) {
        return null;
      }

      const task = Task.fromDbRecord(dbRecord);
      return task.toApiResponse();

    } catch (error) {
      if (error.statusCode) {
        throw error;
      }

      console.error('Task update failed:', error);
      
      if (error.code === 'SQLITE_CONSTRAINT_CHECK') {
        const validationError = new Error('Data validation failed');
        validationError.statusCode = 400;
        validationError.details = ['更新データが制約に違反しています'];
        throw validationError;
      }

      const serviceError = new Error('Task update failed');
      serviceError.statusCode = 500;
      throw serviceError;
    }
  }

  /**
   * タスクを削除
   * @param {number} id - タスクID
   * @returns {Promise<boolean>} 削除成功の場合true
   */
  async deleteTask(id) {
    // IDの検証
    if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
      const error = new Error('Invalid task ID');
      error.statusCode = 400;
      throw error;
    }

    try {
      const deleted = this.db.deleteTask(Number(id));
      return deleted;

    } catch (error) {
      console.error('Task deletion failed:', error);
      const serviceError = new Error('Task deletion failed');
      serviceError.statusCode = 500;
      throw serviceError;
    }
  }

  /**
   * タスクの進捗を更新
   * @param {number} id - タスクID
   * @param {number} progress - 進捗率 (0-100)
   * @returns {Promise<Object|null>} 更新されたタスク
   */
  async updateTaskProgress(id, progress) {
    return this.updateTask(id, { progress });
  }

  /**
   * タスクの完了状態を切り替え
   * @param {number} id - タスクID
   * @returns {Promise<Object|null>} 更新されたタスク
   */
  async toggleTaskCompletion(id) {
    const task = await this.getTaskById(id);
    if (!task) {
      return null;
    }

    return this.updateTask(id, { completed: !task.completed });
  }

  /**
   * 期限切れタスクを取得
   * @returns {Promise<Array>} 期限切れタスク一覧
   */
  async getOverdueTasks() {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const options = {
      completed: false,
      dueDateTo: today,
      sortBy: 'due_date',
      sortOrder: 'asc'
    };

    const result = await this.getAllTasks(options);
    
    // 今日より前の日付のもののみをフィルタ
    const overdueTasks = result.tasks.filter(task => 
      task.dueDate && task.dueDate < today
    );

    return overdueTasks;
  }

  /**
   * 完了タスクの統計を取得
   * @returns {Promise<Object>} 統計情報
   */
  async getTaskStatistics() {
    try {
      const totalTasks = this.db.getTaskCount();
      const completedTasks = this.db.getTaskCount({ completed: true });
      const inProgressTasks = this.db.getTaskCount({ 
        completed: false, 
        progressMin: 1 
      });
      const notStartedTasks = this.db.getTaskCount({ 
        completed: false, 
        progressMax: 0 
      });

      const today = new Date().toISOString().split('T')[0];
      const overdueTasks = this.db.getTaskCount({
        completed: false,
        dueDateTo: today
      });

      return {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
        notStarted: notStartedTasks,
        overdue: overdueTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      };

    } catch (error) {
      console.error('Statistics retrieval failed:', error);
      const serviceError = new Error('Statistics retrieval failed');
      serviceError.statusCode = 500;
      throw serviceError;
    }
  }

  /**
   * クエリオプションの検証と正規化
   * @param {Object} options - 生のクエリオプション
   * @returns {Object} 正規化されたオプション
   */
  validateAndNormalizeQueryOptions(options) {
    const result = {};

    // completed フィルタ
    if (options.completed !== undefined) {
      if (options.completed === 'true' || options.completed === true) {
        result.completed = true;
      } else if (options.completed === 'false' || options.completed === false) {
        result.completed = false;
      }
    }

    // 日付フィルタ
    if (options.dueDateFrom) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateRegex.test(options.dueDateFrom)) {
        result.dueDateFrom = options.dueDateFrom;
      } else {
        const error = new Error('Invalid dueDateFrom format');
        error.statusCode = 400;
        throw error;
      }
    }

    if (options.dueDateTo) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateRegex.test(options.dueDateTo)) {
        result.dueDateTo = options.dueDateTo;
      } else {
        const error = new Error('Invalid dueDateTo format');
        error.statusCode = 400;
        throw error;
      }
    }

    // 進捗フィルタ
    if (options.progressMin !== undefined) {
      const progress = Number(options.progressMin);
      if (Number.isInteger(progress) && progress >= 0 && progress <= 100) {
        result.progressMin = progress;
      } else {
        const error = new Error('Invalid progressMin value');
        error.statusCode = 400;
        throw error;
      }
    }

    if (options.progressMax !== undefined) {
      const progress = Number(options.progressMax);
      if (Number.isInteger(progress) && progress >= 0 && progress <= 100) {
        result.progressMax = progress;
      } else {
        const error = new Error('Invalid progressMax value');
        error.statusCode = 400;
        throw error;
      }
    }

    // ソート
    const validSortFields = ['id', 'title', 'dueDate', 'progress', 'completed', 'createdAt', 'updatedAt'];
    const sortFieldMap = {
      id: 'id',
      title: 'title',
      dueDate: 'due_date',
      progress: 'progress',
      completed: 'completed',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    };

    result.sortBy = sortFieldMap[options.sortBy] || 'created_at';
    result.sortOrder = options.sortOrder === 'asc' ? 'asc' : 'desc';

    // ページネーション
    if (options.limit !== undefined) {
      const limit = Number(options.limit);
      if (Number.isInteger(limit) && limit > 0 && limit <= 100) {
        result.limit = limit;
      } else {
        const error = new Error('Invalid limit value (1-100)');
        error.statusCode = 400;
        throw error;
      }
    }

    if (options.offset !== undefined) {
      const offset = Number(options.offset);
      if (Number.isInteger(offset) && offset >= 0) {
        result.offset = offset;
      } else {
        const error = new Error('Invalid offset value');
        error.statusCode = 400;
        throw error;
      }
    }

    return result;
  }
}

module.exports = TaskService;
