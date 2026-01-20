<script setup lang="ts">
import { onMounted, ref } from "vue";

const props = defineProps<{ apiUrl: string }>();
const emit = defineEmits<{ (e: "authenticated"): void }>();

const password = ref("");
const error = ref("");
const loading = ref(false);

// Try auto-bypass when server未配置密码
onMounted(async () => {
  await verify(true);
});

async function verify(isAuto = false) {
  error.value = "";

  if (!isAuto && !password.value.trim()) {
    error.value = "请先输入密码";
    return;
  }

  loading.value = true;
  try {
    const response = await fetch(`${props.apiUrl}/api/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: password.value }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      if (isAuto) return;
      error.value = result.error || "密码错误";
      return;
    }

    emit("authenticated");
  } catch (e) {
    console.error("Password verification failed:", e);
    if (!isAuto) {
      error.value = "验证失败，请稍后重试";
    }
  } finally {
    loading.value = false;
  }
}

async function handleSubmit(event: Event) {
  event.preventDefault();
  await verify(false);
}
</script>

<template>
  <div class="auth-screen">
    <div class="auth-card">
      <div class="auth-header">
        <div class="logo">SimpleTextEditor</div>
        <p class="auth-subtitle">请输入访问密码以进入</p>
      </div>
      <form class="auth-form" @submit="handleSubmit">
        <label class="auth-label" for="access-password">访问密码</label>
        <input
          id="access-password"
          v-model="password"
          class="auth-input"
          type="password"
          placeholder="请输入密码"
          autocomplete="current-password"
        />
        <button class="auth-button" type="submit" :disabled="loading">
          {{ loading ? "验证中..." : "进入编辑器" }}
        </button>
        <p v-if="error" class="auth-error">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<style scoped>
.auth-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(
      circle at 20% 20%,
      rgba(82, 113, 255, 0.08),
      transparent 25%
    ),
    radial-gradient(
      circle at 80% 10%,
      rgba(255, 82, 166, 0.08),
      transparent 25%
    ),
    radial-gradient(
      circle at 50% 80%,
      rgba(0, 209, 255, 0.08),
      transparent 30%
    ),
    var(--bg-primary);
  color: var(--text-primary);
}

.auth-card {
  width: min(420px, 90vw);
  padding: 28px;
  border-radius: 16px;
  background: var(--bg-secondary);
  box-shadow:
    0 18px 50px rgba(0, 0, 0, 0.12),
    0 8px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border-color);
}

.auth-header {
  margin-bottom: 18px;
}

.auth-subtitle {
  margin: 4px 0 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.auth-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.auth-input {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.auth-input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(82, 113, 255, 0.15);
}

.auth-button {
  margin-top: 4px;
  padding: 12px;
  border-radius: 10px;
  background: linear-gradient(135deg, #526fff, #7f5af0);
  color: #fff;
  font-weight: 600;
  transition:
    transform var(--transition-fast),
    box-shadow var(--transition-fast),
    opacity var(--transition-fast);
}

.auth-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 25px rgba(82, 113, 255, 0.25);
}

.auth-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.auth-error {
  margin: 2px 0 0;
  color: var(--accent-error);
  font-size: 13px;
}
</style>
