<script setup lang="ts">
import { ref, provide } from 'vue'
import FormatButtons from './FormatButtons.vue'
import HeadingMenu from './HeadingMenu.vue'
import ListMenu from './ListMenu.vue'
import InsertMenu from './InsertMenu.vue'
import ColorPicker from './ColorPicker.vue'
import ExportMenu from './ExportMenu.vue'

// Provide a way for child components to execute editor commands
const emit = defineEmits<{
  (e: 'command', command: string, value?: string): void
}>()

function executeCommand(command: string, value?: string) {
  emit('command', command, value)
}

provide('executeCommand', executeCommand)

// Dropdown states
const activeDropdown = ref<string | null>(null)

function toggleDropdown(name: string) {
  activeDropdown.value = activeDropdown.value === name ? null : name
}

function closeDropdowns() {
  activeDropdown.value = null
}

// Close dropdowns when clicking outside
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.toolbar-dropdown')) {
    closeDropdowns()
  }
}
</script>

<template>
  <div class="toolbar" @click="handleClickOutside">
    <div class="toolbar-group">
      <FormatButtons @command="executeCommand" />
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-group">
      <HeadingMenu
        :is-open="activeDropdown === 'heading'"
        @toggle="toggleDropdown('heading')"
        @command="executeCommand"
        @close="closeDropdowns"
      />
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-group">
      <ListMenu
        :is-open="activeDropdown === 'list'"
        @toggle="toggleDropdown('list')"
        @command="executeCommand"
        @close="closeDropdowns"
      />
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-group">
      <InsertMenu
        :is-open="activeDropdown === 'insert'"
        @toggle="toggleDropdown('insert')"
        @command="executeCommand"
        @close="closeDropdowns"
      />
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-group">
      <ColorPicker @command="executeCommand" />
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-group">
      <ExportMenu @close="closeDropdowns" />
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  padding: 4px 12px;
  background: var(--toolbar-bg);
  border-bottom: 1px solid var(--border-color);
  gap: 4px;
  flex-wrap: wrap;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 2px;
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: var(--border-color);
  margin: 0 4px;
}
</style>
