<script setup>
import TutorialForestDetail from '@/components/tutorial/TutorialForestDetail.vue';
import TutorialSideMenu from '@/components/tutorial/TutorialSideMenu.vue';
import { useMeta } from 'vue-meta';

const baseUrl = import.meta.env.VITE_APP_BASE_URL

useMeta({
  title: 'GROO 튜토리얼 | 감성 다이어리 서비스 그루 체험하기',
  meta: [
    {
      name: 'description',
      content: '로그인 없이 감성 다이어리 서비스 그루의 기능을 미리 체험해 보세요. 나만의 숲을 만들어 보세요.'
    },
    { 
      property: 'og:title', 
      content: 'GROO | 그루 튜토리얼' 
    },
    { 
      property: 'og:image', 
      content: `${baseUrl}/icon.png`
    },
  ]
})
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