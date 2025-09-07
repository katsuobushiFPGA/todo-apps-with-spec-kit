import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import App from '../../src/app.js';

/**
 * Contract Test: POST /api/tasks
 * 
 * OpenAPI契約に基づいたタスク作成エンドポイントのテスト
 * このテストは実装前に作成され、最初は失敗しなければならない
 */

describe('POST /api/tasks - Contract Test', () => {
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

  describe('正常なリクエスト', () => {
    it('タスク内容のみでタスクを作成できること', async () => {
      const taskData = {
        title: 'テスト用タスク'
      };

      const response = await request(appInstance.getApp())
        .post('/api/tasks')
        .send(taskData)
        .expect('Content-Type', /json/)
        .expect(201);

      // レスポンススキーマの検証
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('title', taskData.title);
      expect(response.body.data).toHaveProperty('dueDate', null);
      expect(response.body.data).toHaveProperty('progress', 0);
      expect(response.body.data).toHaveProperty('completed', false);
      expect(response.body.data).toHaveProperty('createdAt');
      expect(response.body.data).toHaveProperty('updatedAt');

      // 型の検証
      expect(typeof response.body.data.id).toBe('number');
      expect(typeof response.body.data.title).toBe('string');
      expect(typeof response.body.data.progress).toBe('number');
      expect(typeof response.body.data.completed).toBe('boolean');
      expect(typeof response.body.data.createdAt).toBe('string');
      expect(typeof response.body.data.updatedAt).toBe('string');
    });

    it('タスク内容と期限日でタスクを作成できること', async () => {
      const taskData = {
        title: 'プロジェクトの企画書作成',
        dueDate: '2025-09-15'
      };

      const response = await request(appInstance.getApp())
        .post('/api/tasks')
        .send(taskData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.data.title).toBe(taskData.title);
      expect(response.body.data.dueDate).toBe(taskData.dueDate);
      expect(response.body.data.progress).toBe(0);
      expect(response.body.data.completed).toBe(false);
    });
  });

  describe('異常なリクエスト', () => {
    it('タイトルが空の場合は400エラーを返すこと', async () => {
      const taskData = {
        title: ''
      };

      const response = await request(appInstance.getApp())
        .post('/api/tasks')
        .send(taskData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('type');
    });

    it('タイトルが500文字を超える場合は400エラーを返すこと', async () => {
      const taskData = {
        title: 'あ'.repeat(501) // 501文字
      };

      const response = await request(appInstance.getApp())
        .post('/api/tasks')
        .send(taskData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('type');
    });

    it('タイトルが未指定の場合は400エラーを返すこと', async () => {
      const taskData = {
        dueDate: '2025-09-15'
      };

      const response = await request(appInstance.getApp())
        .post('/api/tasks')
        .send(taskData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('details');
      expect(response.body.error.details).toBeInstanceOf(Array);
      expect(response.body.error.details.some(detail => detail.includes('タイトル'))).toBe(true);
    });

    it('不正な日付形式の場合は400エラーを返すこと', async () => {
      const taskData = {
        title: 'テストタスク',
        dueDate: '無効な日付'
      };

      const response = await request(appInstance.getApp())
        .post('/api/tasks')
        .send(taskData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('details');
      expect(response.body.error.details).toBeInstanceOf(Array);
      expect(response.body.error.details.some(detail => detail.includes('日付') || detail.includes('期限'))).toBe(true);
    });
  });

  describe('サーバーエラー処理', () => {
    it('500エラーの場合は適切なレスポンスを返すこと', async () => {
      // この部分は実装後に詳細なテストを追加
      // データベース接続エラーなどをシミュレート
    });
  });
});
