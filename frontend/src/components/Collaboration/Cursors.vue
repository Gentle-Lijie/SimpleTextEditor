<script setup lang="ts">
import type { CollaborationUser } from '@/types'

defineProps<{
  users: CollaborationUser[]
}>()
</script>

<template>
  <div class="remote-cursors">
    <div
      v-for="user in users"
      v-show="user.cursor"
      :key="user.id"
      class="remote-cursor"
      :style="{
        '--cursor-color': user.color,
        top: `${(user.cursor?.line || 1) * 22.4}px`,
        left: `${50 + (user.cursor?.column || 1) * 8}px`
      }"
    >
      <div class="cursor-caret"></div>
      <div class="cursor-label">{{ user.name }}</div>
    </div>
  </div>
</template>

<style scoped>
.remote-cursors {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.remote-cursor {
  position: absolute;
  z-index: 10;
}

.cursor-caret {
  width: 2px;
  height: 18px;
  background: var(--cursor-color, var(--accent-primary));
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.cursor-label {
  position: absolute;
  top: -18px;
  left: 0;
  padding: 2px 6px;
  font-size: 10px;
  color: white;
  background: var(--cursor-color, var(--accent-primary));
  border-radius: 2px;
  white-space: nowrap;
}
</style>
