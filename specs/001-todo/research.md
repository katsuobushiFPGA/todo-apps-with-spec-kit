# Research: TODO管理アプリケーション技術選択

## Technology Stack Research

### Frontend Framework
**Decision**: Vue 3 Composition API  
**Rationale**: 
- 軽量で学習コストが低い
- Composition APIにより状態管理が簡潔
- TypeScriptサポートが優秀
- 単一ファイルコンポーネント(.vue)で開発効率が高い
**Alternatives considered**: React (複雑すぎる), Vanilla JS (状態管理が煩雑)

### Build Tool
**Decision**: Vite  
**Rationale**:
- 高速な開発サーバー (ESM based)
- Vue3との統合が優秀
- 最小限の設定で動作
- Hot Module Replacement (HMR) が高速
**Alternatives considered**: Webpack (設定が複雑), Parcel (Vue統合が劣る)

### Database
**Decision**: SQLite with better-sqlite3  
**Rationale**:
- ファイルベースでデプロイが簡単
- SQL標準準拠で移行しやすい
- 単一ユーザーアプリに最適
- Node.jsの better-sqlite3 は高速で同期API
**Alternatives considered**: IndexedDB (複雑なAPI), JSON files (検索性能劣る)

### Backend Framework
**Decision**: Express.js (minimal)  
**Rationale**:
- 軽量で必要最小限の機能
- SQLiteとの統合が簡単
- REST API構築が直感的
- デバッグとテストが容易
**Alternatives considered**: Fastify (オーバースペック), Native Node.js HTTP (開発効率劣る)

### Testing Framework
**Decision**: Vitest + Vue Testing Library  
**Rationale**:
- Viteとネイティブ統合
- Jest互換APIで学習コストなし
- Vue Testing Libraryでコンポーネントテストが容易
- ESMサポートが完全
**Alternatives considered**: Jest (Vite統合が複雑), Cypress (E2E専用)

### CSS Approach
**Decision**: 標準CSS + CSS Modules  
**Rationale**:
- 依存関係を最小限に
- ブラウザ標準のCSS Grid/Flexbox使用
- CSS Modulesでスコープ化
- 軽量でパフォーマンスが良い
**Alternatives considered**: Tailwind CSS (バンドルサイズ増加), Styled Components (Vue向けでない)

## Architecture Decisions

### Project Structure
**Decision**: Monorepo with separate frontend/backend  
**Rationale**:
- 開発時の一体性維持
- 共通型定義の共有が可能
- デプロイメントの簡素化
**Alternatives considered**: 完全分離 (開発効率劣る), 単一プロジェクト (責任分離困難)

### State Management
**Decision**: Vue 3 Composition API (ref/reactive)  
**Rationale**:
- 小規模アプリにはVuexは不要
- Composition APIで十分な状態管理
- タスクデータはサーバーサイドが主体
**Alternatives considered**: Vuex (オーバーエンジニアリング), Pinia (この規模では不要)

### API Design
**Decision**: RESTful API  
**Rationale**:
- CRUD操作に最適
- HTTPステータスコードが直感的
- キャッシュ戦略が明確
**Alternatives considered**: GraphQL (複雑すぎる), RPC (REST標準から外れる)

## Performance Considerations

### Database Optimization
- SQLiteにインデックス追加 (期限日, 作成日)
- 必要な場合のみクエリ最適化
- トランザクション使用で一貫性担保

### Frontend Performance
- Vue 3の reactive性能活用
- 必要な場合のみvirtualization
- 画像最適化（アイコンはSVG使用）

### Bundle Size
- Tree shakingでUnused code除去
- Dynamic importでcode splitting
- 外部ライブラリは必要最小限
