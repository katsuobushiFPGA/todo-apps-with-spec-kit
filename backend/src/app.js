/**
 * Express.js Application Setup
 * 
 * TODO管理アプリケーションのメインサーバー
 */

const express = require('express');
const cors = require('cors');
const { getInstance: getDbService } = require('./services/DatabaseService');
const { getCorsConfig } = require('./config/cors');
const taskRoutes = require('./routes/tasks');

// Middleware imports
const { 
  globalErrorHandler, 
  notFoundHandler, 
  jsonErrorHandler 
} = require('./middleware/errorHandler');
const { 
  addRequestId, 
  requestLogger, 
  apiUsageLogger, 
  securityLogger 
} = require('./middleware/logger');
const { 
  validateContentType 
} = require('./middleware/validation');

class App {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3001;
    this.db = null;
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * ミドルウェアの設定
   */
  setupMiddleware() {
    // Request ID and logging
    this.app.use(addRequestId);
    this.app.use(requestLogger);
    this.app.use(apiUsageLogger);
    this.app.use(securityLogger);

    // CORS設定
    this.app.use(cors(getCorsConfig()));

    // Content validation
    this.app.use(validateContentType(['application/json']));

    // JSONパーサー
    this.app.use(express.json({ 
      limit: '10mb',
      strict: true
    }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // JSON parse error handling
    this.app.use(jsonErrorHandler);

    // Security headers
    this.app.use((req, res, next) => {
      res.header('X-Content-Type-Options', 'nosniff');
      res.header('X-Frame-Options', 'DENY');
      res.header('X-XSS-Protection', '1; mode=block');
      next();
    });
  }

  /**
   * ルーティングの設定
   */
  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      const dbHealth = this.db ? this.db.healthCheck() : false;
      
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: dbHealth ? 'connected' : 'disconnected',
        version: process.env.npm_package_version || '1.0.0'
      });
    });

    // API routes
    this.app.use('/api/tasks', taskRoutes);

    // API info endpoint
    this.app.get('/api', (req, res) => {
      res.json({
        name: 'TODO Management API',
        version: '1.0.0',
        description: 'RESTful API for TODO task management',
        endpoints: {
          'GET /api/tasks': 'Get all tasks with filtering and pagination',
          'POST /api/tasks': 'Create a new task',
          'GET /api/tasks/:id': 'Get a specific task',
          'PUT /api/tasks/:id': 'Update a specific task',
          'DELETE /api/tasks/:id': 'Delete a specific task',
          'PATCH /api/tasks/:id/progress': 'Update task progress',
          'PATCH /api/tasks/:id/toggle': 'Toggle task completion',
          'GET /api/tasks/overdue/list': 'Get overdue tasks',
          'GET /api/tasks/stats/summary': 'Get task statistics'
        }
      });
    });

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        message: 'TODO Management API Server',
        status: 'running',
        documentation: '/api'
      });
    });
  }

  /**
   * エラーハンドリングの設定
   */
  setupErrorHandling() {
    // 404 handler for API routes
    this.app.use('/api', notFoundHandler);

    // Global error handler
    this.app.use(globalErrorHandler);

    // 404 handler (最後に配置)
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Resource not found',
        path: req.path,
        method: req.method
      });
    });
  }

  /**
   * データベースの初期化
   */
  async initDatabase() {
    try {
      this.db = getDbService();
      await this.db.init();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * サーバーの開始
   */
  async start() {
    try {
      // データベース初期化
      await this.initDatabase();

      // サーバー起動
      return new Promise((resolve, reject) => {
        const server = this.app.listen(this.port, (error) => {
          if (error) {
            reject(error);
          } else {
            console.log(`🚀 Server running on port ${this.port}`);
            console.log(`📖 API documentation: http://localhost:${this.port}/api`);
            console.log(`💚 Health check: http://localhost:${this.port}/health`);
            resolve(server);
          }
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
          console.log('SIGTERM received, shutting down gracefully');
          server.close(() => {
            console.log('Server closed');
            if (this.db) {
              this.db.close();
              console.log('Database connection closed');
            }
            process.exit(0);
          });
        });

        process.on('SIGINT', () => {
          console.log('SIGINT received, shutting down gracefully');
          server.close(() => {
            console.log('Server closed');
            if (this.db) {
              this.db.close();
              console.log('Database connection closed');
            }
            process.exit(0);
          });
        });
      });

    } catch (error) {
      console.error('Server startup failed:', error);
      throw error;
    }
  }

  /**
   * Express アプリケーションインスタンスを取得（テスト用）
   */
  getApp() {
    return this.app;
  }

  /**
   * サーバーの停止（テスト用）
   */
  async stop() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

module.exports = App;
