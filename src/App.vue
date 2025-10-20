<template>
  <div class="app">
  <main>
    <router-view />
    <AlertModal
      v-if="alert.message" 
      :message="alert.message" 
      :duration="alert.duration"
      :key="alert.key"
      @close="alert.clear"
    />
  </main>
  </div>
</template>

<script setup>
import AlertModal from './components/common/AlertModal.vue';
import { useAlertStore } from './stores/alert';

const alert = useAlertStore()
</script>
<style scoped>
.wrapper {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
}
</style>
