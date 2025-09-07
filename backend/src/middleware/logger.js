/**
 * Request Logging Middleware
 * 
 * HTTPリクエストのログ記録とモニタリング
 */

const crypto = require('crypto');

/**
 * リクエストIDを生成
 */
function generateRequestId() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * リクエスト開始時刻を記録
 */
function addRequestId(req, res, next) {
  req.id = generateRequestId();
  req.startTime = Date.now();
  
  // レスポンスヘッダーにリクエストIDを追加
  res.setHeader('X-Request-ID', req.id);
  
  next();
}

/**
 * 基本的なリクエストログ
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();
  
  // レスポンス完了時のログ出力
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      timestamp: new Date().toISOString(),
      requestId: req.id,
      method: req.method,
      path: req.path,
      query: Object.keys(req.query).length > 0 ? req.query : undefined,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('content-length') || 0,
      userAgent: req.get('user-agent'),
      ip: getClientIP(req)
    };

    // ステータスコードに応じてログレベルを調整
    if (res.statusCode >= 500) {
      console.error('[ERROR]', JSON.stringify(logData));
    } else if (res.statusCode >= 400) {
      console.warn('[WARN]', JSON.stringify(logData));
    } else if (process.env.NODE_ENV !== 'production') {
      console.log('[INFO]', `${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    }
  });

  next();
}

/**
 * 詳細なリクエストログ（開発用）
 */
function detailedRequestLogger(req, res, next) {
  if (process.env.NODE_ENV === 'production') {
    return next();
  }

  const startTime = Date.now();
  
  // リクエスト開始ログ
  console.log('\n--- Request Start ---');
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`ID: ${req.id}`);
  console.log(`Method: ${req.method}`);
  console.log(`Path: ${req.path}`);
  console.log(`Query: ${JSON.stringify(req.query, null, 2)}`);
  console.log(`Headers: ${JSON.stringify(getFilteredHeaders(req.headers), null, 2)}`);
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`Body: ${JSON.stringify(req.body, null, 2)}`);
  }

  // レスポンス完了時のログ
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log('\n--- Response End ---');
    console.log(`Status: ${res.statusCode}`);
    console.log(`Duration: ${duration}ms`);
    console.log(`Response Headers: ${JSON.stringify(getFilteredHeaders(res.getHeaders()), null, 2)}`);
    console.log('--- Request Complete ---\n');
  });

  next();
}

/**
 * API使用統計の記録
 */
function apiUsageLogger(req, res, next) {
  // 統計情報をメモリに保存（本格的な実装ではRedisやデータベースを使用）
  if (!global.apiStats) {
    global.apiStats = {
      requests: 0,
      endpoints: {},
      methods: {},
      statusCodes: {},
      totalDuration: 0,
      errors: 0
    };
  }

  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const endpoint = `${req.method} ${req.route ? req.route.path : req.path}`;
    
    // 統計情報の更新
    global.apiStats.requests++;
    global.apiStats.totalDuration += duration;
    
    // エンドポイント別統計
    if (!global.apiStats.endpoints[endpoint]) {
      global.apiStats.endpoints[endpoint] = { count: 0, totalDuration: 0 };
    }
    global.apiStats.endpoints[endpoint].count++;
    global.apiStats.endpoints[endpoint].totalDuration += duration;
    
    // メソッド別統計
    global.apiStats.methods[req.method] = (global.apiStats.methods[req.method] || 0) + 1;
    
    // ステータスコード別統計
    global.apiStats.statusCodes[res.statusCode] = (global.apiStats.statusCodes[res.statusCode] || 0) + 1;
    
    // エラー統計
    if (res.statusCode >= 400) {
      global.apiStats.errors++;
    }
  });

  next();
}

/**
 * セキュリティログ
 */
function securityLogger(req, res, next) {
  const suspiciousPatterns = [
    /script/i,
    /select.*from/i,
    /union.*select/i,
    /insert.*into/i,
    /delete.*from/i,
    /drop.*table/i,
    /<.*>/,
    /javascript:/i
  ];

  // URLとクエリパラメータの検査
  const fullUrl = req.url;
  const bodyString = JSON.stringify(req.body || {});
  
  const suspicious = suspiciousPatterns.some(pattern => 
    pattern.test(fullUrl) || pattern.test(bodyString)
  );

  if (suspicious) {
    console.warn('[SECURITY WARNING]', {
      timestamp: new Date().toISOString(),
      requestId: req.id,
      ip: getClientIP(req),
      method: req.method,
      path: req.path,
      userAgent: req.get('user-agent'),
      reason: 'Suspicious pattern detected'
    });
  }

  // Rate limiting用の簡易実装
  if (!global.requestCounts) {
    global.requestCounts = {};
  }

  const clientIP = getClientIP(req);
  const currentTime = Date.now();
  const timeWindow = 60000; // 1分
  
  if (!global.requestCounts[clientIP]) {
    global.requestCounts[clientIP] = [];
  }

  // 古いリクエスト記録を削除
  global.requestCounts[clientIP] = global.requestCounts[clientIP].filter(
    time => currentTime - time < timeWindow
  );

  global.requestCounts[clientIP].push(currentTime);

  // リクエスト数のチェック
  if (global.requestCounts[clientIP].length > 100) { // 1分間に100リクエスト以上
    console.warn('[SECURITY WARNING]', {
      timestamp: new Date().toISOString(),
      ip: clientIP,
      requestCount: global.requestCounts[clientIP].length,
      reason: 'High request rate detected'
    });
  }

  next();
}

/**
 * パフォーマンスログ
 */
function performanceLogger(req, res, next) {
  const startTime = process.hrtime.bigint();
  const startMemory = process.memoryUsage();

  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage();
    const duration = Number(endTime - startTime) / 1000000; // ナノ秒をミリ秒に変換

    // パフォーマンス閾値チェック
    if (duration > 1000) { // 1秒以上
      console.warn('[PERFORMANCE WARNING]', {
        timestamp: new Date().toISOString(),
        requestId: req.id,
        method: req.method,
        path: req.path,
        duration: `${duration.toFixed(2)}ms`,
        memoryDelta: {
          rss: formatBytes(endMemory.rss - startMemory.rss),
          heapUsed: formatBytes(endMemory.heapUsed - startMemory.heapUsed)
        },
        reason: 'Slow response time'
      });
    }
  });

  next();
}

/**
 * ヘルスチェック用統計情報取得
 */
function getApiStats() {
  if (!global.apiStats) {
    return null;
  }

  const stats = { ...global.apiStats };
  
  // 平均レスポンス時間の計算
  stats.averageResponseTime = stats.requests > 0 
    ? (stats.totalDuration / stats.requests).toFixed(2) + 'ms'
    : '0ms';

  // エラー率の計算
  stats.errorRate = stats.requests > 0 
    ? ((stats.errors / stats.requests) * 100).toFixed(2) + '%'
    : '0%';

  return stats;
}

/**
 * 統計情報のリセット
 */
function resetApiStats() {
  global.apiStats = {
    requests: 0,
    endpoints: {},
    methods: {},
    statusCodes: {},
    totalDuration: 0,
    errors: 0
  };
}

/**
 * ユーティリティ関数: クライアントIPアドレスの取得
 */
function getClientIP(req) {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         'unknown';
}

/**
 * ユーティリティ関数: ヘッダーのフィルタリング
 */
function getFilteredHeaders(headers) {
  const filtered = { ...headers };
  
  // セキュリティ上、除外すべきヘッダー
  delete filtered.authorization;
  delete filtered.cookie;
  delete filtered['x-api-key'];
  
  return filtered;
}

/**
 * ユーティリティ関数: バイト数の形式化
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = {
  addRequestId,
  requestLogger,
  detailedRequestLogger,
  apiUsageLogger,
  securityLogger,
  performanceLogger,
  getApiStats,
  resetApiStats,
  getClientIP,
  generateRequestId
};
