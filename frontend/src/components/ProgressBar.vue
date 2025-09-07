<template>
  <div class="progress-bar-container">
    <!-- プログレスバー本体 -->
    <div 
      class="progress-bar" 
      :class="{ 
        'completed': completed, 
        'editable': editable && !completed,
        'interactive': editable && !completed
      }"
      @click="handleBarClick"
      ref="progressBar"
    >
      <div 
        class="progress-fill" 
        :style="{ width: `${displayProgress}%` }"
        :class="progressFillClass"
      ></div>
      
      <!-- プログレス値の表示 -->
      <div class="progress-text" :class="{ 'visible': showText }">
        {{ displayProgress }}%
      </div>
    </div>
    
    <!-- 編集可能な場合のコントロール -->
    <div v-if="editable && !completed && showControls" class="progress-controls">
      <div class="slider-container">
        <input
          v-model.number="localProgress"
          type="range"
          min="0"
          max="100"
          step="5"
          class="progress-slider"
          @input="onSliderChange"
          @change="onSliderCommit"
          :aria-label="`進捗: ${localProgress}%`"
        />
        <div class="slider-labels">
          <span class="slider-label">0%</span>
          <span class="slider-label">50%</span>
          <span class="slider-label">100%</span>
        </div>
      </div>
      
      <div class="quick-actions">
        <button
          v-for="value in quickValues"
          :key="value"
          @click="setProgress(value)"
          class="quick-button"
          :class="{ 'active': localProgress === value }"
          :aria-label="`進捗を${value}%に設定`"
        >
          {{ value }}%
        </button>
      </div>
    </div>
    
    <!-- 進捗統計情報（詳細モード） -->
    <div v-if="showStats && !minimal" class="progress-stats">
      <div class="stat-item">
        <span class="stat-label">開始日:</span>
        <span class="stat-value">{{ formatDate(createdAt) }}</span>
      </div>
      <div v-if="lastUpdated" class="stat-item">
        <span class="stat-label">更新日:</span>
        <span class="stat-value">{{ formatDate(lastUpdated) }}</span>
      </div>
      <div v-if="estimatedCompletion" class="stat-item">
        <span class="stat-label">完了予想:</span>
        <span class="stat-value">{{ estimatedCompletion }}</span>
      </div>
    </div>
    
    <!-- エラーメッセージ -->
    <div v-if="error" class="progress-error">
      <svg class="error-icon" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      <span>{{ error }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';

// Props
const props = defineProps({
  progress: {
    type: Number,
    default: 0,
    validator: (value) => value >= 0 && value <= 100
  },
  completed: {
    type: Boolean,
    default: false
  },
  editable: {
    type: Boolean,
    default: true
  },
  showControls: {
    type: Boolean,
    default: false
  },
  showText: {
    type: Boolean,
    default: true
  },
  showStats: {
    type: Boolean,
    default: false
  },
  minimal: {
    type: Boolean,
    default: false
  },
  animated: {
    type: Boolean,
    default: true
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  color: {
    type: String,
    default: 'blue',
    validator: (value) => ['blue', 'green', 'orange', 'red'].includes(value)
  },
  createdAt: {
    type: String,
    default: null
  },
  lastUpdated: {
    type: String,
    default: null
  }
});

// Emits
const emit = defineEmits(['update', 'change']);

// Reactive data
const progressBar = ref(null);
const localProgress = ref(props.progress);
const error = ref('');
const isAnimating = ref(false);

// Quick action values
const quickValues = [0, 25, 50, 75, 100];

// Computed properties
const displayProgress = computed(() => {
  return Math.max(0, Math.min(100, localProgress.value));
});

const progressFillClass = computed(() => {
  const classes = [`fill-${props.color}`, `size-${props.size}`];
  
  if (props.completed) {
    classes.push('completed');
  }
  
  if (props.animated && isAnimating.value) {
    classes.push('animated');
  }
  
  return classes;
});

const estimatedCompletion = computed(() => {
  if (!props.createdAt || localProgress.value === 0) return null;
  
  const created = new Date(props.createdAt);
  const now = new Date();
  const elapsed = now - created;
  const rate = localProgress.value / elapsed;
  const remaining = (100 - localProgress.value) / rate;
  const completion = new Date(now.getTime() + remaining);
  
  if (remaining < 0 || !isFinite(remaining)) return null;
  
  return formatDate(completion.toISOString());
});

// Watchers
watch(() => props.progress, (newProgress) => {
  if (newProgress !== localProgress.value) {
    animateProgress(newProgress);
  }
});

// Methods
const formatDate = (dateString) => {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const animateProgress = async (targetProgress) => {
  if (!props.animated) {
    localProgress.value = targetProgress;
    return;
  }
  
  isAnimating.value = true;
  const startProgress = localProgress.value;
  const duration = 300;
  const startTime = performance.now();
  
  const animate = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    localProgress.value = startProgress + (targetProgress - startProgress) * progress;
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      isAnimating.value = false;
      localProgress.value = targetProgress;
    }
  };
  
  requestAnimationFrame(animate);
};

const handleBarClick = (event) => {
  if (!props.editable || props.completed) return;
  
  const rect = progressBar.value.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const percentage = Math.round((clickX / rect.width) * 100);
  const newProgress = Math.max(0, Math.min(100, percentage));
  
  setProgress(newProgress);
};

const setProgress = (value) => {
  const newProgress = Math.max(0, Math.min(100, value));
  
  if (newProgress !== localProgress.value) {
    localProgress.value = newProgress;
    emit('update', newProgress);
    emit('change', newProgress);
  }
};

const onSliderChange = () => {
  emit('update', localProgress.value);
};

const onSliderCommit = () => {
  emit('change', localProgress.value);
};

const validateProgress = (value) => {
  if (typeof value !== 'number' || isNaN(value)) {
    error.value = '進捗は数値で入力してください';
    return false;
  }
  
  if (value < 0 || value > 100) {
    error.value = '進捗は0%から100%の間で入力してください';
    return false;
  }
  
  error.value = '';
  return true;
};

// Public methods
const updateProgress = (value) => {
  if (validateProgress(value)) {
    setProgress(value);
  }
};

const reset = () => {
  setProgress(0);
  error.value = '';
};

const complete = () => {
  setProgress(100);
};

defineExpose({
  updateProgress,
  reset,
  complete
});
</script>

<style scoped>
.progress-bar-container {
  width: 100%;
}

/* Progress bar styles */
.progress-bar {
  position: relative;
  background-color: #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.progress-bar.size-small {
  height: 6px;
}

.progress-bar.size-medium {
  height: 8px;
}

.progress-bar.size-large {
  height: 12px;
}

.progress-bar.editable {
  cursor: pointer;
}

.progress-bar.interactive:hover {
  background-color: #cbd5e0;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.progress-bar.completed {
  background-color: #c6f6d5;
  box-shadow: 0 0 0 1px #48bb78;
}

/* Progress fill styles */
.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
  position: relative;
}

.progress-fill.animated {
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-fill.fill-blue {
  background: linear-gradient(90deg, #4299e1 0%, #3182ce 100%);
}

.progress-fill.fill-green {
  background: linear-gradient(90deg, #48bb78 0%, #38a169 100%);
}

.progress-fill.fill-orange {
  background: linear-gradient(90deg, #ed8936 0%, #dd6b20 100%);
}

.progress-fill.fill-red {
  background: linear-gradient(90deg, #f56565 0%, #e53e3e 100%);
}

.progress-fill.completed {
  background: linear-gradient(90deg, #48bb78 0%, #38a169 100%);
}

/* Progress text */
.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 10px;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.progress-text.visible {
  opacity: 1;
}

.progress-bar.size-large .progress-text {
  font-size: 11px;
}

/* Controls */
.progress-controls {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.slider-container {
  position: relative;
}

.progress-slider {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: #e2e8f0;
  outline: none;
  -webkit-appearance: none;
  cursor: pointer;
}

.progress-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #4299e1;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.progress-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #4299e1;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
}

.slider-label {
  font-size: 10px;
  color: #a0aec0;
}

.quick-actions {
  display: flex;
  gap: 6px;
  justify-content: center;
  flex-wrap: wrap;
}

.quick-button {
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background-color: white;
  font-size: 11px;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-button:hover {
  background-color: #f7fafc;
  border-color: #cbd5e0;
}

.quick-button.active {
  background-color: #4299e1;
  color: white;
  border-color: #4299e1;
}

/* Stats */
.progress-stats {
  margin-top: 12px;
  padding: 12px;
  background-color: #f7fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.stat-item:last-child {
  margin-bottom: 0;
}

.stat-label {
  font-size: 12px;
  color: #718096;
  font-weight: 500;
}

.stat-value {
  font-size: 12px;
  color: #4a5568;
}

/* Error */
.progress-error {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 8px 12px;
  background-color: #fed7d7;
  border: 1px solid #feb2b2;
  border-radius: 6px;
  color: #c53030;
  font-size: 12px;
}

.error-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

/* Responsive design */
@media (max-width: 640px) {
  .progress-controls {
    margin-top: 12px;
  }
  
  .quick-actions {
    gap: 4px;
  }
  
  .quick-button {
    padding: 6px 10px;
    font-size: 12px;
  }
  
  .progress-stats {
    padding: 10px;
  }
  
  .stat-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }
}

/* Animations */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.progress-fill.animated {
  animation: pulse 2s ease-in-out infinite;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .progress-bar {
    border: 1px solid #000;
  }
  
  .progress-fill {
    background: #000 !important;
  }
  
  .progress-text {
    color: #fff;
    text-shadow: none;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .progress-fill,
  .progress-bar,
  .quick-button {
    transition: none;
  }
  
  .progress-fill.animated {
    animation: none;
  }
}
</style>
