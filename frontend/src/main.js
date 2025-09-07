import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

// アプリケーションインスタンスを作成
const app = createApp(App)

// グローバルエラーハンドラーを設定
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue Error:', err)
  console.error('Component info:', info)
  console.error('Vue instance:', vm)
  
  // プロダクション環境ではエラー追跡サービスに送信
  if (import.meta.env.PROD) {
    // 例: Sentry.captureException(err)
  }
}

// グローバル警告ハンドラーを設定（開発環境のみ）
if (import.meta.env.DEV) {
  app.config.warnHandler = (msg, vm, trace) => {
    console.warn('Vue Warning:', msg)
    console.warn('Component trace:', trace)
  }
}

// アプリケーションをマウント
app.mount('#app')
