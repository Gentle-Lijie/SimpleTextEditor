<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useMarkdownThemeStore } from "@/stores/markdownTheme";
import { CATEGORY_LABELS, isLargeTheme } from "@/config/markdownThemes";
import type { ThemeCategory } from "@/config/markdownThemes";

const themeStore = useMarkdownThemeStore();

// Mobile dropdown state
const isMobile = ref(window.innerWidth <= 768);
const showThemeDropdown = ref(false);
const triggerRef = ref<HTMLElement | null>(null);
const menuPosition = ref({ top: 0, right: 0 });

watch(showThemeDropdown, (open) => {
  if (open && triggerRef.value) {
    const rect = triggerRef.value.getBoundingClientRect();
    menuPosition.value = {
      top: rect.bottom + 4,
      right: window.innerWidth - rect.right,
    };
  }
});

const menuStyle = computed(() => ({
  top: `${menuPosition.value.top}px`,
  right: `${menuPosition.value.right}px`,
}));

function handleResize() {
  isMobile.value = window.innerWidth <= 768;
  if (!isMobile.value) {
    showThemeDropdown.value = false;
  }
}

function handleGlobalClick(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (
    !target.closest(".theme-dropdown") &&
    !target.closest(".theme-dropdown-menu")
  ) {
    showThemeDropdown.value = false;
  }
}

onMounted(() => {
  window.addEventListener("resize", handleResize);
  document.addEventListener("click", handleGlobalClick);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  document.removeEventListener("click", handleGlobalClick);
});

function toggleThemeDropdown() {
  showThemeDropdown.value = !showThemeDropdown.value;
}

function selectTheme(themeId: string) {
  console.log("🖱️ [ThemeMenu] User selected theme:", themeId);
  themeStore.setTheme(themeId);
  if (isMobile.value) {
    showThemeDropdown.value = false;
  }
}

function getCategoryLabel(category: ThemeCategory): string {
  return CATEGORY_LABELS[category];
}

const currentThemeName = computed(() => {
  return themeStore.currentTheme?.name || "GitHub";
});
</script>

<template>
  <div class="theme-menu-inline">
    <!-- Desktop: inline dropdown -->
    <template v-if="!isMobile">
      <div class="theme-section">
        <span class="theme-label">主题</span>
        <div class="theme-dropdown">
          <button
            ref="triggerRef"
            class="theme-trigger"
            @click="toggleThemeDropdown"
            :title="`当前主题: ${currentThemeName}`"
          >
            <span class="theme-name">{{ currentThemeName }}</span>
            <span class="dropdown-arrow">▾</span>
          </button>
          <Teleport to="body">
            <div
              v-if="showThemeDropdown"
              class="theme-dropdown-menu"
              :style="menuStyle"
            >
              <div
                v-for="{ category, themes } in themeStore.themesByCategory"
                :key="category"
                class="theme-category"
              >
                <div class="category-header">
                  {{ getCategoryLabel(category) }}
                  <span
                    v-if="category === 'vlook'"
                    class="warning-badge"
                    title="大文件主题"
                    >⚠️</span
                  >
                </div>
                <div class="theme-list">
                  <button
                    v-for="theme in themes"
                    :key="theme.id"
                    class="theme-item"
                    :class="{ active: theme.id === themeStore.currentThemeId }"
                    @click="selectTheme(theme.id)"
                  >
                    <span class="theme-radio">
                      {{ theme.id === themeStore.currentThemeId ? "●" : "○" }}
                    </span>
                    <span class="theme-item-name">{{ theme.name }}</span>
                    <span
                      v-if="isLargeTheme(theme)"
                      class="size-badge"
                      title="大文件"
                      >⚠️</span
                    >
                  </button>
                </div>
              </div>
            </div>
          </Teleport>
        </div>
      </div>
    </template>

    <!-- Mobile: dropdown button -->
    <template v-else>
      <div class="theme-dropdown">
        <button
          ref="triggerRef"
          class="theme-trigger-mobile"
          @click="toggleThemeDropdown"
          title="Markdown 主题"
        >
          <span class="theme-icon">🎨</span>
          <span class="dropdown-arrow">▾</span>
        </button>
        <Teleport to="body">
          <div
            v-if="showThemeDropdown"
            class="theme-dropdown-menu mobile"
            :style="menuStyle"
          >
            <div class="menu-header">Markdown 主题</div>
            <div
              v-for="{ category, themes } in themeStore.themesByCategory"
              :key="category"
              class="theme-category"
            >
              <div class="category-header">
                {{ getCategoryLabel(category) }}
                <span v-if="category === 'vlook'" class="warning-badge"
                  >⚠️</span
                >
              </div>
              <div class="theme-list">
                <button
                  v-for="theme in themes"
                  :key="theme.id"
                  class="theme-item"
                  :class="{ active: theme.id === themeStore.currentThemeId }"
                  @click="selectTheme(theme.id)"
                >
                  <span class="theme-radio">
                    {{ theme.id === themeStore.currentThemeId ? "●" : "○" }}
                  </span>
                  <span class="theme-item-name">{{ theme.name }}</span>
                  <span v-if="isLargeTheme(theme)" class="size-badge">⚠️</span>
                </button>
              </div>
            </div>
          </div>
        </Teleport>
      </div>
    </template>
  </div>
</template>

<style scoped>
.theme-menu-inline {
  display: flex;
  align-items: center;
  position: relative;
}

.theme-section {
  display: flex;
  align-items: center;
  gap: 4px;
}

.theme-label {
  font-size: 11px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.theme-dropdown {
  position: relative;
}

.theme-trigger {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 11px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.theme-trigger:hover {
  background: var(--bg-hover);
  border-color: var(--accent-primary);
}

.theme-name {
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-arrow {
  font-size: 10px;
  color: var(--text-secondary);
}

.theme-trigger-mobile {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  width: var(--toolbar-h, 40px);
  height: var(--toolbar-h, 40px);
  padding: 0;
  border-radius: 4px;
  color: var(--text-primary);
  font-size: 14px;
}

.theme-trigger-mobile:hover {
  background: var(--toolbar-button-hover);
}

.theme-icon {
  font-size: 16px;
}

.theme-dropdown-menu {
  position: fixed;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  z-index: 10000;
  padding: 8px;
  min-width: 200px;
  max-width: 280px;
  max-height: 500px;
  overflow-y: auto;
}

.theme-dropdown-menu.mobile {
  min-width: 240px;
  max-height: 70vh;
}

.menu-header {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  padding: 4px 8px 8px;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 8px;
}

.theme-category {
  margin-bottom: 12px;
}

.theme-category:last-child {
  margin-bottom: 0;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  padding: 4px 8px;
  margin-bottom: 4px;
}

.warning-badge {
  font-size: 10px;
}

.theme-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.theme-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  background: transparent;
  color: var(--text-primary);
  font-size: 12px;
  text-align: left;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.theme-item:hover {
  background: var(--bg-hover);
}

.theme-item.active {
  background: var(--accent-bg);
  color: var(--accent-primary);
  font-weight: 500;
}

.theme-radio {
  font-size: 10px;
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.theme-item.active .theme-radio {
  color: var(--accent-primary);
}

.theme-item-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.size-badge {
  font-size: 10px;
  color: var(--warning-color, #fb8c00);
  flex-shrink: 0;
}

/* Scrollbar styling */
.theme-dropdown-menu::-webkit-scrollbar {
  width: 6px;
}

.theme-dropdown-menu::-webkit-scrollbar-track {
  background: transparent;
}

.theme-dropdown-menu::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.theme-dropdown-menu::-webkit-scrollbar-thumb:hover {
  background: var(--text-tertiary);
}

/* Mobile adjustments */
@media screen and (max-width: 768px) {
  .theme-dropdown-menu {
    min-width: 260px;
  }

  .theme-item {
    padding: 10px 12px;
    font-size: 14px;
    min-height: 40px;
  }

  .category-header {
    font-size: 11px;
    padding: 6px 12px;
  }
}
</style>
