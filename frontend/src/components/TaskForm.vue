<template>
  <div class="task-form-container">
    <!-- ヘッダー -->
    <div class="form-header">
      <h2 class="form-title">
        {{ isEditMode ? 'タスクを編集' : '新しいタスクを作成' }}
      </h2>
      <button v-if="showCloseButton" @click="onClose" class="close-button" aria-label="閉じる">
        <svg class="close-icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>

    <!-- フォーム -->
    <form @submit.prevent="onSubmit" class="task-form" novalidate>
      <!-- タイトル -->
      <div class="form-group">
        <label for="task-title" class="form-label required">
          タスクのタイトル
        </label>
        <input
          id="task-title"
          v-model="form.title"
          type="text"
          class="form-input"
          :class="{ 'error': errors.title }"
          placeholder="何をする必要がありますか？"
          maxlength="500"
          required
          ref="titleInput"
          @blur="validateTitle"
          @input="clearError('title')"
        />
        <div class="input-meta">
          <span v-if="errors.title" class="error-text">{{ errors.title }}</span>
          <span class="char-count" :class="{ 'warning': form.title.length > 450 }">
            {{ form.title.length }}/500
          </span>
        </div>
      </div>

      <!-- 期限日 -->
      <div class="form-group">
        <label for="task-due-date" class="form-label">
          期限日
        </label>
        <input
          id="task-due-date"
          v-model="form.dueDate"
          type="date"
          class="form-input"
          :class="{ 'error': errors.dueDate }"
          :min="minDate"
          @blur="validateDueDate"
          @change="clearError('dueDate')"
        />
        <div class="input-meta">
          <span v-if="errors.dueDate" class="error-text">{{ errors.dueDate }}</span>
          <span v-else-if="form.dueDate" class="help-text">
            {{ formatDueDateInfo(form.dueDate) }}
          </span>
        </div>
      </div>

      <!-- 初期進捗（新規作成時のみ） -->
      <div v-if="!isEditMode" class="form-group">
        <label for="task-progress" class="form-label">
          初期進捗
        </label>
        <div class="progress-input-container">
          <input
            id="task-progress"
            v-model.number="form.progress"
            type="range"
            min="0"
            max="100"
            step="5"
            class="progress-slider"
          />
          <div class="progress-display">
            <span class="progress-value">{{ form.progress }}%</span>
            <div class="progress-bar-preview">
              <div class="progress-fill" :style="{ width: `${form.progress}%` }"></div>
            </div>
          </div>
        </div>
        <div class="help-text">
          スライダーで初期の進捗を設定できます
        </div>
      </div>

      <!-- ボタン -->
      <div class="form-actions">
        <button
          type="button"
          @click="onCancel"
          class="cancel-button"
          :disabled="isSubmitting"
        >
          キャンセル
        </button>
        <button
          type="submit"
          class="submit-button"
          :disabled="!isFormValid || isSubmitting"
        >
          <span v-if="isSubmitting" class="loading-spinner"></span>
          {{ isSubmitting ? '保存中...' : (isEditMode ? '更新' : '作成') }}
        </button>
      </div>
    </form>

    <!-- エラーメッセージ -->
    <div v-if="submitError" class="submit-error">
      <svg class="error-icon" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      <span>{{ submitError }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch, nextTick, onMounted } from 'vue';

// Props
const props = defineProps({
  task: {
    type: Object,
    default: null
  },
  showCloseButton: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits(['submit', 'cancel', 'close']);

// Reactive data
const titleInput = ref(null);
const isSubmitting = ref(false);
const submitError = ref('');

const form = reactive({
  title: '',
  dueDate: '',
  progress: 0
});

const errors = reactive({
  title: '',
  dueDate: ''
});

// Computed properties
const isEditMode = computed(() => !!props.task);

const minDate = computed(() => {
  const today = new Date();
  return today.toISOString().split('T')[0];
});

const isFormValid = computed(() => {
  return form.title.trim().length > 0 && 
         !errors.title && 
         !errors.dueDate;
});

// Watchers
watch(() => props.task, (newTask) => {
  if (newTask) {
    form.title = newTask.title || '';
    form.dueDate = newTask.dueDate ? newTask.dueDate.split('T')[0] : '';
    form.progress = newTask.progress || 0;
  } else {
    resetForm();
  }
}, { immediate: true });

// Lifecycle hooks
onMounted(async () => {
  await nextTick();
  titleInput.value?.focus();
});

// Methods
const formatDueDateInfo = (dateString) => {
  if (!dateString) return '';
  
  const dueDate = new Date(dateString);
  const today = new Date();
  const diffTime = dueDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return '今日が期限です';
  if (diffDays === 1) return '明日が期限です';
  if (diffDays > 1) return `${diffDays}日後が期限です`;
  if (diffDays === -1) return '昨日が期限でした';
  if (diffDays < -1) return `${Math.abs(diffDays)}日前が期限でした`;
  
  return '';
};

const validateTitle = () => {
  if (!form.title.trim()) {
    errors.title = 'タイトルは必須です';
    return false;
  }
  
  if (form.title.length > 500) {
    errors.title = 'タイトルは500文字以内で入力してください';
    return false;
  }
  
  errors.title = '';
  return true;
};

const validateDueDate = () => {
  if (!form.dueDate) {
    errors.dueDate = '';
    return true;
  }
  
  const dueDate = new Date(form.dueDate);
  if (isNaN(dueDate.getTime())) {
    errors.dueDate = '正しい日付形式で入力してください';
    return false;
  }
  
  errors.dueDate = '';
  return true;
};

const validateForm = () => {
  const titleValid = validateTitle();
  const dueDateValid = validateDueDate();
  
  return titleValid && dueDateValid;
};

const clearError = (field) => {
  if (errors[field]) {
    errors[field] = '';
  }
};

const resetForm = () => {
  form.title = '';
  form.dueDate = '';
  form.progress = 0;
  errors.title = '';
  errors.dueDate = '';
  submitError.value = '';
};

const onSubmit = async () => {
  if (!validateForm()) {
    return;
  }
  
  isSubmitting.value = true;
  submitError.value = '';
  
  try {
    const taskData = {
      title: form.title.trim()
    };
    
    if (form.dueDate) {
      taskData.dueDate = form.dueDate;
    }
    
    if (!isEditMode.value) {
      taskData.progress = form.progress;
    }
    
    await emit('submit', taskData);
    
    if (!isEditMode.value) {
      resetForm();
      await nextTick();
      titleInput.value?.focus();
    }
  } catch (error) {
    submitError.value = error.message || 'タスクの保存に失敗しました';
  } finally {
    isSubmitting.value = false;
  }
};

const onCancel = () => {
  if (!isEditMode.value) {
    resetForm();
  }
  emit('cancel');
};

const onClose = () => {
  emit('close');
};

// Public methods (for parent components)
const focus = async () => {
  await nextTick();
  titleInput.value?.focus();
};

const reset = () => {
  resetForm();
};

defineExpose({
  focus,
  reset
});
</script>

<style scoped>
.task-form-container {
  background-color: var(--bg-primary, white);
  color: var(--text-primary, #2d3748);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-lg, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
  max-width: 500px;
  width: 100%;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.form-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary, #2d3748);
}

.close-button {
  width: 32px;
  height: 32px;
  border: none;
  background-color: #f7fafc;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-button:hover {
  background-color: #edf2f7;
}

.close-icon {
  width: 18px;
  height: 18px;
  color: #718096;
}

.task-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary, #4a5568);
}

.form-label.required::after {
  content: ' *';
  color: var(--error-color, #e53e3e);
}

.form-input {
  padding: 12px 16px;
  border: 2px solid var(--border-color, #e2e8f0);
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.2s ease;
  background-color: var(--bg-primary, white);
  color: var(--text-primary, #2d3748);
}

/* 日付入力フィールドの特別なスタイリング */
.form-input[type="date"] {
  color-scheme: light dark;
  cursor: pointer;
  position: relative;
}

/* ライトモードでの日付入力 */
.form-input[type="date"]:not(.dark *) {
  background-color: #ffffff;
  color: #2d3748;
  border: 2px solid #e2e8f0;
}

/* ダークモードでの日付入力 */
.dark .form-input[type="date"] {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  border: 2px solid var(--border-color);
  color-scheme: dark;
}

/* 日付ピッカーのアイコンスタイル */
.form-input[type="date"]::-webkit-calendar-picker-indicator {
  background-color: var(--text-secondary, #718096);
  border-radius: 4px;
  cursor: pointer;
  padding: 4px;
  transition: background-color 0.2s ease;
}

.form-input[type="date"]::-webkit-calendar-picker-indicator:hover {
  background-color: var(--primary-color, #4299e1);
}

/* Firefox用の日付入力スタイル */
.form-input[type="date"]::-moz-focus-inner {
  border: 0;
}

.form-input:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

.form-input.error {
  border-color: #e53e3e;
  box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.1);
}

.input-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 20px;
}

.error-text {
  font-size: 12px;
  color: #e53e3e;
  font-weight: 500;
}

.help-text {
  font-size: 12px;
  color: #718096;
}

.char-count {
  font-size: 12px;
  color: #a0aec0;
}

.char-count.warning {
  color: #d69e2e;
  font-weight: 500;
}

/* Progress input styles */
.progress-input-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.progress-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e2e8f0;
  outline: none;
  -webkit-appearance: none;
}

.progress-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #4299e1;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.progress-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #4299e1;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.progress-display {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-value {
  font-size: 14px;
  font-weight: 500;
  color: #4a5568;
  min-width: 40px;
}

.progress-bar-preview {
  flex: 1;
  height: 8px;
  background-color: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #48bb78;
  transition: width 0.2s ease;
}

/* Button styles */
.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
}

.cancel-button,
.submit-button {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.cancel-button {
  background-color: #f7fafc;
  color: #4a5568;
  border: 2px solid #e2e8f0;
}

.cancel-button:hover:not(:disabled) {
  background-color: #edf2f7;
  border-color: #cbd5e0;
}

.submit-button {
  background-color: #4299e1;
  color: white;
  border: none;
}

.submit-button:hover:not(:disabled) {
  background-color: #3182ce;
}

.submit-button:disabled {
  background-color: #a0aec0;
  cursor: not-allowed;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Submit error styles */
.submit-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background-color: #fed7d7;
  border: 1px solid #feb2b2;
  border-radius: 8px;
  color: #c53030;
  font-size: 14px;
  margin-top: 16px;
}

.error-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* Responsive design */
@media (max-width: 640px) {
  .task-form-container {
    padding: 20px;
    margin: 16px;
  }
  
  .form-actions {
    flex-direction: column-reverse;
  }
  
  .cancel-button,
  .submit-button {
    width: 100%;
    justify-content: center;
  }
  
  .progress-display {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .progress-value {
    text-align: center;
  }
}
</style>
