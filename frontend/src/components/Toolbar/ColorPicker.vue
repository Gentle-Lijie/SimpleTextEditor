<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'command', command: string, value?: string): void
}>()

const textColors = [
  { name: '黑色', value: '#000000' },
  { name: '红色', value: '#e53935' },
  { name: '橙色', value: '#fb8c00' },
  { name: '绿色', value: '#43a047' },
  { name: '蓝色', value: '#1e88e5' },
  { name: '紫色', value: '#8e24aa' }
]

const bgColors = [
  { name: '无', value: 'transparent' },
  { name: '黄色', value: '#fff9c4' },
  { name: '绿色', value: '#c8e6c9' },
  { name: '蓝色', value: '#bbdefb' },
  { name: '粉色', value: '#f8bbd9' },
  { name: '灰色', value: '#e0e0e0' }
]

const showCustomPicker = ref(false)
const customPickerType = ref<'text' | 'bg'>('text')
const customColor = ref('#000000')

function selectTextColor(color: string) {
  emit('command', 'textColor', color)
}

function selectBgColor(color: string) {
  emit('command', 'bgColor', color)
}

function openCustomPicker(type: 'text' | 'bg') {
  customPickerType.value = type
  showCustomPicker.value = true
}

function applyCustomColor() {
  if (customPickerType.value === 'text') {
    emit('command', 'textColor', customColor.value)
  } else {
    emit('command', 'bgColor', customColor.value)
  }
  showCustomPicker.value = false
}

function closeCustomPicker() {
  showCustomPicker.value = false
}
</script>

<template>
  <div class="color-picker-inline">
    <!-- Text Colors -->
    <div class="color-section">
      <span class="color-label">字色</span>
      <div class="color-swatches">
        <button
          v-for="color in textColors"
          :key="color.value"
          class="color-swatch"
          :style="{ backgroundColor: color.value }"
          :title="color.name"
          @click="selectTextColor(color.value)"
        />
        <button
          class="color-swatch custom-swatch"
          title="自定义颜色"
          @click="openCustomPicker('text')"
        >
          <span class="custom-icon">+</span>
        </button>
      </div>
    </div>

    <div class="section-divider"></div>

    <!-- Background Colors -->
    <div class="color-section">
      <span class="color-label">底色</span>
      <div class="color-swatches">
        <button
          v-for="color in bgColors"
          :key="color.value"
          class="color-swatch"
          :class="{ 'swatch-transparent': color.value === 'transparent' }"
          :style="{ backgroundColor: color.value === 'transparent' ? '#fff' : color.value }"
          :title="color.name"
          @click="selectBgColor(color.value)"
        >
          <span v-if="color.value === 'transparent'" class="no-color">✕</span>
        </button>
        <button
          class="color-swatch custom-swatch"
          title="自定义颜色"
          @click="openCustomPicker('bg')"
        >
          <span class="custom-icon">+</span>
        </button>
      </div>
    </div>

    <!-- Custom Color Picker Popover -->
    <div v-if="showCustomPicker" class="custom-picker-overlay" @click="closeCustomPicker">
      <div class="custom-picker-popover" @click.stop>
        <div class="picker-header">
          {{ customPickerType === 'text' ? '自定义字色' : '自定义底色' }}
        </div>
        <div class="picker-content">
          <input
            v-model="customColor"
            type="color"
            class="color-input"
          />
          <span class="color-value">{{ customColor }}</span>
        </div>
        <div class="picker-actions">
          <button class="cancel-btn" @click="closeCustomPicker">取消</button>
          <button class="apply-btn" @click="applyCustomColor">应用</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.color-picker-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

.color-section {
  display: flex;
  align-items: center;
  gap: 6px;
}

.color-label {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.color-swatches {
  display: flex;
  gap: 3px;
}

.color-swatch {
  width: 20px;
  height: 20px;
  border-radius: 3px;
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.color-swatch:hover {
  transform: scale(1.15);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.swatch-transparent {
  background: repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 8px 8px !important;
}

.no-color {
  color: var(--text-tertiary);
  font-size: 10px;
}

.custom-swatch {
  background: var(--bg-tertiary);
  border-style: dashed;
}

.custom-icon {
  font-size: 14px;
  color: var(--text-secondary);
}

.section-divider {
  width: 1px;
  height: 20px;
  background: var(--border-color);
}

/* Custom Picker Popover */
.custom-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.custom-picker-popover {
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: 16px;
  min-width: 200px;
}

.picker-header {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.picker-content {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.color-input {
  width: 60px;
  height: 40px;
  padding: 0;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.color-value {
  font-size: 13px;
  color: var(--text-secondary);
  font-family: monospace;
}

.picker-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.cancel-btn,
.apply-btn {
  padding: 6px 12px;
  font-size: 13px;
  border-radius: var(--radius-sm);
}

.cancel-btn {
  color: var(--text-secondary);
}

.cancel-btn:hover {
  background: var(--bg-hover);
}

.apply-btn {
  background: var(--accent-primary);
  color: white;
}

.apply-btn:hover {
  opacity: 0.9;
}
</style>
