<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const imageUrl = ref('') // 이미지 URL을 저장할 상태

const goToHome = () => {
  router.push('/')
}

onMounted(() => {
  const hour = new Date().getHours()
  document.body.className = hour >= 6 && hour < 18 ? 'daytime' : 'nighttime'
  // document.body.className = 'nighttime'
  imageUrl.value =
    hour >= 6 && hour < 18
      ? 'https://x1-groo.s3.ap-northeast-2.amazonaws.com/items/default/joy/etc/fox' // 낮 이미지
      : 'https://x1-groo.s3.ap-northeast-2.amazonaws.com/items/default/sad/etc/owl1' // 밤 이미지
})
</script>

<template>
  <div class="forest-view">
    <img 
      src="/icon.png" 
      alt="Home" 
      class="home-icon" 
      @click="goToHome"
    />
    <div class="message">
      <h1>서비스 준비 중입니다</h1>
      <p>곧 찾아뵙겠습니다. 조금만 기다려 주세요!</p>
      <img :src="imageUrl" alt="Dynamic Image" class="dynamic-image" />
    </div>
    <div class="stars">
      <div v-for="n in 50" :key="n" class="star" :style="generateStarStyle()"></div>
    </div>
  </div>
</template>

<script>
export default {
  methods: {
    generateStarStyle() {
      const size = Math.random() * 3 + 1 // 별 크기 (1px ~ 4px)
      const top = Math.random() * 100 // 화면 상단 위치 (%)
      const left = Math.random() * 100 // 화면 좌측 위치 (%)
      const duration = Math.random() * 2 + 1 // 깜빡이는 애니메이션 시간 (1s ~ 3s)

      return {
        width: `${size}px`,
        height: `${size}px`,
        top: `${top}%`,
        left: `${left}%`,
        animationDuration: `${duration}s`,
      }
    },
  },
}
</script>

<style scoped>
.forest-view {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  text-align: center;
  color: white;
}

.message {
  z-index: 1;
}

.message h1 {
  font-size: 3rem;
  margin: 0;
  animation: fadeIn 2s ease-in-out;
}

.message p {
  font-size: 1.5rem;
  margin: 10px 0 0;
  animation: fadeIn 3s ease-in-out;
}

.dynamic-image {
  margin-top: 20px;
  width: 200px;
  height: auto;
  animation: fadeIn 3s ease-in-out;
}

.stars {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  overflow: hidden;
  z-index: 0;
}

.star {
  position: absolute;
  background: white;
  border-radius: 50%;
  opacity: 0.8;
  animation: twinkle 2s infinite alternate;
  pointer-events: none;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.home-icon {
  position: absolute;
  top: 15px;
  left: 40px;
  width: 120px;
  height: 100px;
  cursor: pointer;
  z-index: 2;
  transition: transform 0.2s ease;
  object-fit: contain;
}

.home-icon:hover {
  transform: scale(1.1);
}
</style>