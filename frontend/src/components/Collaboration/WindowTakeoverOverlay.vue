<script setup lang="ts">
defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  'reclaim': []
}>()

function handleReclaim() {
  emit('reclaim')
}

function handleRefresh() {
  window.location.reload()
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="takeover-overlay">
      <div class="takeover-content">
        <div class="takeover-icon">
          <svg viewBox="0 0 24 24" width="64" height="64">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <h2 class="takeover-title">已在其他窗口打开</h2>
        <p class="takeover-message">
          为保证协作体验，同一浏览器只允许一个活跃窗口。<br>
          您可以关闭此窗口，或点击下方按钮重新激活。
        </p>
        <div class="takeover-actions">
          <button class="btn-primary" @click="handleReclaim">
            在此窗口继续
          </button>
          <button class="btn-secondary" @click="handleRefresh">
            刷新页面
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.takeover-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.takeover-content {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  padding: 40px 48px;
  text-align: center;
  max-width: 420px;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.takeover-icon {
  color: var(--accent-primary);
  margin-bottom: 20px;
}

.takeover-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px 0;
}

.takeover-message {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 28px 0;
}

.takeover-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-primary,
.btn-secondary {
  padding: 12px 24px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-primary {
  background: var(--accent-primary);
  color: white;
  border: none;
}

.btn-primary:hover {
  background: var(--accent-primary-hover, #1976d2);
}

.btn-secondary {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
</style>
