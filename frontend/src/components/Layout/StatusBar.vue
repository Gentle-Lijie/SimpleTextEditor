<script setup lang="ts">
defineProps({
  title: {
    type: String,
    default: '未选择文档'
  },
  line: {
    type: Number,
    default: 1
  },
  column: {
    type: Number,
    default: 1
  },
  charCount: {
    type: Number,
    default: 0
  },
  wordCount: {
    type: Number,
    default: 0
  },
  readingTime: {
    type: [String, Number],
    default: 0
  },
  isMobile: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <footer class="app-footer">
    <div class="status-bar">
      <span class="status-item doc-title">
        {{ title }}
      </span>
      <template v-if="!isMobile">
        <span class="status-divider">|</span>
        <span class="status-item"> 行 {{ line }}, 列 {{ column }} </span>
        <span class="status-divider">|</span>
        <span class="status-item"> {{ charCount }} 字符 </span>
        <span class="status-divider">|</span>
        <span class="status-item"> {{ wordCount }} 词 </span>
        <span class="status-divider">|</span>
        <span class="status-item"> 阅读时间 ~{{ readingTime }} 分钟 </span>
      </template>
      <template v-else>
        <span class="status-divider">|</span>
        <span class="status-item">{{ charCount }} 字</span>
      </template>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  height: 24px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
}

.status-bar {
  display: flex;
  align-items: center;
  padding: 0 12px;
  height: 100%;
  font-size: 12px;
  color: var(--text-secondary);
}

.status-item {
  white-space: nowrap;
}

.status-item.doc-title {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-divider {
  margin: 0 8px;
  color: var(--border-color);
}

/* Responsive Styles */
@media screen and (max-width: 768px) {
  .app-footer {
    height: 20px;
  }

  .status-bar {
    padding: 0 8px;
    font-size: 11px;
  }

  .status-item.doc-title {
    max-width: 120px;
  }

  .status-divider {
    margin: 0 4px;
  }
}
</style>
