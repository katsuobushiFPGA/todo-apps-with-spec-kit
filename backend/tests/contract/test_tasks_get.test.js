import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import App from '../../src/app.js';

/**
 * Contract Test: GET /api/tasks
 * 
 * OpenAPI契約に基づいたタスク一覧取得エンドポイントのテスト
 * このテストは実装前に作成され、最初は失敗しなければならない
 */

describe('GET /api/tasks - Contract Test', () => {
  let server;
  let appInstance;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    appInstance = new App();
    await appInstance.initDatabase();
    server = appInstance.getApp().listen(0);
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  beforeEach(async () => {
    // 各テスト前にデータベースをクリーンアップ
    const { getInstance } = require('../../src/services/DatabaseService');
    const dbService = getInstance();
    await dbService.db.exec('DELETE FROM tasks');
  });

  describe('基本的なタスク一覧取得', () => {
    it('空のタスク一覧を取得できること', async () => {
      const response = await request(appInstance.getApp())
        .get('/api/tasks')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("data");

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data.tasks)).toBe(true);
      expect(response.body.data.tasks).toHaveLength(0);
    });

    it('タスクが存在する場合は配列で返すこと', async () => {
      // 事前にタスクを作成（テストデータ準備）
      await request(appInstance.getApp())
        .post('/api/tasks')
        .send({ title: 'テストタスク1' });
      
      await request(appInstance.getApp())
        .post('/api/tasks')
        .send({ title: 'テストタスク2', dueDate: '2025-09-15' });

      const response = await request(appInstance.getApp())
        .get('/api/tasks')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("data");

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data.tasks)).toBe(true);
      expect(response.body.data.tasks.length).toBeGreaterThan(0);

      // 各タスクのスキーマ検証
      response.body.data.tasks.forEach(task => {
        expect(task).toHaveProperty('id');
        expect(task).toHaveProperty('title');
        expect(task).toHaveProperty('dueDate');
        expect(task).toHaveProperty('progress');
        expect(task).toHaveProperty('completed');
        expect(task).toHaveProperty('createdAt');
        expect(task).toHaveProperty('updatedAt');

        // 型検証
        expect(typeof task.id).toBe('number');
        expect(typeof task.title).toBe('string');
        expect(typeof task.progress).toBe('number');
        expect(typeof task.completed).toBe('boolean');
        expect(typeof task.createdAt).toBe('string');
        expect(typeof task.updatedAt).toBe('string');

        // 値の範囲検証
        expect(task.progress).toBeGreaterThanOrEqual(0);
        expect(task.progress).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('クエリパラメータ - orderBy', () => {
    it('orderBy=createdでソートできること（デフォルト）', async () => {
      // テストデータ作成
      const task1 = await request(appInstance.getApp())
        .post('/api/tasks')
        .send({ title: '最初のタスク' });
      
      // 少し待ってから2番目のタスクを作成
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const task2 = await request(appInstance.getApp())
        .post('/api/tasks')
        .send({ title: '2番目のタスク' });

      const response = await request(appInstance.getApp())
        .get('/api/tasks?orderBy=created')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("data");

      expect(response.body.data.tasks).toHaveLength(2);
      // 新しい順（降順）での並び
      expect(response.body.data.tasks[0].title).toBe('2番目のタスク');
      expect(response.body.data.tasks[1].title).toBe('最初のタスク');
    });

    it('orderBy=dueDateでソートできること', async () => {
      // 期限日の異なるタスクを作成
      await request(appInstance.getApp())
        .post('/api/tasks')
        .send({ title: '期限遠いタスク', dueDate: '2025-12-31' });
      
      await request(appInstance.getApp())
        .post('/api/tasks')
        .send({ title: '期限近いタスク', dueDate: '2025-09-10' });
      
      await request(appInstance.getApp())
        .post('/api/tasks')
        .send({ title: '期限なしタスク' });

      const response = await request(appInstance.getApp())
        .get('/api/tasks?orderBy=dueDate')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("data");

      expect(response.body.data.tasks).toHaveLength(3);
      // 期限日の昇順、期限なしは最後
      expect(response.body.data.tasks[0].title).toBe('期限近いタスク');
      expect(response.body.data.tasks[1].title).toBe('期限遠いタスク');
      expect(response.body.data.tasks[2].title).toBe('期限なしタスク');
    });

    it('不正なorderBy値の場合はデフォルトソートを使用すること', async () => {
      await request(appInstance.getApp())
        .post('/api/tasks')
        .send({ title: 'テストタスク' });

      const response = await request(appInstance.getApp())
        .get('/api/tasks?orderBy=invalid')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("data");

      expect(Array.isArray(response.body.data.tasks)).toBe(true);
    });
  });

  describe('クエリパラメータ - completed', () => {
    beforeEach(async () => {
      // 完了・未完了のタスクを準備
      await request(appInstance.getApp())
        .post('/api/tasks')
        .send({ title: '未完了タスク1' });
      
      const completedTask = await request(appInstance.getApp())
        .post('/api/tasks')
        .send({ title: '完了予定タスク' });
      
      // タスクを完了状態に更新
      await request(appInstance.getApp())
        .put(`/api/tasks/${completedTask.body.id}`)
        .send({ completed: true });
    });

    it('completed=trueで完了タスクのみ取得できること', async () => {
      const response = await request(appInstance.getApp())
        .get('/api/tasks?completed=true')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("data");

      expect(Array.isArray(response.body.data.tasks)).toBe(true);
      response.body.data.tasks.forEach(task => {
        expect(task.completed).toBe(true);
      });
    });

    it('completed=falseで未完了タスクのみ取得できること', async () => {
      const response = await request(appInstance.getApp())
        .get('/api/tasks?completed=false')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("data");

      expect(Array.isArray(response.body.data.tasks)).toBe(true);
      response.body.data.tasks.forEach(task => {
        expect(task.completed).toBe(false);
      });
    });
  });

  describe('エラーハンドリング', () => {
    it('サーバーエラーの場合は500エラーを返すこと', async () => {
      // データベース接続エラーをシミュレート
      // 実装時に詳細化
    });
  });
});
