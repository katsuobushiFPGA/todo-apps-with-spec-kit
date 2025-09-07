/**
 * Task Model
 * 
 * TODO管理アプリケーションのタスクエンティティを表現するモデル
 * データ検証とビジネスロジックを含む
 */

class Task {
  constructor(data = {}) {
    this.id = data.id || null;
    this.title = data.title || '';
    this.dueDate = data.dueDate || null;
    this.progress = data.progress || 0;
    this.completed = data.completed || false;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  /**
   * タスクデータの検証
   * @param {Object} data - 検証するデータ
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  static validate(data) {
    const errors = [];

    // タイトルの検証
    if (!data.title || typeof data.title !== 'string') {
      errors.push('タイトルは必須です');
    } else if (data.title.trim().length === 0) {
      errors.push('タイトルは空にできません');
    } else if (data.title.length > 500) {
      errors.push('タイトルは500文字以下である必要があります');
    }

    // 期限日の検証
    if (data.dueDate !== null && data.dueDate !== undefined) {
      if (typeof data.dueDate !== 'string') {
        errors.push('期限日は文字列で指定してください');
      } else {
        // ISO 8601 date format (YYYY-MM-DD) の検証
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(data.dueDate)) {
          errors.push('期限日はYYYY-MM-DD形式で指定してください');
        } else {
          const date = new Date(data.dueDate);
          if (isNaN(date.getTime())) {
            errors.push('期限日は有効な日付である必要があります');
          }
        }
      }
    }

    // 進捗率の検証
    if (data.progress !== undefined) {
      if (typeof data.progress !== 'number') {
        errors.push('進捗率は数値で指定してください');
      } else if (data.progress < 0 || data.progress > 100) {
        errors.push('進捗率は0から100の間で指定してください');
      } else if (!Number.isInteger(data.progress)) {
        errors.push('進捗率は整数で指定してください');
      }
    }

    // 完了状態の検証
    if (data.completed !== undefined && typeof data.completed !== 'boolean') {
      errors.push('完了状態はbooleanで指定してください');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 作成用データの検証
   * @param {Object} data - 作成データ
   * @returns {Object} 検証結果
   */
  static validateForCreate(data) {
    const validation = this.validate({
      title: data.title,
      dueDate: data.dueDate,
      progress: 0, // 作成時は常に0
      completed: false // 作成時は常にfalse
    });

    return validation;
  }

  /**
   * 更新用データの検証
   * @param {Object} data - 更新データ
   * @returns {Object} 検証結果
   */
  static validateForUpdate(data) {
    // 更新時は部分的なデータでも許可
    const errors = [];

    if (data.title !== undefined) {
      if (typeof data.title !== 'string') {
        errors.push('タイトルは文字列で指定してください');
      } else if (data.title.trim().length === 0) {
        errors.push('タイトルは空にできません');
      } else if (data.title.length > 500) {
        errors.push('タイトルは500文字以下である必要があります');
      }
    }

    if (data.dueDate !== undefined) {
      if (data.dueDate !== null && typeof data.dueDate !== 'string') {
        errors.push('期限日は文字列またはnullで指定してください');
      } else if (data.dueDate !== null) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(data.dueDate)) {
          errors.push('期限日はYYYY-MM-DD形式で指定してください');
        } else {
          const date = new Date(data.dueDate);
          if (isNaN(date.getTime())) {
            errors.push('期限日は有効な日付である必要があります');
          }
        }
      }
    }

    if (data.progress !== undefined) {
      if (typeof data.progress !== 'number') {
        errors.push('進捗率は数値で指定してください');
      } else if (data.progress < 0 || data.progress > 100) {
        errors.push('進捗率は0から100の間で指定してください');
      } else if (!Number.isInteger(data.progress)) {
        errors.push('進捗率は整数で指定してください');
      }
    }

    if (data.completed !== undefined && typeof data.completed !== 'boolean') {
      errors.push('完了状態はbooleanで指定してください');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * データベース用のプレーンオブジェクトに変換
   * @returns {Object} データベース保存用オブジェクト
   */
  toDbObject() {
    return {
      id: this.id,
      title: this.title,
      due_date: this.dueDate,
      progress: this.progress,
      completed: this.completed,
      created_at: this.createdAt,
      updated_at: this.updatedAt
    };
  }

  /**
   * データベースからのレコードをTaskインスタンスに変換
   * @param {Object} dbRecord - データベースレコード
   * @returns {Task} Taskインスタンス
   */
  static fromDbRecord(dbRecord) {
    return new Task({
      id: dbRecord.id,
      title: dbRecord.title,
      dueDate: dbRecord.due_date,
      progress: dbRecord.progress,
      completed: Boolean(dbRecord.completed),
      createdAt: dbRecord.created_at,
      updatedAt: dbRecord.updated_at
    });
  }

  /**
   * API レスポンス用のオブジェクトに変換
   * @returns {Object} APIレスポンス用オブジェクト
   */
  toApiResponse() {
    return {
      id: this.id,
      title: this.title,
      dueDate: this.dueDate,
      progress: this.progress,
      completed: this.completed,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * ビジネスロジック：進捗と完了状態の整合性を保つ
   * @param {Object} updateData - 更新データ
   * @returns {Object} 整合性を保った更新データ
   */
  static enforceBusinessRules(updateData) {
    const result = { ...updateData };

    // 進捗が100%の場合、自動的に完了状態にする
    if (result.progress === 100 && result.completed !== false) {
      result.completed = true;
    }

    // 完了状態がtrueの場合、自動的に進捗を100%にする
    if (result.completed === true && result.progress !== undefined && result.progress < 100) {
      result.progress = 100;
    }

    return result;
  }

  /**
   * 更新時刻を現在時刻に設定
   */
  touch() {
    this.updatedAt = new Date().toISOString();
  }
}

module.exports = Task;
