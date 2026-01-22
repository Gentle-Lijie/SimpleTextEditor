<script setup lang="ts">
import { ref, provide, onMounted, onUnmounted } from 'vue'
import FormatButtons from './FormatButtons.vue'
import HeadingMenu from './HeadingMenu.vue'
import ListMenu from './ListMenu.vue'
import InsertMenu from './InsertMenu.vue'
import ColorPicker from './ColorPicker.vue'
import ThemeMenu from './ThemeMenu.vue'

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

// Close dropdowns when clicking outside (global listener for Teleported menus)
function handleGlobalClick(event: MouseEvent) {
  const target = event.target as HTMLElement
  // Check if click is inside a dropdown trigger or menu
  if (!target.closest('.toolbar-dropdown') && !target.closest('.dropdown-menu')) {
    closeDropdowns()
  }
}

onMounted(() => {
  document.addEventListener('click', handleGlobalClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleGlobalClick)
})
</script>

<template>
  <div class="toolbar-wrapper" :style="{'--toolbar-h': '40px'}">
    <div class="toolbar-scroll">
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
        <ThemeMenu />
      </div>
    </div>
  </div>
</template>

<style scoped>
.toolbar-wrapper {
  position: relative;
  height: var(--toolbar-h, 40px);
  background: var(--toolbar-bg);
  border-bottom: 1px solid var(--border-color);
}

.toolbar-scroll {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 8px;
  gap: 4px;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.toolbar-scroll::-webkit-scrollbar {
  display: none;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: var(--border-color);
  margin: 0 4px;
  flex-shrink: 0;
}
</style>
