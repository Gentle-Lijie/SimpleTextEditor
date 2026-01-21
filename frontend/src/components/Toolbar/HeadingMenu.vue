<script setup lang="ts">
defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
  (e: 'command', command: string, value?: string): void
  (e: 'close'): void
}>()

interface HeadingOption {
  level: number
  label: string
}

const headings: HeadingOption[] = [
  { level: 1, label: '标题 1' },
  { level: 2, label: '标题 2' },
  { level: 3, label: '标题 3' },
  { level: 4, label: '标题 4' },
  { level: 5, label: '标题 5' },
  { level: 6, label: '标题 6' },
  { level: 0, label: '正文' }
]

function selectHeading(level: number) {
  emit('command', 'heading', String(level))
  emit('close')
}
</script>

<template>
  <div class="toolbar-dropdown">
    <button class="toolbar-btn dropdown-trigger" title="标题" @click="emit('toggle')">
      H
      <span class="dropdown-arrow">▾</span>
    </button>
    <div v-if="isOpen" class="dropdown-menu">
      <button
        v-for="h in headings"
        :key="h.level"
        class="dropdown-item"
        :class="[`heading-${h.level}`]"
        @click="selectHeading(h.level)"
      >
        {{ h.label }}
      </button>
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
  font-weight: 600;
  color: var(--text-primary);
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
}

.toolbar-btn:hover {
  background: var(--toolbar-button-hover);
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
  min-width: 120px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  z-index: 100;
  overflow: hidden;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 8px 12px;
  text-align: left;
  color: var(--text-primary);
  transition: background var(--transition-fast);
}

.dropdown-item:hover {
  background: var(--bg-hover);
}

.heading-1 { font-size: 1.5em; font-weight: 700; }
.heading-2 { font-size: 1.3em; font-weight: 600; }
.heading-3 { font-size: 1.15em; font-weight: 600; }
.heading-4 { font-size: 1em; font-weight: 600; }
.heading-5 { font-size: 0.9em; font-weight: 600; }
.heading-6 { font-size: 0.85em; font-weight: 600; }
.heading-0 { font-size: 1em; font-weight: 400; }

/* Responsive Styles */
@media screen and (max-width: 768px) {
  .toolbar-btn {
    min-width: 36px;
    height: 36px;
    padding: 0 10px;
    font-size: 14px;
  }

  .dropdown-menu {
    min-width: 140px;
    max-height: 70vh;
    overflow-y: auto;
  }

  .dropdown-item {
    padding: 12px 16px;
  }
}

@media screen and (max-width: 480px) {
  .toolbar-btn {
    min-width: 32px;
    height: 32px;
    font-size: 13px;
  }
}
</style>
