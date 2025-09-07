# QuickStart Guide: TODO管理アプリケーション

## 概要
このガイドでは、TODO管理アプリケーションの基本的な使用方法とテストシナリオを説明します。

## 前提条件
- Node.js 18+ がインストールされていること
- npm または yarn がインストールされていること
- SQLite3 がシステムにインストールされていること

## セットアップ手順

### 1. プロジェクトの初期化
```bash
# プロジェクトルートディレクトリの作成
mkdir todo-app
cd todo-app

# バックエンドとフロントエンドのディレクトリ作成
mkdir backend frontend

# 依存関係のインストール
cd backend && npm init -y
npm install express better-sqlite3 cors
npm install -D vitest @types/node

cd ../frontend && npm init -y
npm install vue@next
npm install -D vite @vitejs/plugin-vue vitest @vue/test-utils happy-dom
```

### 2. 開発サーバーの起動
```bash
# バックエンドサーバー起動 (ターミナル1)
cd backend
npm run dev  # http://localhost:3000

# フロントエンドサーバー起動 (ターミナル2)
cd frontend
npm run dev  # http://localhost:5173
```

### 3. データベースの初期化
```bash
# バックエンドディレクトリで実行
cd backend
npm run db:init  # SQLiteテーブル作成
```

## 基本的な使用フロー

### ユーザーストーリー1: タスクの作成
1. **前提条件**: アプリケーションにアクセス
2. **操作手順**:
   - ブラウザで http://localhost:5173 にアクセス
   - "新しいタスク" ボタンをクリック
   - タスク内容を入力: "プロジェクトの企画書作成"
   - 期限日を設定: "2025-09-15"
   - "作成" ボタンをクリック
3. **期待結果**: 
   - タスクがリストに表示される
   - 進捗率が0%で表示される
   - 完了状態が"未完了"で表示される

### ユーザーストーリー2: 進捗の更新
1. **前提条件**: タスクが1つ以上存在
2. **操作手順**:
   - 作成されたタスクの進捗バーをクリック
   - スライダーで進捗を50%に設定
   - "保存" ボタンをクリック
3. **期待結果**:
   - 進捗バーが50%で表示される
   - タスクの更新日時が更新される

### ユーザーストーリー3: タスクの完了
1. **前提条件**: 進行中のタスクが存在
2. **操作手順**:
   - タスクの完了チェックボックスをクリック
3. **期待結果**:
   - タスクが完了状態になる
   - 進捗率が自動的に100%になる
   - 視覚的に完了タスクとして表示される（取り消し線など）

### ユーザーストーリー4: タスクの一覧表示
1. **前提条件**: 複数のタスクが存在
2. **操作手順**:
   - アプリケーションのメイン画面を表示
   - ソート順序を"期限日順"に変更
3. **期待結果**:
   - すべてのタスクが期限日の昇順で表示される
   - 各タスクの状態と進捗が正しく表示される

## API テストシナリオ

### シナリオ1: タスク作成API
```bash
# リクエスト
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "テスト用タスク",
    "dueDate": "2025-09-15"
  }'

# 期待レスポンス (201 Created)
{
  "id": 1,
  "title": "テスト用タスク",
  "dueDate": "2025-09-15",
  "progress": 0,
  "completed": false,
  "createdAt": "2025-09-07T10:30:00.000Z",
  "updatedAt": "2025-09-07T10:30:00.000Z"
}
```

### シナリオ2: タスク一覧取得API
```bash
# リクエスト
curl http://localhost:3000/api/tasks

# 期待レスポンス (200 OK)
[
  {
    "id": 1,
    "title": "テスト用タスク",
    "dueDate": "2025-09-15",
    "progress": 0,
    "completed": false,
    "createdAt": "2025-09-07T10:30:00.000Z",
    "updatedAt": "2025-09-07T10:30:00.000Z"
  }
]
```

### シナリオ3: タスク更新API
```bash
# リクエスト
curl -X PUT http://localhost:3000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{
    "progress": 50
  }'

# 期待レスポンス (200 OK)
{
  "id": 1,
  "title": "テスト用タスク",
  "dueDate": "2025-09-15",
  "progress": 50,
  "completed": false,
  "createdAt": "2025-09-07T10:30:00.000Z",
  "updatedAt": "2025-09-07T11:00:00.000Z"
}
```

## エラーケースのテスト

### 無効なデータでのタスク作成
```bash
# 空のタイトルでリクエスト
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": ""}'

# 期待レスポンス (400 Bad Request)
{
  "error": "タイトルは必須です",
  "code": "INVALID_TITLE"
}
```

### 存在しないタスクの更新
```bash
# 存在しないIDでリクエスト
curl -X PUT http://localhost:3000/api/tasks/999 \
  -H "Content-Type: application/json" \
  -d '{"title": "更新されたタスク"}'

# 期待レスポンス (404 Not Found)
{
  "error": "タスクが見つかりません",
  "code": "TASK_NOT_FOUND"
}
```

## パフォーマンステスト

### 基本的なパフォーマンス指標
- **初期ページ読み込み**: < 2秒
- **タスク作成応答時間**: < 100ms
- **タスク一覧表示**: < 200ms (100タスクまで)
- **UI操作応答性**: < 100ms

### テスト方法
```bash
# 複数タスク作成のパフォーマンステスト
for i in {1..100}; do
  curl -X POST http://localhost:3000/api/tasks \
    -H "Content-Type: application/json" \
    -d "{\"title\": \"パフォーマンステスト用タスク $i\"}" &
done
wait

# レスポンス時間測定
time curl http://localhost:3000/api/tasks
```

## 検証チェックリスト

### 機能要件の検証
- [ ] タスクの作成ができる
- [ ] タスクに期限日を設定できる
- [ ] 進捗を0-100%で管理できる
- [ ] 完了/未完了状態を管理できる
- [ ] タスクの編集ができる
- [ ] タスクの削除ができる
- [ ] タスク一覧の表示ができる
- [ ] 進捗の更新ができる
- [ ] 完了状態の切り替えができる
- [ ] データが永続化される

### 非機能要件の検証
- [ ] UI応答性が良好 (< 100ms)
- [ ] データベースの整合性が保たれる
- [ ] エラーハンドリングが適切
- [ ] ログが構造化されている
- [ ] API仕様に準拠している

## トラブルシューティング

### よくある問題
1. **データベース接続エラー**
   - SQLiteファイルの権限を確認
   - `npm run db:init` でテーブル作成を再実行

2. **CORS エラー**
   - バックエンドのCORS設定を確認
   - フロントエンドのAPIエンドポイント設定を確認

3. **ポート競合**
   - プロセスを確認: `lsof -i :3000` `lsof -i :5173`
   - 使用中のプロセスを終了するか、ポート番号を変更
