<script setup lang="ts">
import type { PropType } from "vue";
import FileTree from "@/components/Sidebar/FileTree.vue";
import Outline from "@/components/Sidebar/Outline.vue";
import UserList from "@/components/Collaboration/UserList.vue";
import type { CollaborationUser } from "@/types";

defineProps({
  activeTab: {
    type: String as PropType<'files' | 'outline' | 'collab'>,
    default: 'files'
  },
  users: {
    type: Array as PropType<CollaborationUser[]>,
    default: () => []
  },
  currentUser: {
    type: Object as PropType<CollaborationUser>,
    required: true
  },
  connected: {
    type: Boolean,
    default: false
  },
  isMobile: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits<{
  (e: "change-tab", tab: "files" | "outline" | "collab"): void;
  (e: "update:user-name", name: string): void;
  (e: "close"): void;
}>();
</script>

<template>
  <aside class="sidebar">
    <div v-if="isMobile" class="sidebar-header">
      <span class="sidebar-title">
        {{ activeTab === 'files' ? '文件' : activeTab === 'outline' ? '大纲' : '协作' }}
      </span>
      <button class="sidebar-close" @click="emit('close')">
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </div>
    <div class="sidebar-tabs">
      <button
        class="sidebar-tab"
        :class="{ active: activeTab === 'files' }"
        title="文件"
        @click="emit('change-tab', 'files')"
      >
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path
            fill="currentColor"
            d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"
          />
        </svg>
      </button>
      <button
        class="sidebar-tab"
        :class="{ active: activeTab === 'outline' }"
        title="大纲"
        @click="emit('change-tab', 'outline')"
      >
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path
            fill="currentColor"
            d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"
          />
        </svg>
      </button>
      <button
        class="sidebar-tab"
        :class="{ active: activeTab === 'collab' }"
        title="协作"
        @click="emit('change-tab', 'collab')"
      >
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path
            fill="currentColor"
            d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
          />
        </svg>
      </button>
    </div>
    <div class="sidebar-content">
      <FileTree v-if="activeTab === 'files'" />
      <Outline v-else-if="activeTab === 'outline'" />
      <UserList
        v-else-if="activeTab === 'collab'"
        :users="users"
        :current-user="currentUser"
        :connected="connected"
        @update:user-name="(name: string) => emit('update:user-name', name)"
      />
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  display: flex;
  width: 280px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  flex-shrink: 0;
}

.sidebar-tabs {
  display: flex;
  flex-direction: column;
  padding: 8px;
  gap: 4px;
  border-right: 1px solid var(--border-color);
}

.sidebar-tab {
  padding: 8px;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.sidebar-tab:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.sidebar-tab.active {
  background: var(--bg-active);
  color: var(--accent-primary);
}

.sidebar-content {
  flex: 1;
  overflow: hidden;
}

/* Mobile header */
.sidebar-header {
  display: none;
}

/* Responsive Styles */
@media screen and (max-width: 768px) {
  .sidebar {
    flex-direction: column;
    width: 100%;
    height: 100%;
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color);
    background: var(--bg-secondary);
  }

  .sidebar-title {
    font-size: 16px;
    font-weight: 600;
  }

  .sidebar-close {
    padding: 6px;
    color: var(--text-secondary);
    border-radius: var(--radius-sm);
  }

  .sidebar-close:hover {
    background: var(--bg-hover);
  }

  .sidebar-tabs {
    flex-direction: row;
    justify-content: center;
    padding: 8px;
    border-right: none;
    border-bottom: 1px solid var(--border-color);
  }

  .sidebar-tab {
    flex: 1;
    justify-content: center;
  }

  .sidebar-content {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
}

@media screen and (max-width: 1024px) {
  .sidebar {
    width: 240px;
  }
}
</style>
