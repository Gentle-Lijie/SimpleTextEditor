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
    <button ref="triggerRef" class="toolbar-btn dropdown-trigger" title="列表" @click="emit('toggle')">
      ≡
      <span class="dropdown-arrow">▾</span>
    </button>
    <Teleport to="body">
      <div v-if="isOpen" class="dropdown-menu list-menu" :style="menuStyle">
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
.list-menu.dropdown-menu {
  min-width: 140px;
}

.list-menu .dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.list-menu .item-icon {
  width: 20px;
  text-align: center;
  font-size: 14px;
}
</style>
