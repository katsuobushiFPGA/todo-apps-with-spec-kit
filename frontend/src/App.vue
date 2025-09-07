<template>
  <div id="app" class="app-container" :class="{ dark: isDarkMode }">
    <!-- Header -->
    <header class="app-header">
      <div class="header-content">
        <div class="logo-section">
          <h1 class="app-title">
            <svg class="title-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
            </svg>
            TODOアプリ
          </h1>
          <p class="app-subtitle">タスクを効率的に管理しましょう</p>
        </div>
        
        <div class="header-actions">
          <button
            @click="toggleTheme"
            class="theme-toggle"
            :aria-label="isDarkMode ? 'ライトモードに切り替え' : 'ダークモードに切り替え'"
            title="テーマ切り替え"
          >
            <svg v-if="isDarkMode" class="theme-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
            </svg>
            <svg v-else class="theme-icon" viewBox="0 0 20 20" fill="currentColor">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          </button>
          
          <button
            @click="toggleFormVisibility"
            class="add-task-button"
            title="新しいタスクを追加"
          >
            <svg class="add-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
            </svg>
            タスクを追加
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Task Form -->
      <div v-if="showTaskForm" class="task-form-section">
        <TaskForm
          :task="editingTask"
          :show-close-button="true"
          @submit="handleTaskSubmit"
          @cancel="handleFormCancel"
          @close="handleFormCancel"
          ref="taskFormRef"
        />
      </div>

      <!-- Task List Section -->
      <div class="task-list-section">
        <TaskList
          :tasks="tasks"
          :loading="loading"
          :error="error"
          @update="handleTaskUpdate"
          @delete="handleTaskDelete"
          @toggle-complete="handleTaskToggle"
          @update-progress="handleProgressUpdate"
          @edit="handleTaskEdit"
          @refresh="refreshTasks"
          ref="taskListRef"
        />
      </div>
    </main>

    <!-- Global Loading Overlay -->
    <div v-if="globalLoading" class="loading-overlay">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p class="loading-text">{{ loadingMessage }}</p>
      </div>
    </div>

    <!-- Global Error Toast -->
    <Transition name="toast">
      <div v-if="toast.show" class="toast" :class="toast.type">
        <div class="toast-content">
          <svg v-if="toast.type === 'success'" class="toast-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <svg v-else-if="toast.type === 'error'" class="toast-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <span class="toast-message">{{ toast.message }}</span>
          <button @click="hideToast" class="toast-close">
            <svg class="close-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </Transition>

    <!-- Footer -->
    <footer class="app-footer">
      <div class="footer-content">
        <p class="footer-text">
          TODOアプリ v1.0 - 
          <span class="footer-stats">
            総タスク数: {{ tasks.length }} | 
            完了: {{ completedTasksCount }} | 
            進行中: {{ activeTasksCount }}
          </span>
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, nextTick, watch } from 'vue';
import TaskList from './components/TaskList.vue';
import TaskForm from './components/TaskForm.vue';
import taskService from './services/taskService.js';

// Reactive data
const tasks = ref([]);
const loading = ref(false);
const globalLoading = ref(false);
const error = ref('');
const showTaskForm = ref(false);
const editingTask = ref(null);
const isDarkMode = ref(false);
const loadingMessage = ref('');

const taskFormRef = ref(null);
const taskListRef = ref(null);

const toast = reactive({
  show: false,
  type: 'success',
  message: '',
  timeout: null
});

// Computed properties
const completedTasksCount = computed(() => 
  tasks.value.filter(task => task.completed).length
);

const activeTasksCount = computed(() => 
  tasks.value.filter(task => !task.completed).length
);

// Lifecycle hooks
onMounted(async () => {
  await initializeApp();
});

// Watchers
watch(isDarkMode, (newValue) => {
  console.log('Dark mode watcher triggered:', newValue);
  
  if (newValue) {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
  }
  
  localStorage.setItem('theme', newValue ? 'dark' : 'light');
  
  // CSS変数の値を確認
  const computedStyle = getComputedStyle(document.documentElement);
  console.log('CSS Variables after change:');
  console.log('--bg-primary:', computedStyle.getPropertyValue('--bg-primary'));
  console.log('--bg-secondary:', computedStyle.getPropertyValue('--bg-secondary'));
  console.log('--text-primary:', computedStyle.getPropertyValue('--text-primary'));
}, { immediate: true });

// Methods
const initializeApp = async () => {
  try {
    // テーマの復元
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    isDarkMode.value = savedTheme === 'dark' || (savedTheme === null && prefersDark);
    
    // タスクの読み込み
    await refreshTasks();
    
    showToast('success', 'アプリケーションが正常に起動しました');
  } catch (err) {
    console.error('App initialization failed:', err);
    showToast('error', 'アプリケーションの初期化に失敗しました');
  }
};

const refreshTasks = async () => {
  try {
    loading.value = true;
    error.value = '';
    
    const response = await taskService.getTasks();
    tasks.value = response.tasks || [];
  } catch (err) {
    console.error('Failed to fetch tasks:', err);
    error.value = 'タスクの読み込みに失敗しました';
    showToast('error', 'タスクの読み込みに失敗しました');
  } finally {
    loading.value = false;
  }
};

const toggleFormVisibility = () => {
  if (showTaskForm.value) {
    handleFormCancel();
  } else {
    editingTask.value = null;
    showTaskForm.value = true;
    nextTick(() => {
      taskFormRef.value?.focus();
    });
  }
};

const handleTaskSubmit = async (taskData) => {
  try {
    globalLoading.value = true;
    loadingMessage.value = editingTask.value ? 'タスクを更新中...' : 'タスクを作成中...';
    
    let result;
    if (editingTask.value) {
      result = await taskService.updateTask(editingTask.value.id, taskData);
      
      // ローカルのタスクリストを更新
      const index = tasks.value.findIndex(task => task.id === editingTask.value.id);
      if (index !== -1) {
        tasks.value[index] = { ...tasks.value[index], ...result };
      }
      
      showToast('success', 'タスクが正常に更新されました');
    } else {
      result = await taskService.createTask(taskData);
      tasks.value.unshift(result);
      showToast('success', 'タスクが正常に作成されました');
    }
    
    handleFormCancel();
  } catch (err) {
    console.error('Task submit failed:', err);
    showToast('error', editingTask.value ? 'タスクの更新に失敗しました' : 'タスクの作成に失敗しました');
  } finally {
    globalLoading.value = false;
    loadingMessage.value = '';
  }
};

const handleFormCancel = () => {
  showTaskForm.value = false;
  editingTask.value = null;
};

const handleTaskUpdate = async (taskId, updateData) => {
  try {
    const result = await taskService.updateTask(taskId, updateData);
    
    const index = tasks.value.findIndex(task => task.id === taskId);
    if (index !== -1) {
      tasks.value[index] = { ...tasks.value[index], ...result };
    }
    
    showToast('success', 'タスクが更新されました');
  } catch (err) {
    console.error('Task update failed:', err);
    showToast('error', 'タスクの更新に失敗しました');
  }
};

const handleTaskDelete = async (taskId) => {
  try {
    globalLoading.value = true;
    loadingMessage.value = 'タスクを削除中...';
    
    await taskService.deleteTask(taskId);
    
    tasks.value = tasks.value.filter(task => task.id !== taskId);
    showToast('success', 'タスクが削除されました');
  } catch (err) {
    console.error('Task delete failed:', err);
    showToast('error', 'タスクの削除に失敗しました');
  } finally {
    globalLoading.value = false;
    loadingMessage.value = '';
  }
};

const handleTaskToggle = async (taskId, completed) => {
  try {
    const result = await taskService.updateTask(taskId, { 
      completed,
      progress: completed ? 100 : undefined
    });
    
    const index = tasks.value.findIndex(task => task.id === taskId);
    if (index !== -1) {
      tasks.value[index] = { ...tasks.value[index], ...result };
    }
    
    showToast('success', completed ? 'タスクを完了しました' : 'タスクを未完了に戻しました');
  } catch (err) {
    console.error('Task toggle failed:', err);
    showToast('error', 'タスクの状態変更に失敗しました');
  }
};

const handleProgressUpdate = async (taskId, progress) => {
  try {
    const result = await taskService.updateProgress(taskId, progress);
    
    const index = tasks.value.findIndex(task => task.id === taskId);
    if (index !== -1) {
      tasks.value[index] = { ...tasks.value[index], ...result };
    }
  } catch (err) {
    console.error('Progress update failed:', err);
    showToast('error', '進捗の更新に失敗しました');
  }
};

const handleTaskEdit = (task) => {
  editingTask.value = task;
  showTaskForm.value = true;
  nextTick(() => {
    taskFormRef.value?.focus();
  });
};

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value;
  console.log('Theme toggled:', isDarkMode.value ? 'dark' : 'light');
  console.log('HTML classes:', document.documentElement.classList.toString());
  console.log('Body classes:', document.body.classList.toString());
};

const showToast = (type, message, duration = 3000) => {
  if (toast.timeout) {
    clearTimeout(toast.timeout);
  }
  
  toast.type = type;
  toast.message = message;
  toast.show = true;
  
  toast.timeout = setTimeout(() => {
    hideToast();
  }, duration);
};

const hideToast = () => {
  toast.show = false;
  if (toast.timeout) {
    clearTimeout(toast.timeout);
    toast.timeout = null;
  }
};

// Keyboard shortcuts
const handleKeyboardShortcuts = (event) => {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 'n':
        event.preventDefault();
        toggleFormVisibility();
        break;
      case 'r':
        event.preventDefault();
        refreshTasks();
        break;
      case 'd':
        event.preventDefault();
        toggleTheme();
        break;
    }
  }
  
  if (event.key === 'Escape' && showTaskForm.value) {
    handleFormCancel();
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeyboardShortcuts);
});
</script>

<style>
/* CSS variables for theming - これはグローバルである必要があります */
:root {
  --primary-color: #4299e1;
  --primary-dark: #3182ce;
  --success-color: #48bb78;
  --error-color: #e53e3e;
  --warning-color: #ed8936;
  --bg-primary: #ffffff;
  --bg-secondary: #f7fafc;
  --text-primary: #2d3748;
  --text-secondary: #718096;
  --border-color: #e2e8f0;
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

/* Dark mode variables */
.dark {
  --primary-color: #63b3ed;
  --primary-dark: #4299e1;
  --success-color: #68d391;
  --error-color: #fc8181;
  --warning-color: #f6ad55;
  --bg-primary: #1a202c;
  --bg-secondary: #2d3748;
  --text-primary: #ffffff;
  --text-secondary: #cbd5e0;
  --border-color: #4a5568;
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
}

/* Base styles - これもグローバルである必要があります */
* {
  box-sizing: border-box;
}

.app-container {
  min-height: 100vh;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  transition: background-color 0.2s ease, color 0.2s ease;
}
</style>

<style scoped>

/* Header */
.app-header {
  background-color: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.logo-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.app-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  width: 28px;
  height: 28px;
  color: var(--primary-color);
}

.app-subtitle {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.theme-toggle {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 8px;
  background-color: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.theme-toggle:hover {
  background-color: var(--border-color);
  color: var(--text-primary);
}

.theme-icon {
  width: 20px;
  height: 20px;
}

.add-task-button {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  background-color: var(--primary-color);
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.add-task-button:hover {
  background-color: var(--primary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.add-icon {
  width: 16px;
  height: 16px;
}

/* Main content */
.main-content {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.task-form-section {
  display: flex;
  justify-content: center;
}

.task-list-section {
  flex: 1;
}

/* Loading overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-spinner {
  background-color: var(--bg-primary);
  padding: 32px;
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
}

/* Toast notifications */
.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  border-radius: 8px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  max-width: 400px;
}

.toast.success {
  background-color: var(--success-color);
  color: white;
}

.toast.error {
  background-color: var(--error-color);
  color: white;
}

.toast-content {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.toast-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.toast-message {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
}

.toast-close {
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  color: currentColor;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.8;
  transition: opacity 0.2s ease;
}

.toast-close:hover {
  opacity: 1;
}

.close-icon {
  width: 14px;
  height: 14px;
}

/* Toast transitions */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  transform: translateX(100%) translateY(20px);
  opacity: 0;
}

.toast-leave-to {
  transform: translateX(100%) translateY(20px);
  opacity: 0;
}

/* Footer */
.app-footer {
  background-color: var(--bg-primary);
  border-top: 1px solid var(--border-color);
  margin-top: auto;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 20px;
  text-align: center;
}

.footer-text {
  margin: 0;
  font-size: 12px;
  color: var(--text-secondary);
}

.footer-stats {
  font-weight: 500;
}

/* Responsive design */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    text-align: center;
    padding: 16px;
  }
  
  .logo-section {
    align-items: center;
  }
  
  .header-actions {
    width: 100%;
    justify-content: center;
  }
  
  .main-content {
    padding: 16px;
  }
  
  .app-title {
    font-size: 20px;
  }
  
  .toast {
    left: 16px;
    right: 16px;
    bottom: 16px;
    top: auto;
    max-width: none;
  }
}

@media (max-width: 480px) {
  .add-task-button {
    padding: 10px 16px;
    font-size: 12px;
  }
  
  .add-task-button span {
    display: none;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .app-container {
    border: 2px solid var(--text-primary);
  }
  
  .app-header,
  .app-footer {
    border-color: var(--text-primary);
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
