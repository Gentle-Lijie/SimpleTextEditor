<script setup lang="ts">
defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
  (e: 'command', command: string, value?: string): void
  (e: 'close'): void
}>()

interface InsertOption {
  id: string
  icon: string
  label: string
  shortcut?: string
}

const insertOptions: InsertOption[] = [
  { id: 'link', icon: '🔗', label: '链接', shortcut: 'Ctrl+K' },
  { id: 'image', icon: '🖼', label: '图片' },
  { id: 'table', icon: '⊞', label: '表格' },
  { id: 'codeblock', icon: '{ }', label: '代码块' },
  { id: 'math', icon: '∑', label: '数学公式' },
  { id: 'mermaid', icon: '📊', label: 'Mermaid 图表' },
  { id: 'quote', icon: '"', label: '引用' },
  { id: 'hr', icon: '—', label: '分割线' }
]

function selectInsert(id: string) {
  emit('command', 'insert', id)
  emit('close')
}
</script>

<template>
  <div class="toolbar-dropdown">
    <button class="toolbar-btn dropdown-trigger" title="插入" @click="emit('toggle')">
      +
      <span class="dropdown-arrow">▾</span>
    </button>
    <div v-if="isOpen" class="dropdown-menu">
      <button
        v-for="opt in insertOptions"
        :key="opt.id"
        class="dropdown-item"
        @click="selectInsert(opt.id)"
      >
        <span class="item-icon">{{ opt.icon }}</span>
        <span class="item-label">{{ opt.label }}</span>
        <span v-if="opt.shortcut" class="item-shortcut">{{ opt.shortcut }}</span>
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
  font-size: 16px;
  font-weight: 500;
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
  min-width: 180px;
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
  width: 24px;
  text-align: center;
  font-size: 14px;
}

.item-label {
  flex: 1;
}

.item-shortcut {
  font-size: 11px;
  color: var(--text-tertiary);
}

/* Responsive Styles */
@media screen and (max-width: 768px) {
  .toolbar-btn {
    min-width: 36px;
    height: 36px;
    padding: 0 10px;
  }

  .dropdown-menu {
    min-width: 200px;
    max-height: 70vh;
    overflow-y: auto;
  }

  .dropdown-item {
    padding: 12px 16px;
  }

  .item-shortcut {
    display: none;
  }
}

@media screen and (max-width: 480px) {
  .toolbar-btn {
    min-width: 32px;
    height: 32px;
    font-size: 14px;
  }
}
</style>
