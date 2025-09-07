import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import App from '../../src/app.js';

const app = new App().getApp();

/**
 * Integration Test: Task List Display Flow
 * 
 * ユーザーストーリー「タスクの一覧表示」の統合テスト
 * quickstart.mdのシナリオに基づく
 */

describe('Task List Display Flow - Integration Test', () => {
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
    // テスト用の複数タスクを作成
    const tasks = [
      { title: '緊急タスク', dueDate: '2025-09-08', progress: 80 },
      { title: '通常タスク', dueDate: '2025-09-15', progress: 30 },
      { title: '期限なしタスク', progress: 0 },
      { title: '期限遠いタスク', dueDate: '2025-12-31', progress: 10 }
    ];

    for (const taskData of tasks) {
      const response = await request(app)
        .post('/api/tasks')
        .send(taskData);
      
      // 進捗設定（0以外の場合）
      if (taskData.progress > 0) {
        await request(app)
          .put(`/api/tasks/${response.body.id}`)
          .send({ progress: taskData.progress });
      }
    }

    // 1つのタスクを完了状態にする
    const completedTaskResponse = await request(app)
      .post('/api/tasks')
      .send({ title: '完了済みタスク', dueDate: '2025-09-10' });
    
    await request(app)
      .put(`/api/tasks/${completedTaskResponse.body.id}`)
      .send({ completed: true });
  });

  describe('ユーザーストーリー4: タスクの一覧表示', () => {
    it('すべてのタスクが一覧表示されること', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .expect(200);

      expect(response.body.length).toBe(5); // 4つの基本タスク + 1つの完了タスク

      // 各タスクが必要な情報を含んでいることを確認
      response.body.forEach(task => {
        expect(task).toHaveProperty('id');
        expect(task).toHaveProperty('title');
        expect(task).toHaveProperty('dueDate');
        expect(task).toHaveProperty('progress');
        expect(task).toHaveProperty('completed');
        expect(task).toHaveProperty('createdAt');
        expect(task).toHaveProperty('updatedAt');

        // 進捗率が正しい範囲内であることを確認
        expect(task.progress).toBeGreaterThanOrEqual(0);
        expect(task.progress).toBeLessThanOrEqual(100);
      });
    });

    it('デフォルト（作成日順）でソートされること', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .expect(200);

      // 作成日時の降順（新しい順）であることを確認
      for (let i = 0; i < response.body.length - 1; i++) {
        const current = new Date(response.body[i].createdAt);
        const next = new Date(response.body[i + 1].createdAt);
        expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
      }
    });

    it('期限日順でソートできること', async () => {
      const response = await request(app)
        .get('/api/tasks?orderBy=dueDate')
        .expect(200);

      // 期限日順で並んでいることを確認（期限なしは最後）
      let hasNullDueDate = false;
      for (let i = 0; i < response.body.length - 1; i++) {
        const current = response.body[i];
        const next = response.body[i + 1];

        if (current.dueDate === null) {
          hasNullDueDate = true;
          // nullの後は全てnullであるべき
          for (let j = i; j < response.body.length; j++) {
            expect(response.body[j].dueDate).toBeNull();
          }
          break;
        }

        if (next.dueDate !== null && !hasNullDueDate) {
          expect(new Date(current.dueDate).getTime())
            .toBeLessThanOrEqual(new Date(next.dueDate).getTime());
        }
      }
    });

    it('各タスクの状態と進捗が正しく表示されること', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .expect(200);

      // 特定のタスクを検索して確認
      const urgentTask = response.body.find(t => t.title === '緊急タスク');
      const normalTask = response.body.find(t => t.title === '通常タスク');
      const noDeadlineTask = response.body.find(t => t.title === '期限なしタスク');
      const completedTask = response.body.find(t => t.title === '完了済みタスク');

      // 緊急タスクの確認
      expect(urgentTask).toMatchObject({
        title: '緊急タスク',
        dueDate: '2025-09-08',
        progress: 80,
        completed: false
      });

      // 通常タスクの確認
      expect(normalTask).toMatchObject({
        title: '通常タスク',
        dueDate: '2025-09-15',
        progress: 30,
        completed: false
      });

      // 期限なしタスクの確認
      expect(noDeadlineTask).toMatchObject({
        title: '期限なしタスク',
        dueDate: null,
        progress: 0,
        completed: false
      });

      // 完了済みタスクの確認
      expect(completedTask).toMatchObject({
        title: '完了済みタスク',
        progress: 100,
        completed: true
      });
    });
  });

  describe('フィルタリング機能', () => {
    it('未完了タスクのみを表示できること', async () => {
      const response = await request(app)
        .get('/api/tasks?completed=false')
        .expect(200);

      expect(response.body.length).toBe(4); // 完了済み以外
      response.body.forEach(task => {
        expect(task.completed).toBe(false);
      });
    });

    it('完了済みタスクのみを表示できること', async () => {
      const response = await request(app)
        .get('/api/tasks?completed=true')
        .expect(200);

      expect(response.body.length).toBe(1); // 完了済みタスクのみ
      response.body.forEach(task => {
        expect(task.completed).toBe(true);
        expect(task.progress).toBe(100);
      });
    });
  });

  describe('パフォーマンス要件の確認', () => {
    it('大量のタスクでも適切な応答時間で表示されること', async () => {
      // 追加で50個のタスクを作成
      const promises = [];
      for (let i = 1; i <= 50; i++) {
        promises.push(
          request(app)
            .post('/api/tasks')
            .send({ title: `パフォーマンステスト用タスク${i}` })
        );
      }
      
      await Promise.all(promises);

      // 応答時間を測定
      const startTime = Date.now();
      const response = await request(app)
        .get('/api/tasks')
        .expect(200);
      const endTime = Date.now();

      const responseTime = endTime - startTime;
      
      // 55個のタスク（5個の初期 + 50個の追加）
      expect(response.body.length).toBe(55);
      
      // 応答時間が200ms以下であること（パフォーマンス要件）
      expect(responseTime).toBeLessThan(200);
    });
  });

  describe('エラーハンドリング', () => {
    it('データベースエラー時に適切なエラーレスポンスを返すこと', async () => {
      // この部分は実装時にデータベース接続エラーをシミュレート
      // 現在は基本的なテストのみ
    });

    it('不正なクエリパラメータでもエラーにならないこと', async () => {
      const response = await request(app)
        .get('/api/tasks?invalidParam=value&orderBy=invalid&completed=invalid')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('空の状態の処理', () => {
    it('タスクが存在しない場合は空の配列を返すこと', async () => {
      // 全タスクを削除
      const allTasks = await request(app)
        .get('/api/tasks')
        .expect(200);

      for (const task of allTasks.body) {
        await request(app)
          .delete(`/api/tasks/${task.id}`)
          .expect(204);
      }

      // 空の一覧を確認
      const response = await request(app)
        .get('/api/tasks')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('日付表示フォーマット', () => {
    it('日付がISO 8601形式で返されること', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .expect(200);

      response.body.forEach(task => {
        if (task.dueDate !== null) {
          // YYYY-MM-DD形式であることを確認
          expect(task.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          expect(new Date(task.dueDate)).toBeInstanceOf(Date);
        }

        // createdAtとupdatedAtもISO形式であることを確認
        expect(task.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        expect(task.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      });
    });
  });
});
