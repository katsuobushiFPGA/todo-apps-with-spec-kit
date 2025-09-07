/**
 * CORS Configuration
 * 
 * Cross-Origin Resource Sharing の設定管理
 */

/**
 * 開発環境用CORS設定
 */
const developmentConfig = {
  origin: [
    'http://localhost:5173', // Vite dev server
    'http://localhost:3000', // Alternative dev port
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept'
  ],
  credentials: true,
  optionsSuccessStatus: 200 // IE11 対応
};

/**
 * 本番環境用CORS設定
 */
const productionConfig = {
  origin: process.env.ALLOWED_ORIGINS ? 
    process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()) : 
    false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

/**
 * テスト環境用CORS設定
 */
const testConfig = {
  origin: true, // テストでは全てのoriginを許可
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept'
  ],
  credentials: true
};

/**
 * 動的CORS設定関数
 * @param {Object} req - Express request object
 * @param {Function} callback - CORS callback
 */
const dynamicCorsConfig = (req, callback) => {
  let corsOptions;

  // 環境に応じた設定の選択
  switch (process.env.NODE_ENV) {
    case 'production':
      corsOptions = productionConfig;
      break;
    case 'test':
      corsOptions = testConfig;
      break;
    default:
      corsOptions = developmentConfig;
  }

  // 本番環境でoriginチェック
  if (process.env.NODE_ENV === 'production') {
    const origin = req.header('Origin');
    
    if (!origin) {
      // Same-origin requests (origin header なし)
      corsOptions.origin = true;
    } else if (corsOptions.origin && Array.isArray(corsOptions.origin)) {
      corsOptions.origin = corsOptions.origin.includes(origin);
    }
  }

  callback(null, corsOptions);
};

/**
 * Preflight リクエスト用のミドルウェア
 */
const preflightHandler = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    // Preflight request handling
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
    res.sendStatus(200);
  } else {
    next();
  }
};

/**
 * 環境別設定取得
 */
function getCorsConfig() {
  switch (process.env.NODE_ENV) {
    case 'production':
      return productionConfig;
    case 'test':
      return testConfig;
    default:
      return developmentConfig;
  }
}

/**
 * CORS設定の検証
 */
function validateCorsConfig(config) {
  const errors = [];

  if (process.env.NODE_ENV === 'production') {
    if (!config.origin || (Array.isArray(config.origin) && config.origin.length === 0)) {
      errors.push('Production environment requires valid origins');
    }
  }

  if (!Array.isArray(config.methods) || config.methods.length === 0) {
    errors.push('Methods array is required');
  }

  if (!Array.isArray(config.allowedHeaders) || config.allowedHeaders.length === 0) {
    errors.push('AllowedHeaders array is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * CORS ログ出力
 */
function logCorsConfig() {
  const config = getCorsConfig();
  const validation = validateCorsConfig(config);

  console.log('🔒 CORS Configuration:');
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Origins: ${Array.isArray(config.origin) ? config.origin.join(', ') : config.origin}`);
  console.log(`   Methods: ${config.methods.join(', ')}`);
  console.log(`   Credentials: ${config.credentials}`);

  if (!validation.isValid) {
    console.warn('⚠️  CORS Configuration Warnings:');
    validation.errors.forEach(error => console.warn(`   - ${error}`));
  }
}

module.exports = {
  getCorsConfig,
  dynamicCorsConfig,
  preflightHandler,
  validateCorsConfig,
  logCorsConfig,
  developmentConfig,
  productionConfig,
  testConfig
};
