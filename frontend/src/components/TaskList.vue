<template>
  <div class="task-list">
    <!-- ヘッダー部分 -->
    <div class="task-list-header">
      <h2 class="title">タスク管理</h2>
      <div class="controls">
        <select v-model="sortBy" @change="onSortChange" class="sort-select">
          <option value="createdAt:desc">作成日順（新しい順）</option>
          <option value="createdAt:asc">作成日順（古い順）</option>
          <option value="dueDate:asc">期限日順（近い順）</option>
          <option value="dueDate:desc">期限日順（遠い順）</option>
        </select>
        <select v-model="filterCompleted" @change="onFilterChange" class="filter-select">
          <option :value="null">すべて</option>
          <option :value="false">未完了</option>
          <option :value="true">完了済み</option>
        </select>
      </div>
    </div>

    <!-- エラーメッセージ -->
    <div v-if="error" class="error-message">
      {{ error }}
      <button @click="retryLoad" class="retry-button">再試行</button>
    </div>

    <!-- ローディング状態 -->
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>タスクを読み込み中...</p>
    </div>

    <!-- 空状態 -->
    <div v-else-if="!loading && tasks.length === 0" class="empty-state">
      <div class="empty-icon">📝</div>
      <h3>タスクがありません</h3>
      <p>新しいタスクを作成してみましょう</p>
    </div>

    <!-- タスクリスト -->
    <div v-else class="tasks-container">
      <div class="task-stats">
        <span class="stats-item">
          全体: {{ totalTasks }}件
        </span>
        <span class="stats-item">
          完了: {{ completedTasks }}件
        </span>
        <span class="stats-item" :title="'全タスクの平均進捗率: ' + overallProgress + '%'">
          平均進捗: {{ overallProgress }}%
        </span>
        <span v-if="totalTasks > 0" class="stats-item progress-detail">
          ({{ Math.round((completedTasks / totalTasks) * 100) }}% 完了)
        </span>
      </div>

      <transition-group name="task-list" tag="div" class="tasks">
        <TaskItem
          v-for="task in tasks"
          :key="task.id"
          :task="task"
          @update="onTaskUpdate"
          @delete="onTaskDelete"
          @toggle-complete="onToggleComplete"
          @update-progress="onUpdateProgress"
        />
      </transition-group>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import TaskItem from './TaskItem.vue';
import { taskService, handleApiError } from '../services/taskService.js';

// Props
const props = defineProps({
  refreshTrigger: {
    type: Number,
    default: 0
  }
});

// Emits
const emit = defineEmits(['task-selected', 'error']);

// Reactive data
const tasks = ref([]);
const loading = ref(false);
const error = ref('');
const sortBy = ref('createdAt:desc');
const filterCompleted = ref(null);

// Computed properties
const totalTasks = computed(() => tasks.value.length);

const completedTasks = computed(() => 
  tasks.value.filter(task => task.completed).length
);

const overallProgress = computed(() => {
  if (tasks.value.length === 0) return 0;
  
  // 各タスクの進捗を合計
  const totalProgress = tasks.value.reduce((sum, task) => {
    // 完了したタスクは100%として計算
    const taskProgress = task.completed ? 100 : (task.progress || 0);
    return sum + taskProgress;
  }, 0);
  
  // 平均進捗を計算
  const averageProgress = totalProgress / tasks.value.length;
  return Math.round(averageProgress);
});

// Methods
const loadTasks = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    // ソート値を分割（例: "createdAt:desc" → sortBy="createdAt", sortOrder="desc"）
    const [sortField, sortOrder] = sortBy.value.split(':');
    
    const params = {
      sortBy: sortField,
      sortOrder: sortOrder
    };
    
    if (filterCompleted.value !== null) {
      params.completed = filterCompleted.value;
    }
    
    const response = await taskService.getTasks(params);
    tasks.value = response.tasks;
  } catch (err) {
    error.value = handleApiError(err);
    emit('error', error.value);
  } finally {
    loading.value = false;
  }
};

const retryLoad = () => {
  loadTasks();
};

const onSortChange = () => {
  loadTasks();
};

const onFilterChange = () => {
  loadTasks();
};

const onTaskUpdate = async (taskId, updateData) => {
  try {
    const updatedTask = await taskService.updateTask(taskId, updateData);
    const index = tasks.value.findIndex(task => task.id === taskId);
    if (index !== -1) {
      tasks.value[index] = updatedTask;
    }
  } catch (err) {
    error.value = handleApiError(err);
    emit('error', error.value);
  }
};

const onTaskDelete = async (taskId) => {
  try {
    await taskService.deleteTask(taskId);
    tasks.value = tasks.value.filter(task => task.id !== taskId);
  } catch (err) {
    error.value = handleApiError(err);
    emit('error', error.value);
  }
};

const onToggleComplete = async (taskId, completed) => {
  try {
    const updatedTask = await taskService.toggleComplete(taskId, completed);
    const index = tasks.value.findIndex(task => task.id === taskId);
    if (index !== -1) {
      tasks.value[index] = updatedTask;
    }
  } catch (err) {
    error.value = handleApiError(err);
    emit('error', error.value);
  }
};

const onUpdateProgress = async (taskId, progress) => {
  try {
    const updatedTask = await taskService.updateProgress(taskId, progress);
    const index = tasks.value.findIndex(task => task.id === taskId);
    if (index !== -1) {
      tasks.value[index] = updatedTask;
    }
  } catch (err) {
    error.value = handleApiError(err);
    emit('error', error.value);
  }
};

// Lifecycle
onMounted(() => {
  loadTasks();
});

// Watchers
watch(() => props.refreshTrigger, () => {
  loadTasks();
});

// Expose methods for parent component
defineExpose({
  refresh: loadTasks
});
</script>

<style scoped>
.task-list {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: var(--bg-primary, #ffffff);
  border-radius: 12px;
  box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
  color: var(--text-primary, #2d3748);
  transition: background-color 0.2s ease, color 0.2s ease;
}

.task-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.title {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary, #2d3748);
}

.controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.sort-select,
.filter-select {
  padding: 8px 12px;
  border: 2px solid var(--border-color, #e2e8f0);
  border-radius: 8px;
  background-color: var(--bg-primary, white);
  color: var(--text-primary, #2d3748);
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease;
}

.sort-select:hover,
.filter-select:hover {
  border-color: #cbd5e0;
}

.sort-select:focus,
.filter-select:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

.error-message {
  background-color: #fed7d7;
  border: 1px solid #feb2b2;
  color: #c53030;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.retry-button {
  background-color: #c53030;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s ease;
}

.retry-button:hover {
  background-color: #9c2626;
}

.loading {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary, #718096);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color, #e2e8f0);
  border-top: 4px solid var(--primary-color, #4299e1);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #718096;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #4a5568;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

.tasks-container {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.task-stats {
  background-color: var(--bg-secondary, #f7fafc);
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  transition: background-color 0.2s ease;
}

.stats-item {
  font-size: 14px;
  color: var(--text-secondary, #4a5568);
  font-weight: 500;
}

.stats-item.progress-detail {
  color: var(--text-secondary, #718096);
  font-size: 12px;
  font-weight: 400;
  opacity: 0.8;
}

.tasks {
  padding: 0;
}

/* Task list transitions */
.task-list-enter-active,
.task-list-leave-active {
  transition: all 0.3s ease;
}

.task-list-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.task-list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.task-list-move {
  transition: transform 0.3s ease;
}

/* Responsive design */
@media (max-width: 640px) {
  .task-list {
    padding: 16px;
  }
  
  .task-list-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .controls {
    justify-content: center;
  }
  
  .task-stats {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
