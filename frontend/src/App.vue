<script setup lang="ts">
// Main App Component - will be expanded in Phase 3
</script>

<template>
  <div id="app-container">
    <header class="app-header">
      <div class="logo">SimpleTextEditor</div>
      <div class="header-actions">
        <!-- Header actions will be added later -->
      </div>
    </header>
    <main class="app-main">
      <aside class="sidebar">
        <!-- Sidebar will be added in Phase 8 -->
      </aside>
      <div class="editor-container">
        <!-- Editor will be added in Phase 3 -->
        <div class="placeholder">
          <h1>SimpleTextEditor</h1>
          <p>多人协作 Markdown 编辑器</p>
          <p>项目初始化完成，编辑器组件即将实现...</p>
        </div>
      </div>
    </main>
    <footer class="app-footer">
      <div class="status-bar">
        <span>Ready</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
#app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  height: 48px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.logo {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.app-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 240px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: none; /* Will be shown in Phase 8 */
}

.editor-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: var(--text-secondary);
}

.placeholder h1 {
  font-size: 32px;
  margin-bottom: 8px;
}

.placeholder p {
  font-size: 16px;
  margin: 4px 0;
}

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
</style>
