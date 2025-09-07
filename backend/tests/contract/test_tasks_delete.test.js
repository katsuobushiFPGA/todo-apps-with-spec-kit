import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import App from '../../src/app.js';

/**
 * Contract Test: DELETE /api/tasks/:id
 * 
 * OpenAPI契約に基づいたタスク削除エンドポイントのテスト
 * このテストは実装前に作成され、最初は失敗しなければならない
 */

describe('DELETE /api/tasks/:id - Contract Test', () => {
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
        title: '削除対象テストタスク',
        dueDate: '2025-09-15'
      });
    
    testTaskId = response.body.id;
  });

  describe('正常な削除リクエスト', () => {
    it('既存のタスクを削除できること', async () => {
      const response = await request(appInstance.getApp())
        .delete(`/api/tasks/${testTaskId}`)
        .expect(204);

      // 204 No Contentではレスポンスボディは空であること
      expect(response.body).toEqual({});
      expect(response.text).toBe('');
    });

    it('削除後にタスクが存在しないこと', async () => {
      // タスクを削除
      await request(appInstance.getApp())
        .delete(`/api/tasks/${testTaskId}`)
        .expect(204);

      // 削除されたタスクにアクセスすると404が返ること
      await request(appInstance.getApp())
        .get(`/api/tasks/${testTaskId}`)
        .expect(404);
    });

    it('削除後にタスク一覧から除外されること', async () => {
      // 削除前のタスク数を確認
      const beforeResponse = await request(appInstance.getApp())
        .get('/api/tasks')
        .expect(200);
      
      const beforeCount = beforeResponse.body.length;

      // タスクを削除
      await request(appInstance.getApp())
        .delete(`/api/tasks/${testTaskId}`)
        .expect(204);

      // 削除後のタスク数を確認
      const afterResponse = await request(appInstance.getApp())
        .get('/api/tasks')
        .expect(200);

      expect(afterResponse.body.length).toBe(beforeCount - 1);
      
      // 削除されたタスクが一覧に含まれていないこと
      const deletedTask = afterResponse.body.find(task => task.id === testTaskId);
      expect(deletedTask).toBeUndefined();
    });

    it('複数のタスクが存在する場合、指定したタスクのみ削除されること', async () => {
      // 追加のタスクを作成
      const otherTaskResponse = await request(appInstance.getApp())
        .post('/api/tasks')
        .send({ title: '削除されないタスク' });
      
      const otherTaskId = otherTaskResponse.body.id;

      // 最初のタスクを削除
      await request(appInstance.getApp())
        .delete(`/api/tasks/${testTaskId}`)
        .expect(204);

      // 他のタスクは残っていること
      const remainingTaskResponse = await request(appInstance.getApp())
        .get(`/api/tasks/${otherTaskId}`)
        .expect(200);

      expect(remainingTaskResponse.body.id).toBe(otherTaskId);
      expect(remainingTaskResponse.body.title).toBe('削除されないタスク');
    });
  });

  describe('異常なリクエスト', () => {
    it('存在しないタスクIDの場合は404エラーを返すこと', async () => {
      const nonExistentId = 99999;

      const response = await request(appInstance.getApp())
        .delete(`/api/tasks/${nonExistentId}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code', 'TASK_NOT_FOUND');
      expect(response.body.error).toMatch(/タスクが見つかりません/);
    });

    it('不正なタスクIDの場合は400エラーを返すこと', async () => {
      const invalidId = 'invalid-id';

      const response = await request(appInstance.getApp())
        .delete(`/api/tasks/${invalidId}`)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/invalid/i);
    });

    it('負の数のタスクIDの場合は400エラーを返すこと', async () => {
      const negativeId = -1;

      const response = await request(appInstance.getApp())
        .delete(`/api/tasks/${negativeId}`)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('ゼロのタスクIDの場合は400エラーを返すこと', async () => {
      const zeroId = 0;

      const response = await request(appInstance.getApp())
        .delete(`/api/tasks/${zeroId}`)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('冪等性の検証', () => {
    it('同じタスクを2回削除しても2回目は404エラーを返すこと', async () => {
      // 1回目の削除（成功）
      await request(appInstance.getApp())
        .delete(`/api/tasks/${testTaskId}`)
        .expect(204);

      // 2回目の削除（404エラー）
      const response = await request(appInstance.getApp())
        .delete(`/api/tasks/${testTaskId}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code', 'TASK_NOT_FOUND');
    });
  });

  describe('レスポンスヘッダー検証', () => {
    it('成功時のレスポンスヘッダーが正しいこと', async () => {
      const response = await request(appInstance.getApp())
        .delete(`/api/tasks/${testTaskId}`)
        .expect(204);

      // Content-Lengthは0であること
      expect(response.headers['content-length']).toBe('0');
    });

    it('エラー時のレスポンスヘッダーが正しいこと', async () => {
      const response = await request(appInstance.getApp())
        .delete('/api/tasks/99999')
        .expect(404);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('データ整合性の検証', () => {
    it('削除されたタスクのIDは再利用されないこと', async () => {
      const deletedId = testTaskId;

      // タスクを削除
      await request(appInstance.getApp())
        .delete(`/api/tasks/${deletedId}`)
        .expect(204);

      // 新しいタスクを作成
      const newTaskResponse = await request(appInstance.getApp())
        .post('/api/tasks')
        .send({ title: '新しいタスク' })
        .expect(201);

      // 新しいタスクのIDは削除されたIDと異なること
      expect(newTaskResponse.body.id).not.toBe(deletedId);
    });
  });
});
