<script setup lang="ts">
import type { CollaborationUser } from '@/types'

defineProps<{
  users: CollaborationUser[]
  currentUser: CollaborationUser
  connected: boolean
}>()
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
        <span class="user-name">{{ currentUser.name }} (你)</span>
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
}

.user-name {
  font-size: 13px;
  color: var(--text-primary);
}

.user-item.current .user-name {
  font-weight: 500;
}

.user-count {
  padding: 8px 12px;
  font-size: 12px;
  color: var(--text-tertiary);
  border-top: 1px solid var(--border-color);
}
</style>
