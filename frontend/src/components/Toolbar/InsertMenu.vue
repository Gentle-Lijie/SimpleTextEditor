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
const menuPosition = ref({ top: 0, right: 0 })

watch(() => props.isOpen, (open) => {
  if (open && triggerRef.value) {
    const rect = triggerRef.value.getBoundingClientRect()
    menuPosition.value = {
      top: rect.bottom + 4,
      right: window.innerWidth - rect.right
    }
  }
})

const menuStyle = computed(() => ({
  top: `${menuPosition.value.top}px`,
  right: `${menuPosition.value.right}px`
}))

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
    <button ref="triggerRef" class="toolbar-btn dropdown-trigger" title="插入" @click="emit('toggle')">
      +
      <span class="dropdown-arrow">▾</span>
    </button>
    <Teleport to="body">
      <div v-if="isOpen" class="dropdown-menu insert-menu" :style="menuStyle">
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
  font-size: 16px;
  font-weight: 500;
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
.insert-menu.dropdown-menu {
  min-width: 180px;
}

.insert-menu .dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.insert-menu .item-icon {
  width: 24px;
  text-align: center;
  font-size: 14px;
}

.insert-menu .item-label {
  flex: 1;
}

.insert-menu .item-shortcut {
  font-size: 11px;
  color: var(--text-tertiary);
}
</style>
