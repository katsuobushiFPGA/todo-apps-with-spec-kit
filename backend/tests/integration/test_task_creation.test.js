import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import App from '../../src/app.js';

const app = new App().getApp();

/**
 * Integration Test: Task Creation Flow
 * 
 * ユーザーストーリー「タスクの作成」の統合テスト
 * quickstart.mdのシナリオに基づく
 */

describe('Task Creation Flow - Integration Test', () => {
  let server;

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
    // テスト前にデータベースをクリーンアップ
  });

  describe('ユーザーストーリー1: タスクの作成', () => {
    it('新しいタスクを作成してリストに表示されること', async () => {
      // 1. 初期状態：空のタスク一覧
      const initialResponse = await request(app)
        .get('/api/tasks')
        .expect(200);
      
      expect(initialResponse.body).toHaveLength(0);

      // 2. タスクを作成
      const taskData = {
        title: 'プロジェクトの企画書作成',
        dueDate: '2025-09-15'
      };

      const createResponse = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(201);

      // 3. 作成されたタスクの検証
      expect(createResponse.body).toMatchObject({
        title: taskData.title,
        dueDate: taskData.dueDate,
        progress: 0,
        completed: false
      });

      const taskId = createResponse.body.id;
      expect(typeof taskId).toBe('number');

      // 4. タスク一覧に表示されることを確認
      const listResponse = await request(app)
        .get('/api/tasks')
        .expect(200);

      expect(listResponse.body).toHaveLength(1);
      expect(listResponse.body[0]).toMatchObject({
        id: taskId,
        title: taskData.title,
        dueDate: taskData.dueDate,
        progress: 0,
        completed: false
      });

      // 5. 作成日時と更新日時が設定されていることを確認
      expect(createResponse.body.createdAt).toBeDefined();
      expect(createResponse.body.updatedAt).toBeDefined();
      expect(new Date(createResponse.body.createdAt)).toBeInstanceOf(Date);
      expect(new Date(createResponse.body.updatedAt)).toBeInstanceOf(Date);
    });

    it('期限日なしでタスクを作成できること', async () => {
      const taskData = {
        title: 'シンプルなタスク'
      };

      const createResponse = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(201);

      expect(createResponse.body).toMatchObject({
        title: taskData.title,
        dueDate: null,
        progress: 0,
        completed: false
      });
    });

    it('複数のタスクを作成して適切に一覧表示されること', async () => {
      const tasks = [
        { title: '1番目のタスク', dueDate: '2025-09-10' },
        { title: '2番目のタスク', dueDate: '2025-09-15' },
        { title: '3番目のタスク' } // 期限なし
      ];

      const createdTasks = [];
      
      // 複数タスクを順次作成
      for (const taskData of tasks) {
        const response = await request(app)
          .post('/api/tasks')
          .send(taskData)
          .expect(201);
        
        createdTasks.push(response.body);
      }

      // 一覧取得して全てのタスクが表示されることを確認
      const listResponse = await request(app)
        .get('/api/tasks')
        .expect(200);

      expect(listResponse.body).toHaveLength(3);

      // 作成順序で並んでいること（新しい順）
      const titles = listResponse.body.map(task => task.title);
      expect(titles).toEqual(['3番目のタスク', '2番目のタスク', '1番目のタスク']);
    });
  });

  describe('バリデーションエラーのフロー', () => {
    it('不正なタスクデータでエラーレスポンスが返されること', async () => {
      const invalidTasks = [
        { title: '' }, // 空のタイトル
        { title: 'あ'.repeat(501) }, // 長すぎるタイトル
        { dueDate: '2025-09-15' }, // タイトルなし
        { title: 'テスト', dueDate: '無効な日付' } // 不正な日付
      ];

      for (const invalidTask of invalidTasks) {
        const response = await request(app)
          .post('/api/tasks')
          .send(invalidTask)
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body).toHaveProperty('code');
      }

      // エラーが発生してもタスクは作成されていないことを確認
      const listResponse = await request(app)
        .get('/api/tasks')
        .expect(200);

      expect(listResponse.body).toHaveLength(0);
    });
  });

  describe('日付処理のフロー', () => {
    it('過去の日付でもタスクを作成できること', async () => {
      const taskData = {
        title: '過去の期限のタスク',
        dueDate: '2020-01-01'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(201);

      expect(response.body.dueDate).toBe(taskData.dueDate);
    });

    it('未来の日付でタスクを作成できること', async () => {
      const taskData = {
        title: '未来の期限のタスク',
        dueDate: '2030-12-31'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(201);

      expect(response.body.dueDate).toBe(taskData.dueDate);
    });
  });
});
