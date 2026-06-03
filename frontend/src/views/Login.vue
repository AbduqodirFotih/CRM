<template>
  <div class="login-page">
    <div class="login-card card">
      <div class="login-header">
        <h1 class="logo">CloudCRM</h1>
        <p class="subtitle">Sales Intelligence Platform</p>
      </div>
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input id="email" type="email" v-model="email" class="input" placeholder="admin@cloudcrm.dev" required />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input id="password" type="password" v-model="password" class="input" placeholder="Enter password" required />
        </div>
        <div v-if="error" class="error-msg">{{ error }}</div>
        <button type="submit" class="btn btn-primary btn-full" :disabled="loading">
          {{ loading ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>
      <p class="demo-hint">Demo: admin@cloudcrm.dev / admin123</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const email = ref('admin@cloudcrm.dev')
const password = ref('admin123')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  loading.value = true
  error.value = ''
  try {
    await authStore.login(email.value, password.value)
    router.push('/')
  } catch (e) {
    error.value = e.response?.data?.detail || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--background);
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: 2.5rem;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo {
  font-size: 1.75rem;
  color: var(--primary);
}

.subtitle {
  color: var(--muted);
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-group label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--foreground);
}

.error-msg {
  background: #fce4ec;
  color: var(--destructive);
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8125rem;
}

.btn-full {
  width: 100%;
  justify-content: center;
  padding: 0.75rem;
}

.demo-hint {
  text-align: center;
  margin-top: 1.5rem;
  font-size: 0.75rem;
  color: var(--muted);
}
</style>
