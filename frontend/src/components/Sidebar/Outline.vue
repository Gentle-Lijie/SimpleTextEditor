<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '@/stores/editor'

const editorStore = useEditorStore()

interface HeadingItem {
  level: number
  text: string
  line: number
}

// Extract headings from markdown content
const headings = computed<HeadingItem[]>(() => {
  const content = editorStore.content
  const lines = content.split('\n')
  const result: HeadingItem[] = []

  lines.forEach((line, index) => {
    const match = line.match(/^(#{1,6})\s+(.+)$/)
    if (match) {
      result.push({
        level: match[1].length,
        text: match[2].trim(),
        line: index + 1
      })
    }
  })

  return result
})

const emit = defineEmits<{
  (e: 'goto-line', line: number): void
}>()

function gotoHeading(heading: HeadingItem) {
  emit('goto-line', heading.line)
}
</script>

<template>
  <div class="outline">
    <div class="outline-header">
      <span>大纲</span>
    </div>

    <div class="outline-list">
      <div
        v-for="(heading, index) in headings"
        :key="index"
        class="outline-item"
        :class="[`level-${heading.level}`]"
        @click="gotoHeading(heading)"
      >
        {{ heading.text }}
      </div>

      <div v-if="headings.length === 0" class="empty">
        暂无标题
      </div>
    </div>
  </div>
</template>

<style scoped>
.outline {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.outline-header {
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-color);
}

.outline-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.outline-item {
  padding: 6px 16px;
  font-size: 13px;
  color: var(--text-primary);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: background var(--transition-fast);
}

.outline-item:hover {
  background: var(--bg-hover);
}

.level-1 { padding-left: 16px; font-weight: 600; }
.level-2 { padding-left: 28px; font-weight: 500; }
.level-3 { padding-left: 40px; }
.level-4 { padding-left: 52px; font-size: 12px; }
.level-5 { padding-left: 64px; font-size: 12px; }
.level-6 { padding-left: 76px; font-size: 12px; color: var(--text-secondary); }

.empty {
  padding: 16px;
  text-align: center;
  font-size: 13px;
  color: var(--text-tertiary);
}
</style>
