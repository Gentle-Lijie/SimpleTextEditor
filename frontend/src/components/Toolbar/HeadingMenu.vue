<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
  (e: 'command', command: string, value?: string): void
  (e: 'close'): void
}>()

const triggerRef = ref<HTMLElement | null>(null)
const menuPosition = ref({ top: 0, left: 0 })

watch(() => props.isOpen, (open) => {
  if (open && triggerRef.value) {
    const rect = triggerRef.value.getBoundingClientRect()
    menuPosition.value = {
      top: rect.bottom + 4,
      left: rect.left
    }
  }
})

const menuStyle = computed(() => ({
  top: `${menuPosition.value.top}px`,
  left: `${menuPosition.value.left}px`
}))

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
    <button ref="triggerRef" class="toolbar-btn dropdown-trigger" title="标题" @click="emit('toggle')">
      H
      <span class="dropdown-arrow">▾</span>
    </button>
    <Teleport to="body">
      <div v-if="isOpen" class="dropdown-menu" :style="menuStyle">
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
    </Teleport>
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
  width: var(--toolbar-h, 40px);
  min-width: var(--toolbar-h, 40px);
  height: var(--toolbar-h, 40px);
  padding: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  border-radius: 4px;
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
</style>

<style>
.dropdown-menu {
  position: fixed;
  min-width: 120px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  z-index: 10000;
  overflow: hidden;
}

.dropdown-menu .dropdown-item {
  display: block;
  width: 100%;
  padding: 8px 12px;
  text-align: left;
  color: var(--text-primary);
  transition: background var(--transition-fast);
}

.dropdown-menu .dropdown-item:hover {
  background: var(--bg-hover);
}

.dropdown-menu .heading-1 { font-size: 1.5em; font-weight: 700; }
.dropdown-menu .heading-2 { font-size: 1.3em; font-weight: 600; }
.dropdown-menu .heading-3 { font-size: 1.15em; font-weight: 600; }
.dropdown-menu .heading-4 { font-size: 1em; font-weight: 600; }
.dropdown-menu .heading-5 { font-size: 0.9em; font-weight: 600; }
.dropdown-menu .heading-6 { font-size: 0.85em; font-weight: 600; }
.dropdown-menu .heading-0 { font-size: 1em; font-weight: 400; }
</style>
