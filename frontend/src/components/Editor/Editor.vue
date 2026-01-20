<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEditorStore } from '@/stores/editor'
import SourceEditor from './SourceEditor.vue'
import Preview from './Preview.vue'

const editorStore = useEditorStore()
const sourceEditorRef = ref<InstanceType<typeof SourceEditor> | null>(null)

const showSource = computed(() =>
  editorStore.mode === 'source' || editorStore.mode === 'split'
)

const showPreview = computed(() =>
  editorStore.mode === 'preview' || editorStore.mode === 'split'
)

// Expose source editor ref for toolbar operations
defineExpose({
  getSourceEditor: () => sourceEditorRef.value
})
</script>

<template>
  <div class="editor" :class="[`mode-${editorStore.mode}`]">
    <div v-if="showSource" class="editor-pane source-pane">
      <SourceEditor ref="sourceEditorRef" />
    </div>
    <div v-if="editorStore.mode === 'split'" class="editor-divider"></div>
    <div v-if="showPreview" class="editor-pane preview-pane">
      <Preview />
    </div>
  </div>
</template>

<style scoped>
.editor {
  display: flex;
  flex: 1;
  height: 100%;
  overflow: hidden;
}

.editor-pane {
  overflow: hidden;
}

.mode-source .source-pane {
  flex: 1;
}

.mode-preview .preview-pane {
  flex: 1;
}

.mode-split .source-pane,
.mode-split .preview-pane {
  flex: 1;
  min-width: 0;
}

.editor-divider {
  width: 1px;
  background: var(--border-color);
  flex-shrink: 0;
}

/* WYSIWYG mode will be implemented later */
.mode-wysiwyg .source-pane {
  display: none;
}

.mode-wysiwyg .preview-pane {
  flex: 1;
}
</style>
