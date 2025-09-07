<template>
  <div class="task-item" :class="{ 'completed': task.completed, 'editing': isEditing }">
    <!-- 通常表示モード -->
    <div v-if="!isEditing" class="task-content">
      <!-- チェックボックスとタイトル -->
      <div class="task-main">
        <button
          @click="toggleComplete"
          class="complete-button"
          :class="{ 'completed': task.completed }"
          :aria-label="task.completed ? 'タスクを未完了にする' : 'タスクを完了にする'"
        >
          <svg v-if="task.completed" class="check-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </button>
        
        <div class="task-info">
          <h3 class="task-title" :class="{ 'completed': task.completed }">
            {{ task.title }}
          </h3>
          
          <div class="task-meta">
            <span class="created-date">
              作成: {{ formatDate(task.createdAt) }}
            </span>
            <span v-if="task.dueDate" class="due-date" :class="dueDateClass">
              期限: {{ formatDate(task.dueDate) }}
              <span class="days-remaining" :class="dueDateClass">
                {{ getDaysRemainingText() }}
              </span>
            </span>
          </div>
        </div>
      </div>

      <!-- 進捗バーとアクションボタン -->
      <div class="task-actions">
        <div class="progress-section">
          <ProgressBar 
            :progress="task.progress" 
            :completed="task.completed"
            @update="onProgressUpdate"
            :editable="!task.completed"
          />
        </div>
        
        <div class="action-buttons">
          <button
            @click="startEdit"
            class="action-button edit-button"
            :disabled="task.completed"
            title="編集"
          >
            <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          
          <button
            @click="confirmDelete"
            class="action-button delete-button"
            title="削除"
          >
            <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 102 0v3a1 1 0 11-2 0V9zm4 0a1 1 0 10-2 0v3a1 1 0 102 0V9z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 編集モード -->
    <div v-else class="task-edit">
      <form @submit.prevent="saveEdit" class="edit-form">
        <div class="edit-fields">
          <div class="field-group">
            <label for="edit-title" class="field-label">タイトル</label>
            <input
              id="edit-title"
              v-model="editForm.title"
              type="text"
              class="edit-input"
              :class="{ 'error': editErrors.title }"
              placeholder="タスクのタイトルを入力"
              required
              maxlength="500"
              ref="titleInput"
            />
            <span v-if="editErrors.title" class="error-text">{{ editErrors.title }}</span>
          </div>
          
          <div class="field-group">
            <label for="edit-due-date" class="field-label">期限日</label>
            <input
              id="edit-due-date"
              v-model="editForm.dueDate"
              type="date"
              class="edit-input"
              :class="{ 'error': editErrors.dueDate }"
            />
            <span v-if="editErrors.dueDate" class="error-text">{{ editErrors.dueDate }}</span>
          </div>
          
          <div class="field-group">
            <label for="edit-progress" class="field-label">進捗 ({{ editForm.progress }}%)</label>
            <div class="progress-slider-container">
              <input
                id="edit-progress"
                v-model.number="editForm.progress"
                type="range"
                class="progress-slider"
                :class="{ 'error': editErrors.progress }"
                :style="{ '--progress-value': editForm.progress + '%' }"
                min="0"
                max="100"
                step="1"
              />
              <div class="slider-labels">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
            <span v-if="editErrors.progress" class="error-text">{{ editErrors.progress }}</span>
          </div>
        </div>
        
        <div class="edit-actions">
          <button type="submit" class="save-button" :disabled="!isFormValid">
            保存
          </button>
          <button type="button" @click="cancelEdit" class="cancel-button">
            キャンセル
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, reactive } from 'vue';
import ProgressBar from './ProgressBar.vue';

// Props
const props = defineProps({
  task: {
    type: Object,
    required: true,
    validator(task) {
      return task && typeof task.id === 'number' && typeof task.title === 'string';
    }
  }
});

// Emits
const emit = defineEmits(['update', 'delete', 'toggle-complete', 'update-progress']);

// Reactive data
const isEditing = ref(false);
const titleInput = ref(null);

const editForm = reactive({
  title: '',
  dueDate: '',
  progress: 0
});

const editErrors = reactive({
  title: '',
  dueDate: '',
  progress: ''
});

// Computed properties
const dueDateClass = computed(() => {
  if (!props.task.dueDate) return '';
  
  const dueDate = new Date(props.task.dueDate);
  const today = new Date();
  const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'overdue';
  if (diffDays === 0) return 'due-today';
  if (diffDays <= 3) return 'due-soon';
  return '';
});

const isFormValid = computed(() => {
  return editForm.title.trim().length > 0 && !editErrors.title && !editErrors.dueDate && !editErrors.progress;
});

// Methods
const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const getDaysRemainingText = () => {
  if (!props.task.dueDate) return '';
  
  const dueDate = new Date(props.task.dueDate);
  const today = new Date();
  const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return `(${overdueDays}日遅れ)`;
  }
  if (diffDays === 0) return '(今日まで)';
  if (diffDays === 1) return '(明日まで)';
  if (diffDays <= 7) return `(${diffDays}日後)`;
  if (diffDays <= 30) return `(${diffDays}日後)`;
  return '';
};

const toggleComplete = () => {
  emit('toggle-complete', props.task.id, !props.task.completed);
};

const onProgressUpdate = (progress) => {
  emit('update-progress', props.task.id, progress);
};

const startEdit = async () => {
  editForm.title = props.task.title;
  editForm.dueDate = props.task.dueDate ? props.task.dueDate.split('T')[0] : '';
  editForm.progress = props.task.progress || 0;
  
  // Clear previous errors
  editErrors.title = '';
  editErrors.dueDate = '';
  editErrors.progress = '';
  
  isEditing.value = true;
  
  await nextTick();
  titleInput.value?.focus();
};

const validateForm = () => {
  let isValid = true;
  
  // Title validation
  if (!editForm.title.trim()) {
    editErrors.title = 'タイトルは必須です';
    isValid = false;
  } else if (editForm.title.length > 500) {
    editErrors.title = 'タイトルは500文字以内で入力してください';
    isValid = false;
  } else {
    editErrors.title = '';
  }
  
  // Due date validation
  if (editForm.dueDate) {
    const dueDate = new Date(editForm.dueDate);
    if (isNaN(dueDate.getTime())) {
      editErrors.dueDate = '正しい日付形式で入力してください';
      isValid = false;
    } else {
      editErrors.dueDate = '';
    }
  } else {
    editErrors.dueDate = '';
  }
  
  // Progress validation
  const progress = Number(editForm.progress);
  if (isNaN(progress) || progress < 0 || progress > 100) {
    editErrors.progress = '進捗は0から100の間で入力してください';
    isValid = false;
  } else {
    editErrors.progress = '';
  }
  
  return isValid;
};

const saveEdit = () => {
  if (!validateForm()) {
    return;
  }
  
  const updateData = {
    title: editForm.title.trim(),
    progress: Number(editForm.progress)
  };
  
  if (editForm.dueDate) {
    updateData.dueDate = editForm.dueDate;
  } else {
    updateData.dueDate = null;
  }
  
  emit('update', props.task.id, updateData);
  isEditing.value = false;
};

const cancelEdit = () => {
  isEditing.value = false;
  editErrors.title = '';
  editErrors.dueDate = '';
  editErrors.progress = '';
};

const confirmDelete = () => {
  if (confirm(`タスク「${props.task.title}」を削除しますか？`)) {
    emit('delete', props.task.id);
  }
};
</script>

<style scoped>
.task-item {
  background-color: var(--bg-primary, white);
  border-bottom: 1px solid var(--border-color, #e2e8f0);
  transition: all 0.2s ease;
  position: relative;
  color: var(--text-primary, #2d3748);
}

.task-item:hover {
  background-color: var(--bg-secondary, #f8fafc);
}

.task-item.completed {
  background-color: #f0fff4;
}

.task-item.editing {
  background-color: var(--bg-secondary, #f7fafc);
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm, 0 1px 3px 0 rgba(0, 0, 0, 0.1));
}

.task-content {
  padding: 20px;
}

.task-main {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.complete-button {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border-color, #e2e8f0);
  border-radius: 6px;
  background-color: var(--bg-primary, white);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
  margin-top: 2px;
}

.complete-button:hover {
  border-color: #4299e1;
  background-color: #ebf8ff;
}

.complete-button.completed {
  background-color: #48bb78;
  border-color: #48bb78;
  color: white;
}

.check-icon {
  width: 14px;
  height: 14px;
}

.task-info {
  flex: 1;
  min-width: 0;
}

.task-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary, #2d3748);
  line-height: 1.4;
  word-wrap: break-word;
}

.task-title.completed {
  text-decoration: line-through;
  color: var(--text-secondary, #718096);
}

.task-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-secondary, #718096);
  flex-wrap: wrap;
}

.due-date.overdue {
  color: #e53e3e;
  font-weight: 500;
}

.due-date.due-today {
  color: #d69e2e;
  font-weight: 500;
}

.due-date.due-soon {
  color: #dd6b20;
  font-weight: 500;
}

.days-remaining {
  font-size: 11px;
  margin-left: 4px;
  padding: 2px 6px;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.05);
  font-weight: 400;
}

.days-remaining.overdue {
  background-color: rgba(229, 62, 62, 0.1);
  color: #c53030;
}

.days-remaining.due-today {
  background-color: rgba(214, 158, 46, 0.1);
  color: #b7791f;
}

.days-remaining.due-soon {
  background-color: rgba(221, 107, 32, 0.1);
  color: #c05621;
}

.task-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.progress-section {
  flex: 1;
  max-width: 200px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-button {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.action-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.edit-button {
  background-color: #ebf8ff;
  color: #3182ce;
}

.edit-button:hover:not(:disabled) {
  background-color: #bee3f8;
}

.delete-button {
  background-color: #fed7d7;
  color: #c53030;
}

.delete-button:hover {
  background-color: #feb2b2;
}

.icon {
  width: 16px;
  height: 16px;
}

/* Edit mode styles */
.task-edit {
  padding: 20px;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.edit-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary, #4a5568);
}

.edit-input {
  padding: 8px 12px;
  border: 2px solid var(--border-color, #e2e8f0);
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease;
  background-color: var(--bg-primary, white);
  color: var(--text-primary, #2d3748);
}

/* 日付入力フィールドの特別なスタイリング */
.edit-input[type="date"] {
  color-scheme: light dark;
  cursor: pointer;
}

/* ライトモードでの日付入力 */
.edit-input[type="date"]:not(.dark *) {
  background-color: #ffffff;
  color: #2d3748;
  border: 2px solid #e2e8f0;
}

/* ダークモードでの日付入力 */
:global(.dark) .edit-input[type="date"] {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  border: 2px solid var(--border-color);
  color-scheme: dark;
}

/* 日付ピッカーのアイコンスタイル */
.edit-input[type="date"]::-webkit-calendar-picker-indicator {
  background-color: var(--text-secondary, #718096);
  border-radius: 4px;
  cursor: pointer;
  padding: 2px;
  transition: background-color 0.2s ease;
}

.edit-input[type="date"]::-webkit-calendar-picker-indicator:hover {
  background-color: var(--primary-color, #4299e1);
}

.edit-input:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

.edit-input.error {
  border-color: #e53e3e;
}

.progress-slider-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;
}

.progress-slider {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: var(--border-color, #e2e8f0);
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
  background-image: linear-gradient(
    to right,
    var(--success-color, #48bb78) 0%,
    var(--success-color, #48bb78) var(--progress-value, 0%),
    var(--border-color, #e2e8f0) var(--progress-value, 0%),
    var(--border-color, #e2e8f0) 100%
  );
}

.progress-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--primary-color, #4299e1);
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.progress-slider::-webkit-slider-thumb:hover {
  background: var(--primary-hover, #3182ce);
  transform: scale(1.1);
}

.progress-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--primary-color, #4299e1);
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.progress-slider::-moz-range-thumb:hover {
  background: var(--primary-hover, #3182ce);
  transform: scale(1.1);
}

.progress-slider.error {
  background-image: linear-gradient(
    to right,
    var(--error-color, #e53e3e) 0%,
    var(--error-color, #e53e3e) var(--progress-value, 0%),
    #fed7d7 var(--progress-value, 0%),
    #fed7d7 100%
  );
}

.progress-slider.error::-webkit-slider-thumb {
  background: #e53e3e;
}

.progress-slider.error::-moz-range-thumb {
  background: #e53e3e;
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  padding: 0;
}

.slider-labels span {
  font-size: 10px;
  color: var(--text-secondary, #a0aec0);
}

/* ダークモード対応 */
:global(.dark) .progress-slider {
  background-image: linear-gradient(
    to right,
    var(--success-color, #68d391) 0%,
    var(--success-color, #68d391) var(--progress-value, 0%),
    var(--border-color, #4a5568) var(--progress-value, 0%),
    var(--border-color, #4a5568) 100%
  );
}

:global(.dark) .progress-slider::-webkit-slider-thumb {
  background: var(--primary-color, #63b3ed);
  border-color: var(--bg-primary, #2d3748);
}

:global(.dark) .progress-slider::-moz-range-thumb {
  background: var(--primary-color, #63b3ed);
  border-color: var(--bg-primary, #2d3748);
}

:global(.dark) .slider-labels span {
  color: var(--text-secondary, #a0aec0);
}

.error-text {
  font-size: 12px;
  color: #e53e3e;
}

.edit-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.save-button,
.cancel-button {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.save-button {
  background-color: #4299e1;
  color: white;
  border: none;
}

.save-button:hover:not(:disabled) {
  background-color: #3182ce;
}

.save-button:disabled {
  background-color: #a0aec0;
  cursor: not-allowed;
}

.cancel-button {
  background-color: #f7fafc;
  color: #4a5568;
  border: 2px solid #e2e8f0;
}

.cancel-button:hover {
  background-color: #edf2f7;
  border-color: #cbd5e0;
}

/* Responsive design */
@media (max-width: 640px) {
  .task-content {
    padding: 16px;
  }
  
  .task-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .action-buttons {
    justify-content: center;
  }
  
  .edit-actions {
    flex-direction: column;
  }
  
  .task-meta {
    flex-direction: column;
    gap: 4px;
  }
}

/* ダークモード対応の追加スタイル */
:global(.dark) .task-item {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

:global(.dark) .task-item:hover {
  background-color: var(--bg-secondary);
}

:global(.dark) .task-title {
  color: var(--text-primary) !important;
}

:global(.dark) .task-title.completed {
  color: var(--text-secondary) !important;
}

:global(.dark) .task-meta {
  color: var(--text-secondary) !important;
}

:global(.dark) .due-date.overdue {
  color: var(--error-color) !important;
}

:global(.dark) .due-date.due-today {
  color: var(--warning-color) !important;
}

:global(.dark) .due-date.due-soon {
  color: #f6ad55 !important;
}

:global(.dark) .days-remaining {
  background-color: rgba(255, 255, 255, 0.1);
}

:global(.dark) .days-remaining.overdue {
  background-color: rgba(252, 129, 129, 0.2);
  color: #fc8181;
}

:global(.dark) .days-remaining.due-today {
  background-color: rgba(246, 173, 85, 0.2);
  color: #f6ad55;
}

:global(.dark) .days-remaining.due-soon {
  background-color: rgba(246, 173, 85, 0.2);
  color: #f6ad55;
}

:global(.dark) .complete-button {
  border-color: var(--border-color);
  background-color: var(--bg-primary);
}

:global(.dark) .task-item.editing {
  background-color: var(--bg-secondary, #2d3748) !important;
  box-shadow: var(--shadow-sm, 0 1px 3px 0 rgba(0, 0, 0, 0.3)) !important;
}

:global(.dark) .field-label {
  color: var(--text-primary) !important;
}

:global(.dark) .cancel-button {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border-color: var(--border-color);
}

:global(.dark) .save-button {
  background-color: var(--primary-color);
}
</style>
