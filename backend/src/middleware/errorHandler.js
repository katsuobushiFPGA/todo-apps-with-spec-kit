/**
 * Error Handling Middleware
 * 
 * アプリケーション全体のエラーハンドリング
 */

/**
 * APIエラークラス
 */
class ApiError extends Error {
  constructor(message, statusCode = 500, details = []) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * バリデーションエラークラス
 */
class ValidationError extends ApiError {
  constructor(message, details = []) {
    super(message, 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * リソースが見つからないエラークラス
 */
class NotFoundError extends ApiError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * 認証エラークラス
 */
class AuthenticationError extends ApiError {
  constructor(message = 'Authentication required') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * 認可エラークラス
 */
class AuthorizationError extends ApiError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

/**
 * データベースエラーのマッピング
 */
function mapDatabaseError(error) {
  // SQLite制約エラー
  if (error.code === 'SQLITE_CONSTRAINT_CHECK') {
    return new ValidationError('Data validation failed', [
      'データが制約に違反しています'
    ]);
  }

  if (error.code === 'SQLITE_CONSTRAINT_NOT_NULL') {
    return new ValidationError('Required field missing', [
      '必須フィールドが不足しています'
    ]);
  }

  if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return new ValidationError('Duplicate data', [
      '重複するデータが存在します'
    ]);
  }

  if (error.code === 'SQLITE_CONSTRAINT_FOREIGN_KEY') {
    return new ValidationError('Foreign key constraint', [
      '参照整合性制約に違反しています'
    ]);
  }

  // その他のデータベースエラー
  if (error.code && error.code.startsWith('SQLITE_')) {
    return new ApiError('Database operation failed', 500);
  }

  return error;
}

/**
 * エラーレスポンスの標準化
 */
function formatErrorResponse(error, req) {
  const response = {
    error: {
      message: error.message,
      type: error.name || 'Error',
      timestamp: error.timestamp || new Date().toISOString(),
      path: req.path,
      method: req.method
    }
  };

  // バリデーションエラーの詳細情報
  if (error.details && error.details.length > 0) {
    response.error.details = error.details;
  }

  // 開発環境ではスタックトレースを含める
  if (process.env.NODE_ENV !== 'production' && error.stack) {
    response.error.stack = error.stack;
  }

  // リクエストIDがある場合
  if (req.id) {
    response.error.requestId = req.id;
  }

  return response;
}

/**
 * エラーログの出力
 */
function logError(error, req, res) {
  const logLevel = error.statusCode >= 500 ? 'error' : 'warn';
  
  const logData = {
    timestamp: new Date().toISOString(),
    level: logLevel,
    error: {
      name: error.name,
      message: error.message,
      statusCode: error.statusCode,
      stack: error.stack
    },
    request: {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }
  };

  // 開発環境では詳細ログ、本番環境では簡潔なログ
  if (process.env.NODE_ENV === 'production') {
    console.log(JSON.stringify(logData));
  } else {
    console.log(`[${logLevel.toUpperCase()}] ${error.message}`);
    console.log(`Request: ${req.method} ${req.path}`);
    if (error.statusCode >= 500) {
      console.log(error.stack);
    }
  }
}

/**
 * Async エラーハンドリングラッパー
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404エラーハンドラー（API routes用）
 */
function notFoundHandler(req, res, next) {
  const error = new NotFoundError('API endpoint');
  next(error);
}

/**
 * グローバルエラーハンドラー
 */
function globalErrorHandler(error, req, res, next) {
  // データベースエラーのマッピング
  const mappedError = mapDatabaseError(error);
  
  // statusCodeの設定
  const statusCode = mappedError.statusCode || 500;
  
  // エラーログ出力
  logError(mappedError, req, res);
  
  // レスポンス送信
  const response = formatErrorResponse(mappedError, req);
  res.status(statusCode).json(response);
}

/**
 * JSONパースエラーハンドラー
 */
function jsonErrorHandler(error, req, res, next) {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    const jsonError = new ValidationError('Invalid JSON in request body', [
      'リクエストボディのJSONが不正です'
    ]);
    return next(jsonError);
  }
  next(error);
}

/**
 * レート制限エラーハンドラー
 */
function rateLimitErrorHandler(req, res, next) {
  const error = new ApiError('Too many requests', 429);
  next(error);
}

/**
 * タイムアウトエラーハンドラー
 */
function timeoutErrorHandler(req, res, next) {
  const error = new ApiError('Request timeout', 408);
  next(error);
}

/**
 * ヘルスチェック用エラー情報の取得
 */
function getErrorHealthStatus() {
  // 実装上のエラー統計情報を返す
  // 将来的にはエラー集計機能を追加可能
  return {
    status: 'ok',
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  // Error classes
  ApiError,
  ValidationError,
  NotFoundError,
  AuthenticationError,
  AuthorizationError,
  
  // Middleware functions
  globalErrorHandler,
  notFoundHandler,
  jsonErrorHandler,
  rateLimitErrorHandler,
  timeoutErrorHandler,
  asyncHandler,
  
  // Utility functions
  mapDatabaseError,
  formatErrorResponse,
  logError,
  getErrorHealthStatus
};
