<template>
  <div class="app">
  <main>
    <router-view />
    <AlertModal
      v-if="alert.message" 
      :message="alert.message" 
      :duration="alert.duration" 
      @close="alert.clear"
    />
  </main>
  </div>
  <DotLottieVue style="height: 500px; width: 500px" autoplay loop src="https://path-to-lottie.lottie" />
</template>

<script setup>
import AlertModal from './components/common/AlertModal.vue';
import { useAlertStore } from './stores/alert';

const alert = useAlertStore()
</script>
<!-- import { DotLottieVue } from '@lottiefiles/dotlottie-vue'   -->
<style scoped>
.wrapper {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
}
</style>
