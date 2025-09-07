/**
 * Validation Middleware
 * 
 * リクエストデータのバリデーション
 */

const { ValidationError } = require('./errorHandler');

/**
 * リクエストバリデーションヘルパー
 */
class RequestValidator {
  constructor() {
    this.errors = [];
  }

  /**
   * エラーをリセット
   */
  reset() {
    this.errors = [];
    return this;
  }

  /**
   * 必須フィールドのチェック
   * @param {*} value - チェックする値
   * @param {string} fieldName - フィールド名
   */
  required(value, fieldName) {
    if (value === undefined || value === null || value === '') {
      this.errors.push(`${fieldName}は必須です`);
    }
    return this;
  }

  /**
   * 文字列の検証
   * @param {*} value - チェックする値
   * @param {string} fieldName - フィールド名
   * @param {Object} options - オプション
   */
  string(value, fieldName, options = {}) {
    if (value !== undefined && value !== null) {
      if (typeof value !== 'string') {
        this.errors.push(`${fieldName}は文字列である必要があります`);
        return this;
      }

      // 長さの検証
      if (options.minLength && value.length < options.minLength) {
        this.errors.push(`${fieldName}は${options.minLength}文字以上である必要があります`);
      }

      if (options.maxLength && value.length > options.maxLength) {
        this.errors.push(`${fieldName}は${options.maxLength}文字以下である必要があります`);
      }

      // 空文字の検証
      if (options.notEmpty && value.trim().length === 0) {
        this.errors.push(`${fieldName}は空にできません`);
      }

      // パターンマッチング
      if (options.pattern && !options.pattern.test(value)) {
        this.errors.push(`${fieldName}の形式が正しくありません`);
      }
    }
    return this;
  }

  /**
   * 数値の検証
   * @param {*} value - チェックする値
   * @param {string} fieldName - フィールド名
   * @param {Object} options - オプション
   */
  number(value, fieldName, options = {}) {
    if (value !== undefined && value !== null) {
      const num = Number(value);
      
      if (isNaN(num)) {
        this.errors.push(`${fieldName}は数値である必要があります`);
        return this;
      }

      // 整数の検証
      if (options.integer && !Number.isInteger(num)) {
        this.errors.push(`${fieldName}は整数である必要があります`);
      }

      // 範囲の検証
      if (options.min !== undefined && num < options.min) {
        this.errors.push(`${fieldName}は${options.min}以上である必要があります`);
      }

      if (options.max !== undefined && num > options.max) {
        this.errors.push(`${fieldName}は${options.max}以下である必要があります`);
      }

      // 正の数の検証
      if (options.positive && num <= 0) {
        this.errors.push(`${fieldName}は正の数である必要があります`);
      }
    }
    return this;
  }

  /**
   * 真偽値の検証
   * @param {*} value - チェックする値
   * @param {string} fieldName - フィールド名
   */
  boolean(value, fieldName) {
    if (value !== undefined && value !== null && typeof value !== 'boolean') {
      this.errors.push(`${fieldName}は真偽値である必要があります`);
    }
    return this;
  }

  /**
   * 日付の検証
   * @param {*} value - チェックする値
   * @param {string} fieldName - フィールド名
   * @param {Object} options - オプション
   */
  date(value, fieldName, options = {}) {
    if (value !== undefined && value !== null) {
      // ISO date format (YYYY-MM-DD) の検証
      const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
      
      if (typeof value !== 'string') {
        this.errors.push(`${fieldName}は文字列で指定してください`);
        return this;
      }

      if (!isoDatePattern.test(value)) {
        this.errors.push(`${fieldName}はYYYY-MM-DD形式で指定してください`);
        return this;
      }

      const date = new Date(value);
      if (isNaN(date.getTime())) {
        this.errors.push(`${fieldName}は有効な日付である必要があります`);
        return this;
      }

      // 未来の日付の検証
      if (options.future) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date < today) {
          this.errors.push(`${fieldName}は未来の日付である必要があります`);
        }
      }

      // 過去の日付の検証
      if (options.past) {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (date > today) {
          this.errors.push(`${fieldName}は過去の日付である必要があります`);
        }
      }
    }
    return this;
  }

  /**
   * 配列の検証
   * @param {*} value - チェックする値
   * @param {string} fieldName - フィールド名
   * @param {Object} options - オプション
   */
  array(value, fieldName, options = {}) {
    if (value !== undefined && value !== null) {
      if (!Array.isArray(value)) {
        this.errors.push(`${fieldName}は配列である必要があります`);
        return this;
      }

      // 長さの検証
      if (options.minLength && value.length < options.minLength) {
        this.errors.push(`${fieldName}は${options.minLength}個以上の要素が必要です`);
      }

      if (options.maxLength && value.length > options.maxLength) {
        this.errors.push(`${fieldName}は${options.maxLength}個以下の要素である必要があります`);
      }
    }
    return this;
  }

  /**
   * カスタムバリデーション
   * @param {*} value - チェックする値
   * @param {string} fieldName - フィールド名
   * @param {Function} validator - バリデーション関数
   */
  custom(value, fieldName, validator) {
    if (value !== undefined && value !== null) {
      try {
        const result = validator(value);
        if (result !== true) {
          this.errors.push(typeof result === 'string' ? result : `${fieldName}が無効です`);
        }
      } catch (error) {
        this.errors.push(`${fieldName}の検証中にエラーが発生しました`);
      }
    }
    return this;
  }

  /**
   * バリデーション結果の取得
   */
  getResult() {
    return {
      isValid: this.errors.length === 0,
      errors: [...this.errors]
    };
  }

  /**
   * エラーがある場合に例外を投げる
   */
  throwIfInvalid() {
    if (this.errors.length > 0) {
      throw new ValidationError('Validation failed', this.errors);
    }
  }
}

/**
 * タスク作成バリデーション
 */
function validateTaskCreation(req, res, next) {
  const validator = new RequestValidator();
  const { title, dueDate } = req.body;

  validator
    .required(title, 'タイトル')
    .string(title, 'タイトル', { maxLength: 500, notEmpty: true })
    .date(dueDate, '期限日');

  try {
    validator.throwIfInvalid();
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * タスク更新バリデーション
 */
function validateTaskUpdate(req, res, next) {
  const validator = new RequestValidator();
  const { title, dueDate, progress, completed } = req.body;

  // 更新時は任意のフィールド
  validator
    .string(title, 'タイトル', { maxLength: 500, notEmpty: true })
    .date(dueDate, '期限日')
    .number(progress, '進捗率', { integer: true, min: 0, max: 100 })
    .boolean(completed, '完了状態');

  try {
    validator.throwIfInvalid();
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * 進捗更新バリデーション
 */
function validateProgressUpdate(req, res, next) {
  const validator = new RequestValidator();
  const { progress } = req.body;

  validator
    .required(progress, '進捗率')
    .number(progress, '進捗率', { integer: true, min: 0, max: 100 });

  try {
    validator.throwIfInvalid();
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * IDパラメータバリデーション
 */
function validateTaskId(req, res, next) {
  const validator = new RequestValidator();
  const { id } = req.params;

  validator
    .required(id, 'タスクID')
    .number(id, 'タスクID', { integer: true, positive: true });

  try {
    validator.throwIfInvalid();
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * クエリパラメータバリデーション
 */
function validateQueryParameters(req, res, next) {
  const validator = new RequestValidator();
  const { 
    completed, 
    dueDateFrom, 
    dueDateTo, 
    progressMin, 
    progressMax,
    sortBy,
    sortOrder,
    limit,
    offset
  } = req.query;

  // Boolean パラメータ
  if (completed !== undefined) {
    if (completed !== 'true' && completed !== 'false') {
      validator.errors.push('completedはtrueまたはfalseである必要があります');
    }
  }

  // 日付パラメータ
  validator
    .date(dueDateFrom, '開始日')
    .date(dueDateTo, '終了日');

  // 進捗パラメータ
  validator
    .number(progressMin, '最小進捗率', { integer: true, min: 0, max: 100 })
    .number(progressMax, '最大進捗率', { integer: true, min: 0, max: 100 });

  // ソートパラメータ
  if (sortBy !== undefined) {
    const validSortFields = ['id', 'title', 'dueDate', 'progress', 'completed', 'createdAt', 'updatedAt'];
    if (!validSortFields.includes(sortBy)) {
      validator.errors.push('sortByは有効なフィールド名である必要があります');
    }
  }

  if (sortOrder !== undefined) {
    if (sortOrder !== 'asc' && sortOrder !== 'desc') {
      validator.errors.push('sortOrderはascまたはdescである必要があります');
    }
  }

  // ページネーションパラメータ
  validator
    .number(limit, 'limit', { integer: true, min: 1, max: 100 })
    .number(offset, 'offset', { integer: true, min: 0 });

  try {
    validator.throwIfInvalid();
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * リクエストサイズ制限
 */
function validateRequestSize(sizeLimit = '10mb') {
  return (req, res, next) => {
    const contentLength = req.get('content-length');
    if (contentLength && parseInt(contentLength) > sizeLimit) {
      const error = new ValidationError('Request too large');
      return next(error);
    }
    next();
  };
}

/**
 * Content-Type バリデーション
 */
function validateContentType(allowedTypes = ['application/json']) {
  return (req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      const contentType = req.get('content-type');
      
      if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
        const error = new ValidationError('Invalid content type', [
          `Content-Typeは次のいずれかである必要があります: ${allowedTypes.join(', ')}`
        ]);
        return next(error);
      }
    }
    next();
  };
}

module.exports = {
  RequestValidator,
  validateTaskCreation,
  validateTaskUpdate,
  validateProgressUpdate,
  validateTaskId,
  validateQueryParameters,
  validateRequestSize,
  validateContentType
};
