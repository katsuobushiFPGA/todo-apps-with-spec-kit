# TODO アプリケーション

Vue.js + Node.js で構築されたモダンなタスク管理アプリケーションです。

## 🌟 特徴

- **モダンなUI/UX**: Vue 3 + Vite による高速でレスポンシブなインターフェース
- **ダークモード対応**: ライト/ダークテーマの切り替え可能
- **進捗管理**: タスクごとの進捗率をスライダーで視覚的に管理
- **期限管理**: 期限日の設定と残り日数の表示
- **柔軟なソート**: 作成日・期限日の昇順/降順でタスクを整理
- **フィルタリング**: 完了/未完了でタスクをフィルタ
- **リアルタイム通知**: 操作結果をトースト通知で確認
- **レスポンシブデザイン**: デスクトップ・モバイル両対応

## 🛠️ 技術スタック

### フロントエンド
- **Vue.js 3**: Composition API使用
- **Vite**: 高速ビルドツール
- **CSS Variables**: テーマシステム
- **ES6+**: モダンJavaScript

### バックエンド
- **Node.js 18+**: サーバーサイドランタイム
- **Express.js 5.x**: Webアプリケーションフレームワーク
- **SQLite**: 軽量データベース（better-sqlite3）
- **RESTful API**: 標準的なAPI設計

## 📦 インストールと起動

### 前提条件
- Node.js 18以上
- npm または yarn

### 1. プロジェクトのクローン
```bash
git clone https://github.com/katsuobushiFPGA/todo-apps-with-spec-kit.git
cd todo-apps-with-spec-kit/todo-apps2
```

### 2. 依存関係のインストール

#### バックエンド
```bash
cd backend
npm install
```

#### フロントエンド
```bash
cd ../frontend
npm install
```

### 3. アプリケーションの起動

#### バックエンドサーバー（ターミナル1）
```bash
cd backend
npm start
```
サーバーは http://localhost:3001 で起動します。

#### フロントエンドサーバー（ターミナル2）
```bash
cd frontend
npm run dev
```
アプリケーションは http://localhost:3000 で起動します。

## 🎯 使用方法

### 基本操作

1. **タスクの作成**
   - 上部の「新しいタスクを追加」ボタンをクリック
   - タイトルと期限日（オプション）、進捗率を設定
   - 「作成」ボタンで保存

2. **タスクの編集**
   - タスクアイテムの編集ボタン（鉛筆アイコン）をクリック
   - タイトル、期限日、進捗率を修正
   - 「保存」ボタンで更新

3. **進捗の更新**
   - タスクアイテム内の進捗バーをクリック
   - または編集モードでスライダーを操作

4. **タスクの完了**
   - タスク左側のチェックボックスをクリック
   - 完了したタスクは取り消し線が表示されます

5. **タスクの削除**
   - タスクアイテムの削除ボタン（ゴミ箱アイコン）をクリック
   - 確認ダイアログで「OK」を選択

### 便利な機能

#### ソート機能
- **作成日順（新しい順）**: 最新のタスクを上に表示
- **作成日順（古い順）**: 古いタスクを上に表示  
- **期限日順（近い順）**: 期限が迫ったタスクを優先表示
- **期限日順（遠い順）**: 長期的なタスクを上に表示

#### フィルタ機能
- **すべて**: 全タスクを表示
- **未完了**: 未完了のタスクのみ表示
- **完了済み**: 完了したタスクのみ表示

#### ダークモード
- 右上のトグルボタンでライト/ダークテーマを切り替え
- ユーザーの好みに応じて自動的に保存

#### 期限日表示
- 期限日の横に残り日数を表示
- 期限切れ: 赤色で「○日遅れ」
- 今日期限: 黄色で「今日まで」
- 近日期限: オレンジ色で「○日後」

## 📊 プロジェクト構成

```
todo-apps2/
├── backend/                 # バックエンドアプリケーション
│   ├── src/
│   │   ├── app.js          # Expressアプリケーション設定
│   │   ├── routes/         # APIルート定義
│   │   ├── services/       # ビジネスロジック
│   │   ├── middleware/     # バリデーション等
│   │   └── models/         # データモデル
│   ├── data/               # SQLiteデータベース
│   ├── tests/              # テストファイル
│   └── package.json
├── frontend/               # フロントエンドアプリケーション
│   ├── src/
│   │   ├── components/     # Vueコンポーネント
│   │   ├── services/       # API通信レイヤー
│   │   └── App.vue         # メインアプリケーション
│   ├── public/             # 静的ファイル
│   ├── index.html          # エントリーポイント
│   └── package.json
└── README.md               # このファイル
```

## 🧪 テスト

### バックエンドテスト
```bash
cd backend
npm test
```

### フロントエンドテスト
```bash
cd frontend
npm run test
```

## 🚀 本番デプロイ

### フロントエンドビルド
```bash
cd frontend
npm run build
```

ビルド成果物は `frontend/dist/` に生成されます。

### 環境変数設定
バックエンドの環境変数を設定：

```bash
# .env ファイルを作成
NODE_ENV=production
PORT=3001
DATABASE_PATH=./data/todos.db
```

## 🤝 開発に参加

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチをプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📝 API仕様

### エンドポイント一覧

#### タスク管理
- `GET /api/tasks` - タスク一覧取得
- `POST /api/tasks` - 新しいタスク作成
- `PUT /api/tasks/:id` - タスク更新
- `DELETE /api/tasks/:id` - タスク削除
- `PATCH /api/tasks/:id/complete` - 完了状態の切り替え
- `PATCH /api/tasks/:id/progress` - 進捗の更新

#### クエリパラメータ
- `sortBy`: ソートフィールド（createdAt, dueDate）
- `sortOrder`: ソート順序（asc, desc）
- `completed`: 完了状態フィルタ（true, false）

## 🐛 トラブルシューティング

### よくある問題

#### ポート3001が使用中
```bash
# 使用中のプロセスを確認
lsof -i :3001

# プロセスを終了
kill -9 <PID>
```

#### データベース接続エラー
- `backend/data/` ディレクトリが存在することを確認
- SQLiteファイルの権限を確認

#### フロントエンドが表示されない
- バックエンドサーバーが起動していることを確認
- ブラウザのコンソールでエラーを確認
- `npm run dev` でHMRが有効になっていることを確認

## 📄 ライセンス

このプロジェクトはMITライセンスのもとで公開されています。

## 👥 作成者

- **katsuobushiFPGA** - *初期開発* - [GitHub](https://github.com/katsuobushiFPGA)

## 🙏 謝辞

このプロジェクトは、モダンなWebアプリケーション開発のベストプラクティスを学ぶために作成されました。Vue.js、Node.js、およびオープンソースコミュニティに感謝します。

---

📧 質問やフィードバックがありましたら、GitHubのIssuesでお気軽にお知らせください！
