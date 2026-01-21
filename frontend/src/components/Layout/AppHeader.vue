<script setup lang="ts">
import type { PropType } from "vue";
import type { EditorMode } from "@/types";

defineProps({
  editorMode: {
    type: String as PropType<EditorMode>,
    required: true,
  },
  modeLabels: {
    type: Object as PropType<Record<EditorMode, string>>,
    required: true,
  },
  isSaving: {
    type: Boolean,
    default: false,
  },
  isDirty: {
    type: Boolean,
    default: false,
  },
  isReadonly: {
    type: Boolean,
    default: false,
  },
  collabUserCount: {
    type: Number,
    default: 1,
  },
  collabConnected: {
    type: Boolean,
    default: false,
  },
  isMobile: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  (e: "toggleSidebar"): void;
  (e: "changeMode", mode: EditorMode): void;
  (e: "save"): void;
}>();
</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <button
        class="sidebar-toggle"
        title="切换侧边栏 (Ctrl+\\)"
        @click="emit('toggleSidebar')"
      >
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path
            fill="currentColor"
            d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"
          />
        </svg>
      </button>
      <div class="logo" :class="{ 'logo-short': isMobile }">
        {{ isMobile ? 'STE' : 'SimpleTextEditor' }}
      </div>
    </div>
    <div class="header-center">
      <div class="mode-switcher">
        <button
          v-for="mode in (isMobile ? ['source', 'wysiwyg'] : ['source', 'preview', 'split', 'wysiwyg']) as EditorMode[]"
          :key="mode"
          class="mode-btn"
          :class="{ active: editorMode === mode }"
          @click="emit('changeMode', mode)"
        >
          {{ modeLabels[mode] }}
        </button>
      </div>
    </div>
    <div class="header-right">
      <button class="save-btn" title="保存 (Ctrl+S)" @click="emit('save')">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path
            fill="currentColor"
            d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"
          />
        </svg>
      </button>
      <span
        v-if="!isMobile"
        class="save-status"
        :class="{
          saving: isSaving,
          dirty: isDirty && !isReadonly,
          readonly: isReadonly,
        }"
      >
        {{
          isReadonly
            ? "只读"
            : isSaving
              ? "保存中..."
              : isDirty
                ? "未保存"
                : "已保存"
        }}
      </span>
      <div v-if="!isMobile" class="collab-indicator" :class="{ connected: collabConnected }">
        <span class="collab-dot"></span>
        <span>{{ collabUserCount }} 人在线</span>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  height: 48px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.header-left,
.header-right {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-right {
  justify-content: flex-end;
}

.header-center {
  display: flex;
  justify-content: center;
}

.sidebar-toggle {
  padding: 6px;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.sidebar-toggle:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.logo {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.mode-switcher {
  display: flex;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  padding: 2px;
}

.mode-btn {
  padding: 6px 12px;
  font-size: 13px;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.mode-btn:hover {
  color: var(--text-primary);
}

.mode-btn.active {
  background: var(--bg-primary);
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
}

.save-btn {
  padding: 6px;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.save-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.save-status {
  font-size: 12px;
  color: var(--text-tertiary);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
}

.save-status.dirty {
  color: var(--accent-warning);
}

.save-status.saving {
  color: var(--accent-primary);
}

.save-status.readonly {
  color: var(--text-tertiary);
  background: var(--bg-tertiary);
}

.collab-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
}

.collab-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent-error);
}

.collab-indicator.connected .collab-dot {
  background: var(--accent-secondary);
}

/* Responsive Styles */
@media screen and (max-width: 768px) {
  .app-header {
    height: 44px;
    padding: 0 12px;
  }

  .header-left,
  .header-right {
    gap: 8px;
  }

  .logo {
    font-size: 14px;
  }

  .logo-short {
    font-weight: 700;
  }

  .mode-switcher {
    padding: 2px;
  }

  .mode-btn {
    padding: 4px 10px;
    font-size: 12px;
  }

  .save-btn {
    padding: 8px;
  }
}

@media screen and (max-width: 480px) {
  .app-header {
    padding: 0 8px;
  }

  .mode-btn {
    padding: 4px 8px;
    font-size: 11px;
  }
}
</style>
