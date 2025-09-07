/**
 * Server Entry Point
 * 
 * TODO管理アプリケーションのサーバー起動スクリプト
 */

const App = require('./src/app');

// 環境変数の設定
require('dotenv').config();

// 未処理の例外とPromise拒否をキャッチ
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

/**
 * メイン関数
 */
async function main() {
  try {
    const app = new App();
    await app.start();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// 開発環境でのホットリロード対応
if (require.main === module) {
  main();
}

module.exports = main;
