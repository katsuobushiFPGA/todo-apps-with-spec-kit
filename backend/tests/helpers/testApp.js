/**
 * Test App Helper
 * 
 * テスト用のアプリケーションインスタンスを作成するヘルパー
 */

const App = require('../src/app');

/**
 * テスト用のアプリケーションインスタンスを作成
 * @returns {Promise<Object>} { app: Express app, appInstance: App instance }
 */
async function createTestApp() {
  const appInstance = new App();
  
  // データベースの初期化
  await appInstance.initDatabase();
  
  // Expressアプリケーションインスタンスを取得
  const app = appInstance.getApp();
  
  return { app, appInstance };
}

/**
 * テストアプリケーションを停止
 * @param {Object} appInstance - Appインスタンス
 */
async function stopTestApp(appInstance) {
  if (appInstance) {
    await appInstance.stop();
  }
}

module.exports = {
  createTestApp,
  stopTestApp
};
