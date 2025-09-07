import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import App from '../../src/app.js';

const app = new App().getApp();

/**
 * Contract Test: PUT /api/tasks/:id
 * 
 * OpenAPI契約に基づいたタスク更新エンドポイントのテスト
 * このテストは実装前に作成され、最初は失敗しなければならない
 */

describe('PUT /api/tasks/:id - Contract Test', () => {
  let server;
  let testTaskId;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    server = app.listen(0);
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  beforeEach(async () => {
    // テスト用タスクを作成
    const response = await request(app)
      .post('/api/tasks')
      .send({
        title: 'テスト用タスク',
        dueDate: '2025-09-15'
      });
    
    testTaskId = response.body.id;
  });

  describe('正常な更新リクエスト', () => {
    it('タスクタイトルを更新できること', async () => {
      const updateData = {
        title: '更新されたタスクタイトル'
      };

      const response = await request(app)
        .put(`/api/tasks/${testTaskId}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.id).toBe(testTaskId);
      expect(response.body.title).toBe(updateData.title);
      expect(response.body.dueDate).toBe('2025-09-15'); // 他のフィールドは変更されない
      
      // updatedAtが更新されていることを確認
      expect(response.body.updatedAt).toBeDefined();
    });

    it('期限日を更新できること', async () => {
      const updateData = {
        dueDate: '2025-12-31'
      };

      const response = await request(app)
        .put(`/api/tasks/${testTaskId}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.id).toBe(testTaskId);
      expect(response.body.dueDate).toBe(updateData.dueDate);
      expect(response.body.title).toBe('テスト用タスク'); // 他のフィールドは変更されない
    });

    it('期限日をnullに設定できること', async () => {
      const updateData = {
        dueDate: null
      };

      const response = await request(app)
        .put(`/api/tasks/${testTaskId}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.dueDate).toBeNull();
    });

    it('進捗率を更新できること', async () => {
      const updateData = {
        progress: 75
      };

      const response = await request(app)
        .put(`/api/tasks/${testTaskId}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.progress).toBe(75);
      expect(response.body.completed).toBe(false); // 100%でない限り未完了
    });

    it('進捗率を100%にすると自動的に完了状態になること', async () => {
      const updateData = {
        progress: 100
      };

      const response = await request(app)
        .put(`/api/tasks/${testTaskId}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.progress).toBe(100);
      expect(response.body.completed).toBe(true); // 自動的に完了状態
    });

    it('完了状態をtrueにすると自動的に進捗率が100%になること', async () => {
      const updateData = {
        completed: true
      };

      const response = await request(app)
        .put(`/api/tasks/${testTaskId}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.completed).toBe(true);
      expect(response.body.progress).toBe(100); // 自動的に100%
    });

    it('複数フィールドを同時に更新できること', async () => {
      const updateData = {
        title: '完全に更新されたタスク',
        dueDate: '2025-10-31',
        progress: 50
      };

      const response = await request(app)
        .put(`/api/tasks/${testTaskId}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.title).toBe(updateData.title);
      expect(response.body.dueDate).toBe(updateData.dueDate);
      expect(response.body.progress).toBe(updateData.progress);
    });
  });

  describe('異常なリクエスト', () => {
    it('存在しないタスクIDの場合は404エラーを返すこと', async () => {
      const nonExistentId = 99999;
      const updateData = {
        title: '存在しないタスクの更新'
      };

      const response = await request(app)
        .put(`/api/tasks/${nonExistentId}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code', 'TASK_NOT_FOUND');
    });

    it('不正なタスクIDの場合は400エラーを返すこと', async () => {
      const invalidId = 'invalid-id';
      const updateData = {
        title: '不正IDでの更新'
      };

      const response = await request(app)
        .put(`/api/tasks/${invalidId}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('空のタイトルの場合は400エラーを返すこと', async () => {
      const updateData = {
        title: ''
      };

      const response = await request(app)
        .put(`/api/tasks/${testTaskId}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/title/i);
    });

    it('500文字を超えるタイトルの場合は400エラーを返すこと', async () => {
      const updateData = {
        title: 'あ'.repeat(501)
      };

      const response = await request(app)
        .put(`/api/tasks/${testTaskId}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('不正な進捗値の場合は400エラーを返すこと', async () => {
      const invalidProgresses = [-1, 101, 'invalid'];

      for (const progress of invalidProgresses) {
        const updateData = { progress };

        const response = await request(app)
          .put(`/api/tasks/${testTaskId}`)
          .send(updateData)
          .expect('Content-Type', /json/)
          .expect(400);

        expect(response.body).toHaveProperty('error');
      }
    });

    it('不正な日付形式の場合は400エラーを返すこと', async () => {
      const updateData = {
        dueDate: '無効な日付'
      };

      const response = await request(app)
        .put(`/api/tasks/${testTaskId}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/date/i);
    });
  });

  describe('レスポンススキーマ検証', () => {
    it('更新後のレスポンスが正しいスキーマを持つこと', async () => {
      const updateData = {
        title: 'スキーマ検証用タスク',
        progress: 30
      };

      const response = await request(app)
        .put(`/api/tasks/${testTaskId}`)
        .send(updateData)
        .expect(200);

      // 必須フィールドの存在確認
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('dueDate');
      expect(response.body).toHaveProperty('progress');
      expect(response.body).toHaveProperty('completed');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');

      // 型の検証
      expect(typeof response.body.id).toBe('number');
      expect(typeof response.body.title).toBe('string');
      expect(typeof response.body.progress).toBe('number');
      expect(typeof response.body.completed).toBe('boolean');
      expect(typeof response.body.createdAt).toBe('string');
      expect(typeof response.body.updatedAt).toBe('string');
    });
  });
});
