<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  visible: boolean
  position: { x: number; y: number }
  selectedElement?: HTMLElement | null
}>()

const emit = defineEmits<{
  command: [command: string, value?: string]
  close: []
}>()

// Active dropdown
const activeDropdown = ref<string | null>(null)

// Color presets
const textColors = [
  '#000000', '#e53935', '#d81b60', '#8e24aa',
  '#5e35b1', '#3949ab', '#1e88e5', '#039be5',
  '#00acc1', '#00897b', '#43a047', '#7cb342',
  '#c0ca33', '#fdd835', '#ffb300', '#fb8c00'
]

const highlightColors = [
  '#ffeb3b', '#fff59d', '#ffe082', '#ffcc80',
  '#b3e5fc', '#b2dfdb', '#c8e6c9', '#f8bbd0'
]

// Heading options
const headings = [
  { level: 1, label: 'H1' },
  { level: 2, label: 'H2' },
  { level: 3, label: 'H3' },
  { level: 4, label: 'H4' },
  { level: 5, label: 'H5' },
  { level: 6, label: 'H6' }
]

// Execute command
function executeCommand(command: string, value?: string) {
  emit('command', command, value)
  activeDropdown.value = null
}

// Toggle dropdown
function toggleDropdown(name: string, event: MouseEvent) {
  event.stopPropagation()
  activeDropdown.value = activeDropdown.value === name ? null : name
}

// Close dropdown when clicking outside
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.dropdown-menu')) {
    activeDropdown.value = null
  }
}

// Close on escape
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close')
  }
}

// Computed style for positioning
const toolbarStyle = computed(() => ({
  left: `${props.position.x}px`,
  top: `${props.position.y}px`
}))

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// Close dropdowns when toolbar closes
watch(() => props.visible, (visible) => {
  if (!visible) {
    activeDropdown.value = null
  }
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="selection-toolbar"
      :style="toolbarStyle"
      @click="handleClickOutside"
    >
      <!-- Bold -->
      <button class="toolbar-btn" title="粗体 (Ctrl+B)" @click="executeCommand('bold')">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path fill="currentColor" d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/>
        </svg>
      </button>

      <!-- Italic -->
      <button class="toolbar-btn" title="斜体 (Ctrl+I)" @click="executeCommand('italic')">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path fill="currentColor" d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/>
        </svg>
      </button>

      <!-- Underline -->
      <button class="toolbar-btn" title="下划线 (Ctrl+U)" @click="executeCommand('underline')">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path fill="currentColor" d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/>
        </svg>
      </button>

      <!-- Strikethrough -->
      <button class="toolbar-btn" title="删除线" @click="executeCommand('strikethrough')">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path fill="currentColor" d="M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z"/>
        </svg>
      </button>

      <div class="toolbar-divider"></div>

      <!-- Highlight Color -->
      <div class="toolbar-dropdown">
        <button
          class="toolbar-btn"
          :class="{ active: activeDropdown === 'highlight' }"
          title="高亮"
          @click="toggleDropdown('highlight', $event)"
        >
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M16.56 8.94L7.62 0 6.21 1.41l2.38 2.38-5.15 5.15c-.59.59-.59 1.54 0 2.12l5.5 5.5c.29.29.68.44 1.06.44s.77-.15 1.06-.44l5.5-5.5c.59-.58.59-1.53 0-2.12zM5.21 10L10 5.21 14.79 10H5.21zM19 11.5s-2 2.17-2 3.5c0 1.1.9 2 2 2s2-.9 2-2c0-1.33-2-3.5-2-3.5z"/>
            <rect x="2" y="20" width="20" height="4" fill="#ffeb3b"/>
          </svg>
        </button>
        <div v-if="activeDropdown === 'highlight'" class="dropdown-menu color-grid" @click.stop>
          <button
            v-for="color in highlightColors"
            :key="color"
            class="color-swatch"
            :style="{ background: color }"
            :title="color"
            @click="executeCommand('highlight', color)"
          ></button>
        </div>
      </div>

      <!-- Text Color -->
      <div class="toolbar-dropdown">
        <button
          class="toolbar-btn"
          :class="{ active: activeDropdown === 'color' }"
          title="文字颜色"
          @click="toggleDropdown('color', $event)"
        >
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M11 2L5.5 16h2.25l1.12-3h6.25l1.12 3h2.25L13 2h-2zm-1.38 9L12 4.67 14.38 11H9.62z"/>
            <rect x="2" y="20" width="20" height="4" fill="#e53935"/>
          </svg>
        </button>
        <div v-if="activeDropdown === 'color'" class="dropdown-menu color-grid" @click.stop>
          <button
            v-for="color in textColors"
            :key="color"
            class="color-swatch"
            :style="{ background: color }"
            :title="color"
            @click="executeCommand('foreColor', color)"
          ></button>
        </div>
      </div>

      <div class="toolbar-divider"></div>

      <!-- Heading -->
      <div class="toolbar-dropdown">
        <button
          class="toolbar-btn heading-btn"
          :class="{ active: activeDropdown === 'heading' }"
          title="标题"
          @click="toggleDropdown('heading', $event)"
        >
          <span>H<sub>1</sub></span>
        </button>
        <div v-if="activeDropdown === 'heading'" class="dropdown-menu heading-menu" @click.stop>
          <button
            v-for="h in headings"
            :key="h.level"
            class="heading-option"
            @click="executeCommand('heading', h.level.toString())"
          >
            {{ h.label }}
          </button>
        </div>
      </div>

      <div class="toolbar-divider"></div>

      <!-- Quote -->
      <button class="toolbar-btn" title="引用" @click="executeCommand('quote')">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path fill="currentColor" d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
        </svg>
      </button>

      <!-- Task List -->
      <button class="toolbar-btn" title="任务列表" @click="executeCommand('taskList')">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </button>

      <!-- Center -->
      <button class="toolbar-btn" title="居中 (Ctrl+E)" @click="executeCommand('center')">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path fill="currentColor" d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z"/>
        </svg>
      </button>

      <div class="toolbar-divider"></div>

      <!-- Image -->
      <button class="toolbar-btn" title="图片" @click="executeCommand('image')">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
        </svg>
      </button>

      <!-- Link -->
      <button class="toolbar-btn" title="链接" @click="executeCommand('link')">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path fill="currentColor" d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
        </svg>
      </button>

      <!-- Code -->
      <button class="toolbar-btn" title="代码" @click="executeCommand('code')">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path fill="currentColor" d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
        </svg>
      </button>

      <!-- More Options -->
      <div class="toolbar-dropdown">
        <button
          class="toolbar-btn"
          :class="{ active: activeDropdown === 'more' }"
          title="更多"
          @click="toggleDropdown('more', $event)"
        >
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
        </button>
        <div v-if="activeDropdown === 'more'" class="dropdown-menu more-menu" @click.stop>
          <button class="menu-item" @click="executeCommand('superscript')">
            <span>X<sup>2</sup></span>
            <span class="menu-label">上标</span>
          </button>
          <button class="menu-item" @click="executeCommand('subscript')">
            <span>X<sub>2</sub></span>
            <span class="menu-label">下标</span>
          </button>
          <button class="menu-item" @click="executeCommand('inlineCode')">
            <svg viewBox="0 0 24 24" width="14" height="14">
              <path fill="currentColor" d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
            </svg>
            <span class="menu-label">行内代码</span>
          </button>
          <button class="menu-item" @click="executeCommand('codeBlock')">
            <svg viewBox="0 0 24 24" width="14" height="14">
              <path fill="currentColor" d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
            </svg>
            <span class="menu-label">代码块</span>
          </button>
          <button class="menu-item" @click="executeCommand('horizontalRule')">
            <svg viewBox="0 0 24 24" width="14" height="14">
              <path fill="currentColor" d="M4 11h16v2H4z"/>
            </svg>
            <span class="menu-label">分割线</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.selection-toolbar {
  position: fixed;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 6px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  transform: translateX(-50%);
  animation: fadeIn 0.15s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.toolbar-btn:hover {
  background: var(--bg-hover);
}

.toolbar-btn.active {
  background: var(--bg-active);
  color: var(--accent-primary);
}

.toolbar-btn svg {
  flex-shrink: 0;
}

.heading-btn {
  font-size: 13px;
  font-weight: 600;
}

.heading-btn sub {
  font-size: 9px;
}

.toolbar-divider {
  width: 1px;
  height: 16px;
  background: var(--border-color);
  margin: 0 2px;
}

.toolbar-dropdown {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 10;
  animation: dropdownFadeIn 0.15s ease;
}

@keyframes dropdownFadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  padding: 8px;
  width: 140px;
}

.color-swatch {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: transform var(--transition-fast);
}

.color-swatch:hover {
  transform: scale(1.1);
  border-color: var(--text-primary);
}

.heading-menu {
  display: flex;
  gap: 4px;
  padding: 6px;
}

.heading-option {
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  color: var(--text-primary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.heading-option:hover {
  background: var(--bg-hover);
}

.more-menu {
  display: flex;
  flex-direction: column;
  padding: 4px;
  min-width: 120px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: 13px;
  white-space: nowrap;
}

.menu-item:hover {
  background: var(--bg-hover);
}

.menu-item svg {
  flex-shrink: 0;
}

.menu-label {
  flex: 1;
  text-align: left;
}
</style>
