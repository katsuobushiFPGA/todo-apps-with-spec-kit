/**
 * Task Routes
 * 
 * タスク管理のRESTful APIエンドポイント
 */

const express = require('express');
const TaskService = require('../services/TaskService');
const { 
  validateTaskCreation,
  validateTaskUpdate,
  validateProgressUpdate,
  validateTaskId,
  validateQueryParameters
} = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * エラーハンドリングヘルパー
 */
function handleError(res, error) {
  console.error('API Error:', error);
  
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      error: error.message,
      details: error.details || []
    });
  }

  return res.status(500).json({
    error: 'Internal server error'
  });
}

/**
 * 成功レスポンスヘルパー
 */
function sendSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data
  });
}

/**
 * POST /api/tasks
 * 新しいタスクを作成
 */
router.post('/', validateTaskCreation, asyncHandler(async (req, res) => {
  const taskService = new TaskService();
  const task = await taskService.createTask(req.body);
  
  sendSuccess(res, task, 201);
}));

/**
 * GET /api/tasks
 * タスク一覧を取得（フィルタリング・ソート・ページネーション対応）
 */
router.get('/', validateQueryParameters, asyncHandler(async (req, res) => {
  const taskService = new TaskService();
  const result = await taskService.getAllTasks(req.query);
  
  sendSuccess(res, result);
}));

/**
 * GET /api/tasks/:id
 * 指定IDのタスクを取得
 */
router.get('/:id', validateTaskId, asyncHandler(async (req, res) => {
  const taskService = new TaskService();
  const task = await taskService.getTaskById(req.params.id);
  
  if (!task) {
    return res.status(404).json({
      error: 'Task not found'
    });
  }
  
  sendSuccess(res, task);
}));

/**
 * PUT /api/tasks/:id
 * 指定IDのタスクを更新
 */
router.put('/:id', validateTaskId, validateTaskUpdate, asyncHandler(async (req, res) => {
  const taskService = new TaskService();
  const task = await taskService.updateTask(req.params.id, req.body);
  
  if (!task) {
    return res.status(404).json({
      error: 'Task not found'
    });
  }
  
  sendSuccess(res, task);
}));

/**
 * DELETE /api/tasks/:id
 * 指定IDのタスクを削除
 */
router.delete('/:id', validateTaskId, asyncHandler(async (req, res) => {
  const taskService = new TaskService();
  const deleted = await taskService.deleteTask(req.params.id);
  
  if (!deleted) {
    return res.status(404).json({
      error: 'Task not found'
    });
  }
  
  sendSuccess(res, { message: 'Task deleted successfully' });
}));

/**
 * PATCH /api/tasks/:id/progress
 * 指定IDのタスクの進捗を更新
 */
router.patch('/:id/progress', validateTaskId, validateProgressUpdate, asyncHandler(async (req, res) => {
  const { progress } = req.body;
  
  const taskService = new TaskService();
  const task = await taskService.updateTaskProgress(req.params.id, progress);
  
  if (!task) {
    return res.status(404).json({
      error: 'Task not found'
    });
  }
  
  sendSuccess(res, task);
}));

/**
 * PATCH /api/tasks/:id/toggle
 * 指定IDのタスクの完了状態を切り替え
 */
router.patch('/:id/toggle', validateTaskId, asyncHandler(async (req, res) => {
  const taskService = new TaskService();
  const task = await taskService.toggleTaskCompletion(req.params.id);
  
  if (!task) {
    return res.status(404).json({
      error: 'Task not found'
    });
  }
  
  sendSuccess(res, task);
}));

/**
 * GET /api/tasks/overdue
 * 期限切れタスクを取得
 */
router.get('/overdue/list', asyncHandler(async (req, res) => {
  const taskService = new TaskService();
  const overdueTasks = await taskService.getOverdueTasks();
  
  sendSuccess(res, { tasks: overdueTasks });
}));

/**
 * GET /api/tasks/statistics
 * タスクの統計情報を取得
 */
router.get('/stats/summary', asyncHandler(async (req, res) => {
  const taskService = new TaskService();
  const statistics = await taskService.getTaskStatistics();
  
  sendSuccess(res, statistics);
}));

module.exports = router;
