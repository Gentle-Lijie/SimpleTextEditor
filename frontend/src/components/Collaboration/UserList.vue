<script setup lang="ts">
import { ref } from 'vue'
import type { CollaborationUser } from '@/types'

const props = defineProps<{
  users: CollaborationUser[]
  currentUser: CollaborationUser
  connected: boolean
}>()

const emit = defineEmits<{
  'update:userName': [name: string]
}>()

const isEditing = ref(false)
const editingName = ref('')

function startEdit() {
  editingName.value = props.currentUser.name
  isEditing.value = true
}

function confirmEdit() {
  const newName = editingName.value.trim()
  if (newName && newName !== props.currentUser.name) {
    emit('update:userName', newName)
  }
  isEditing.value = false
}

function cancelEdit() {
  isEditing.value = false
  editingName.value = ''
}
</script>

<template>
  <div class="user-list">
    <div class="connection-status" :class="{ connected }">
      <span class="status-dot"></span>
      <span>{{ connected ? '已连接' : '未连接' }}</span>
    </div>

    <div class="users">
      <div
        class="user-item current"
        :style="{ '--user-color': currentUser.color }"
      >
        <span class="user-avatar">{{ currentUser.name[0] }}</span>
        <template v-if="isEditing">
          <input
            v-model="editingName"
            class="edit-name-input"
            placeholder="输入用户名"
            autofocus
            @keyup.enter="confirmEdit"
            @keyup.esc="cancelEdit"
            @blur="confirmEdit"
          />
        </template>
        <template v-else>
          <span class="user-name">{{ currentUser.name }} (你)</span>
          <button class="edit-btn" title="修改用户名" @click="startEdit">
            <svg viewBox="0 0 24 24" width="14" height="14">
              <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </button>
        </template>
      </div>

      <div
        v-for="user in users"
        :key="user.id"
        class="user-item"
        :style="{ '--user-color': user.color }"
      >
        <span class="user-avatar">{{ user.name[0] }}</span>
        <span class="user-name">{{ user.name }}</span>
      </div>
    </div>

    <div class="user-count">
      {{ users.length + 1 }} 人在线
    </div>
  </div>
</template>

<style scoped>
.user-list {
  padding: 8px 0;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  font-size: 12px;
  color: var(--text-secondary);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent-error);
}

.connected .status-dot {
  background: var(--accent-secondary);
}

.users {
  padding: 8px 0;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
}

.user-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--user-color, var(--accent-primary));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.user-name {
  font-size: 13px;
  color: var(--text-primary);
  flex: 1;
}

.user-item.current .user-name {
  font-weight: 500;
}

.edit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
  opacity: 0;
  transition: all var(--transition-fast);
}

.user-item.current:hover .edit-btn {
  opacity: 1;
}

.edit-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.edit-name-input {
  flex: 1;
  padding: 4px 8px;
  font-size: 13px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--bg-primary);
  color: var(--text-primary);
}

.edit-name-input:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.user-count {
  padding: 8px 12px;
  font-size: 12px;
  color: var(--text-tertiary);
  border-top: 1px solid var(--border-color);
}
</style>
