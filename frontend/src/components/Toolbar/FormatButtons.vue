<script setup lang="ts">
const emit = defineEmits<{
  (e: 'command', command: string, value?: string): void
}>()

interface FormatButton {
  id: string
  icon: string
  title: string
  shortcut: string
}

const buttons: FormatButton[] = [
  { id: 'bold', icon: 'B', title: '粗体', shortcut: 'Ctrl+B' },
  { id: 'italic', icon: 'I', title: '斜体', shortcut: 'Ctrl+I' },
  { id: 'strikethrough', icon: 'S', title: '删除线', shortcut: 'Ctrl+Shift+S' },
  { id: 'underline', icon: 'U', title: '下划线', shortcut: 'Ctrl+U' },
  { id: 'code', icon: '< >', title: '行内代码', shortcut: 'Ctrl+`' },
  { id: 'mark', icon: '==', title: '高亮', shortcut: '' }
]

function handleClick(id: string) {
  emit('command', id)
}
</script>

<template>
  <button
    v-for="btn in buttons"
    :key="btn.id"
    class="toolbar-btn"
    :class="{ 'btn-bold': btn.id === 'bold', 'btn-italic': btn.id === 'italic', 'btn-strike': btn.id === 'strikethrough', 'btn-underline': btn.id === 'underline' }"
    :title="`${btn.title}${btn.shortcut ? ' (' + btn.shortcut + ')' : ''}`"
    @click="handleClick(btn.id)"
  >
    {{ btn.icon }}
  </button>
</template>

<style scoped>
.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 6px;
  font-size: 13px;
  color: var(--text-primary);
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
}

.toolbar-btn:hover {
  background: var(--toolbar-button-hover);
}

.toolbar-btn:active {
  background: var(--toolbar-button-active);
}

.btn-bold {
  font-weight: 700;
}

.btn-italic {
  font-style: italic;
  font-family: serif;
}

.btn-strike {
  text-decoration: line-through;
}

.btn-underline {
  text-decoration: underline;
}

/* Responsive Styles */
@media screen and (max-width: 768px) {
  .toolbar-btn {
    min-width: 36px;
    height: 36px;
    padding: 0 8px;
    font-size: 14px;
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
