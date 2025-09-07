import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import App from '../../src/app.js';


/**
 * Integration Test: Task Progress Update Flow
 * 
 * ユーザーストーリー「進捗の更新」の統合テスト
 * quickstart.mdのシナリオに基づく
 */

describe('Task Progress Update Flow - Integration Test', () => {
  let server;
  let testTaskId;
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
    // テスト用タスクを作成
    const response = await request(appInstance.getApp())
      .post('/api/tasks')
      .send({
        title: '進捗更新テスト用タスク',
        dueDate: '2025-09-15'
      });
    
    testTaskId = response.body.id;
  });

  describe('ユーザーストーリー2: 進捗の更新', () => {
    it('タスクの進捗を0%から50%に更新できること', async () => {
      // 1. 初期状態の確認（進捗0%、未完了）
      const initialResponse = await request(appInstance.getApp())
        .get(`/api/tasks/${testTaskId}`)
        .expect(200);

      expect(initialResponse.body).toMatchObject({
        progress: 0,
        completed: false
      });

      // 2. 進捗を50%に更新
      const updateResponse = await request(appInstance.getApp())
        .put(`/api/tasks/${testTaskId}`)
        .send({ progress: 50 })
        .expect(200);

      // 3. 更新結果の確認
      expect(updateResponse.body).toMatchObject({
        id: testTaskId,
        progress: 50,
        completed: false // 100%ではないので未完了のまま
      });

      // 4. updatedAtが更新されていることを確認
      expect(updateResponse.body.updatedAt).not.toBe(initialResponse.body.updatedAt);

      // 5. 一覧表示でも更新された進捗が反映されることを確認
      const listResponse = await request(appInstance.getApp())
        .get('/api/tasks')
        .expect(200);

      const updatedTask = listResponse.body.find(task => task.id === testTaskId);
      expect(updatedTask.progress).toBe(50);
    });

    it('進捗を段階的に更新できること', async () => {
      const progressSteps = [10, 25, 50, 75, 90];

      for (const progress of progressSteps) {
        const response = await request(appInstance.getApp())
          .put(`/api/tasks/${testTaskId}`)
          .send({ progress })
          .expect(200);

        expect(response.body.progress).toBe(progress);
        expect(response.body.completed).toBe(false); // 100%未満は未完了
      }
    });

    it('進捗を100%にすると自動的に完了状態になること', async () => {
      // 1. 進捗を100%に設定
      const updateResponse = await request(appInstance.getApp())
        .put(`/api/tasks/${testTaskId}`)
        .send({ progress: 100 })
        .expect(200);

      // 2. 進捗100%かつ完了状態になることを確認
      expect(updateResponse.body).toMatchObject({
        progress: 100,
        completed: true
      });

      // 3. データベースでも正しく更新されていることを確認
      const getResponse = await request(appInstance.getApp())
        .get(`/api/tasks/${testTaskId}`)
        .expect(200);

      expect(getResponse.body).toMatchObject({
        progress: 100,
        completed: true
      });
    });

    it('進捗を減らすこともできること', async () => {
      // 1. 進捗を50%に設定
      await request(appInstance.getApp())
        .put(`/api/tasks/${testTaskId}`)
        .send({ progress: 50 })
        .expect(200);

      // 2. 進捗を30%に減らす
      const updateResponse = await request(appInstance.getApp())
        .put(`/api/tasks/${testTaskId}`)
        .send({ progress: 30 })
        .expect(200);

      expect(updateResponse.body.progress).toBe(30);
      expect(updateResponse.body.completed).toBe(false);
    });
  });

  describe('無効な進捗値の処理', () => {
    it('負の進捗値は拒否されること', async () => {
      const response = await request(appInstance.getApp())
        .put(`/api/tasks/${testTaskId}`)
        .send({ progress: -10 })
        .expect(400);

      expect(response.body).toHaveProperty('error');

      // 元の進捗値が変更されていないことを確認
      const checkResponse = await request(appInstance.getApp())
        .get(`/api/tasks/${testTaskId}`)
        .expect(200);

      expect(checkResponse.body.progress).toBe(0);
    });

    it('100を超える進捗値は拒否されること', async () => {
      const response = await request(appInstance.getApp())
        .put(`/api/tasks/${testTaskId}`)
        .send({ progress: 150 })
        .expect(400);

      expect(response.body).toHaveProperty('error');

      // 元の進捗値が変更されていないことを確認
      const checkResponse = await request(appInstance.getApp())
        .get(`/api/tasks/${testTaskId}`)
        .expect(200);

      expect(checkResponse.body.progress).toBe(0);
    });

    it('文字列の進捗値は拒否されること', async () => {
      const response = await request(appInstance.getApp())
        .put(`/api/tasks/${testTaskId}`)
        .send({ progress: 'invalid' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('複数フィールド同時更新', () => {
    it('進捗と他のフィールドを同時に更新できること', async () => {
      const updateData = {
        title: '更新されたタイトル',
        progress: 75,
        dueDate: '2025-10-31'
      };

      const response = await request(appInstance.getApp())
        .put(`/api/tasks/${testTaskId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject(updateData);
      expect(response.body.completed).toBe(false); // 75%なので未完了
    });
  });

  describe('進捗更新の履歴', () => {
    it('updatedAtフィールドが進捗更新のたびに更新されること', async () => {
      // 初期のupdatedAt
      const initial = await request(appInstance.getApp())
        .get(`/api/tasks/${testTaskId}`)
        .expect(200);

      const initialUpdatedAt = initial.body.updatedAt;

      // 少し待ってから更新
      await new Promise(resolve => setTimeout(resolve, 100));

      // 進捗更新
      const updated = await request(appInstance.getApp())
        .put(`/api/tasks/${testTaskId}`)
        .send({ progress: 25 })
        .expect(200);

      // updatedAtが変更されていることを確認
      expect(updated.body.updatedAt).not.toBe(initialUpdatedAt);
      expect(new Date(updated.body.updatedAt).getTime())
        .toBeGreaterThan(new Date(initialUpdatedAt).getTime());
    });
  });
});
