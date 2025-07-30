<template>
  <div class="app">
  <main>
    <router-view></router-view> 
  </main>
  </div>
  <DotLottieVue style="height: 500px; width: 500px" autoplay loop src="https://path-to-lottie.lottie" />
</template>

<script setup>
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
