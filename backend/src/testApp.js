/**
 * Express App for Testing
 * 
 * テスト用のExpressアプリケーションエクスポート
 */

const App = require('./app');

async function createApp() {
  const appInstance = new App();
  await appInstance.initDatabase();
  return appInstance.getApp();
}

module.exports = createApp;
