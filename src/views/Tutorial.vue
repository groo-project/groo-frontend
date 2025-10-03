<script setup>
import TutorialForestDetail from '@/components/tutorial/TutorialForestDetail.vue';
import TutorialSideMenu from '@/components/tutorial/TutorialSideMenu.vue';
</script>
<template>
  <div class="container">
    <div class="main-area">
      <TutorialForestDetail />
    </div>
    <TutorialSideMenu />
  </div>
</template>
<style scoped>
.container {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.main-area {
  flex: 1;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: width 0.3s ease;
  background: transparent;
}
</style>