<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
  (e: 'command', command: string, value?: string): void
  (e: 'close'): void
}>()

const textColors = [
  { name: '黑色', value: '#000000' },
  { name: '灰色', value: '#666666' },
  { name: '红色', value: '#e53935' },
  { name: '橙色', value: '#fb8c00' },
  { name: '黄色', value: '#fdd835' },
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

const activeTab = ref<'text' | 'bg'>('text')
const customColor = ref('#000000')

function selectTextColor(color: string) {
  emit('command', 'textColor', color)
  emit('close')
}

function selectBgColor(color: string) {
  emit('command', 'bgColor', color)
  emit('close')
}

function applyCustomColor() {
  if (activeTab.value === 'text') {
    emit('command', 'textColor', customColor.value)
  } else {
    emit('command', 'bgColor', customColor.value)
  }
  emit('close')
}
</script>

<template>
  <div class="toolbar-dropdown">
    <button class="toolbar-btn dropdown-trigger" title="颜色" @click="emit('toggle')">
      <span class="color-icon">A</span>
      <span class="dropdown-arrow">▾</span>
    </button>
    <div v-if="isOpen" class="dropdown-menu color-picker">
      <div class="tabs">
        <button
          class="tab"
          :class="{ active: activeTab === 'text' }"
          @click="activeTab = 'text'"
        >
          文字颜色
        </button>
        <button
          class="tab"
          :class="{ active: activeTab === 'bg' }"
          @click="activeTab = 'bg'"
        >
          背景色
        </button>
      </div>

      <div v-if="activeTab === 'text'" class="color-grid">
        <button
          v-for="color in textColors"
          :key="color.value"
          class="color-swatch"
          :style="{ backgroundColor: color.value }"
          :title="color.name"
          @click="selectTextColor(color.value)"
        />
      </div>

      <div v-else class="color-grid">
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
      </div>

      <div class="custom-color">
        <label>
          <input
            v-model="customColor"
            type="color"
            class="color-input"
          />
          <span>自定义</span>
        </label>
        <button class="apply-btn" @click="applyCustomColor">应用</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.toolbar-dropdown {
  position: relative;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 8px;
  font-size: 13px;
  color: var(--text-primary);
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
}

.toolbar-btn:hover {
  background: var(--toolbar-button-hover);
}

.color-icon {
  font-weight: 700;
  border-bottom: 3px solid var(--accent-primary);
  line-height: 1;
  padding-bottom: 2px;
}

.dropdown-trigger {
  gap: 4px;
}

.dropdown-arrow {
  font-size: 10px;
  color: var(--text-secondary);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  z-index: 100;
  overflow: hidden;
}

.color-picker {
  width: 200px;
  padding: 8px;
}

.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}

.tab {
  flex: 1;
  padding: 6px 8px;
  font-size: 12px;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.tab:hover {
  color: var(--text-primary);
}

.tab.active {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin-bottom: 8px;
}

.color-swatch {
  width: 100%;
  aspect-ratio: 1;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: transform var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.color-swatch:hover {
  transform: scale(1.1);
}

.swatch-transparent {
  background: repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 10px 10px !important;
}

.no-color {
  color: var(--text-tertiary);
  font-size: 12px;
}

.custom-color {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--border-color);
}

.custom-color label {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
}

.color-input {
  width: 24px;
  height: 24px;
  padding: 0;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.apply-btn {
  padding: 4px 10px;
  font-size: 12px;
  color: var(--text-primary);
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
}

.apply-btn:hover {
  background: var(--bg-hover);
}
</style>
