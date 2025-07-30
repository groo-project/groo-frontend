<template>
  <div class="loading-container">
    <div class="scene">
      <Vue3Lottie
        :animationData="loadingAnimation"
        :height="200"
        :width="200"
        :loop="true"
        :autoPlay="true"
      />
    </div>
    <div class="loading-text">
      하루의 감정을 분석 중 입니다<br>
      <span class="sub">조금만 기다려주세요! 곧 기록의 조각이 생성 됩니다.</span>
    </div>
  </div>
</template>

<script>
import loadingAnimation from '@/assets/animations/loading_animation.json'

export default {
  name: 'LoadingAnimation',
  data() {
    return {
      loadingAnimation
    }
  }
}
</script>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  width: 100%;
  padding: 40px 0;
}

.scene {
  position: relative;
  width: 300px;
  height: 200px;
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.loading-text {
  color: #ffffff;
  font-size: 20px;
  text-align: center;
  font-weight: 600;
  line-height: 1.6;
}

.loading-text .sub {
  font-size: 16px;
  color: #062806;
  font-weight: 400;
}
</style> 