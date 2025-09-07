import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import App from '../../src/app.js';


/**
 * Integration Test: Task Completion Flow
 * 
 * ユーザーストーリー「タスクの完了」の統合テスト
 * quickstart.mdのシナリオに基づく
 */

describe('Task Completion Flow - Integration Test', () => {
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
    // 進行中のタスクを作成
    const response = await request(appInstance.getApp())
      .post('/api/tasks')
      .send({
        title: '完了テスト用タスク',
        dueDate: '2025-09-15'
      });
    
    testTaskId = response.body.id;

    // 進捗を50%に設定（進行中状態）
    await request(appInstance.getApp())
      .put(`/api/tasks/${testTaskId}`)
      .send({ progress: 50 });
  });

  describe('ユーザーストーリー3: タスクの完了', () => {
    it('進行中のタスクを完了状態にできること', async () => {
      // 1. 完了前の状態確認
      const beforeResponse = await request(appInstance.getApp())
        .get(`/api/tasks/${testTaskId}`)
        .expect(200);

      expect(beforeResponse.body).toMatchObject({
        progress: 50,
        completed: false
      });

      // 2. 完了状態に変更
      const updateResponse = await request(appInstance.getApp())
        .put(`/api/tasks/${testTaskId}`)
        .send({ completed: true })
        .expect(200);

      // 3. 完了状態の確認と進捗率の自動設定確認
      expect(updateResponse.body).toMatchObject({
        completed: true,
        progress: 100 // 自動的に100%に設定される
      });

      // 4. データベースでも正しく更新されていることを確認
      const afterResponse = await request(appInstance.getApp())
        .get(`/api/tasks/${testTaskId}`)
        .expect(200);

      expect(afterResponse.body).toMatchObject({
        completed: true,
        progress: 100
      });
    });

    it('完了したタスクを未完了に戻すことができること', async () => {
      // 1. タスクを完了状態にする
      await request(appInstance.getApp())
        .put(`/api/tasks/${testTaskId}`)
        .send({ completed: true })
        .expect(200);

      // 2. 未完了に戻す
      const updateResponse = await request(appInstance.getApp())
        .put(`/api/tasks/${testTaskId}`)
        .send({ completed: false })
        .expect(200);

      expect(updateResponse.body.completed).toBe(false);
      // 進捗率は100%のまま維持される（仕様による）
      expect(updateResponse.body.progress).toBe(100);
    });

    it('進捗率100%で自動完了することを確認', async () => {
      // 1. 進捗率を100%に設定
      const updateResponse = await request(appInstance.getApp())
        .put(`/api/tasks/${testTaskId}`)
        .send({ progress: 100 })
        .expect(200);

      // 2. 自動的に完了状態になることを確認
      expect(updateResponse.body).toMatchObject({
        progress: 100,
        completed: true
      });
    });

    it('複数タスクの完了状態を管理できること', async () => {
      // 追加のタスクを作成
      const task2Response = await request(appInstance.getApp())
        .post('/api/tasks')
        .send({ title: '2番目のタスク' });
      
      const task3Response = await request(appInstance.getApp())
        .post('/api/tasks')
        .send({ title: '3番目のタスク' });

      const task2Id = task2Response.body.id;
      const task3Id = task3Response.body.id;

      // 最初のタスクを完了
      await request(appInstance.getApp())
        .put(`/api/tasks/${testTaskId}`)
        .send({ completed: true })
        .expect(200);

      // 3番目のタスクを完了
      await request(appInstance.getApp())
        .put(`/api/tasks/${task3Id}`)
        .send({ completed: true })
        .expect(200);

      // 全タスクの状態を確認
      const listResponse = await request(appInstance.getApp())
        .get('/api/tasks')
        .expect(200);

      const tasks = listResponse.body;
      const task1 = tasks.find(t => t.id === testTaskId);
      const task2 = tasks.find(t => t.id === task2Id);
      const task3 = tasks.find(t => t.id === task3Id);

      expect(task1.completed).toBe(true);
      expect(task2.completed).toBe(false);
      expect(task3.completed).toBe(true);
    });
  });

  describe('完了状態でのフィルタリング', () => {
    beforeEach(async () => {
      // 複数のタスクを作成し、一部を完了状態にする
      const tasks = [];
      
      for (let i = 1; i <= 3; i++) {
        const response = await request(appInstance.getApp())
          .post('/api/tasks')
          .send({ title: `フィルタテスト用タスク${i}` });
        tasks.push(response.body);
      }

      // 1番目と3番目のタスクを完了
      await request(appInstance.getApp())
        .put(`/api/tasks/${tasks[0].id}`)
        .send({ completed: true });
      
      await request(appInstance.getApp())
        .put(`/api/tasks/${tasks[2].id}`)
        .send({ completed: true });
    });

    it('完了タスクのみをフィルタして取得できること', async () => {
      const response = await request(appInstance.getApp())
        .get('/api/tasks?completed=true')
        .expect(200);

      expect(response.body.length).toBeGreaterThanOrEqual(2);
      response.body.forEach(task => {
        expect(task.completed).toBe(true);
      });
    });

    it('未完了タスクのみをフィルタして取得できること', async () => {
      const response = await request(appInstance.getApp())
        .get('/api/tasks?completed=false')
        .expect(200);

      expect(response.body.length).toBeGreaterThanOrEqual(1);
      response.body.forEach(task => {
        expect(task.completed).toBe(false);
      });
    });
  });

  describe('完了日時の記録', () => {
    it('完了時にupdatedAtが更新されること', async () => {
      const beforeResponse = await request(appInstance.getApp())
        .get(`/api/tasks/${testTaskId}`)
        .expect(200);

      const beforeUpdatedAt = beforeResponse.body.updatedAt;

      // 少し待ってから完了状態に変更
      await new Promise(resolve => setTimeout(resolve, 100));

      const updateResponse = await request(appInstance.getApp())
        .put(`/api/tasks/${testTaskId}`)
        .send({ completed: true })
        .expect(200);

      expect(updateResponse.body.updatedAt).not.toBe(beforeUpdatedAt);
      expect(new Date(updateResponse.body.updatedAt).getTime())
        .toBeGreaterThan(new Date(beforeUpdatedAt).getTime());
    });
  });

  describe('完了状態での視覚的表示（今後のフロントエンド用）', () => {
    it('完了タスクには適切な完了フラグが設定されること', async () => {
      await request(appInstance.getApp())
        .put(`/api/tasks/${testTaskId}`)
        .send({ completed: true })
        .expect(200);

      const response = await request(appInstance.getApp())
        .get(`/api/tasks/${testTaskId}`)
        .expect(200);

      // フロントエンドが完了状態を判断するために必要な情報
      expect(response.body).toMatchObject({
        completed: true,
        progress: 100
      });
    });
  });
});
