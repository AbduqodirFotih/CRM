<template>
  <div id="app-root">
    <Sidebar v-if="authStore.isLoggedIn" />
    <main :class="{ 'with-sidebar': authStore.isLoggedIn }">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useAuthStore } from './stores/auth'
import Sidebar from './components/Sidebar.vue'

const authStore = useAuthStore()
authStore.init()
</script>

<style scoped>
#app-root {
  display: flex;
  min-height: 100vh;
}

main {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

main.with-sidebar {
  margin-left: 260px;
}

@media (max-width: 768px) {
  main.with-sidebar {
    margin-left: 0;
  }
}
</style>
