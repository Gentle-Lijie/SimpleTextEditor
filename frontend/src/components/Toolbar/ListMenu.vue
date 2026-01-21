<script setup lang="ts">
defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
  (e: 'command', command: string, value?: string): void
  (e: 'close'): void
}>()

interface ListOption {
  id: string
  icon: string
  label: string
}

const listOptions: ListOption[] = [
  { id: 'ul', icon: '•', label: '无序列表' },
  { id: 'ol', icon: '1.', label: '有序列表' },
  { id: 'task', icon: '☑', label: '任务列表' }
]

function selectList(id: string) {
  emit('command', 'list', id)
  emit('close')
}
</script>

<template>
  <div class="toolbar-dropdown">
    <button class="toolbar-btn dropdown-trigger" title="列表" @click="emit('toggle')">
      ≡
      <span class="dropdown-arrow">▾</span>
    </button>
    <div v-if="isOpen" class="dropdown-menu">
      <button
        v-for="opt in listOptions"
        :key="opt.id"
        class="dropdown-item"
        @click="selectList(opt.id)"
      >
        <span class="item-icon">{{ opt.icon }}</span>
        <span>{{ opt.label }}</span>
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
  min-width: 140px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  z-index: 100;
  overflow: hidden;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  text-align: left;
  color: var(--text-primary);
  transition: background var(--transition-fast);
}

.dropdown-item:hover {
  background: var(--bg-hover);
}

.item-icon {
  width: 20px;
  text-align: center;
  font-size: 14px;
}

/* Responsive Styles */
@media screen and (max-width: 768px) {
  .toolbar-btn {
    min-width: 36px;
    height: 36px;
    padding: 0 10px;
    font-size: 14px;
  }

  .dropdown-menu {
    min-width: 160px;
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
