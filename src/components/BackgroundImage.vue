<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import buttonIcon_6 from "@/icons/edit_icon.png"
import buttonIcon_7 from "@/icons/External_icon.png"
import buttonIcon_8 from "@/icons/is_public_icon.png"
import api from '@/lib/api.js'
import { useAlertStore } from '@/stores/alert'

const alert = useAlertStore()

const props = defineProps({
  isSidebarOpen: {
    type: Boolean,
    default: false
  }
})

const containerWidth = computed(() => {
  return props.isSidebarOpen ? '65%' : '80%'
})

const itemSize = computed(() => {
  return props.isSidebarOpen ? '3vw' : '4.5vw'
})

const backgroundContainer = ref(null)

watch(() => props.isSidebarOpen, (newValue) => {
  if (newValue) {
    itemSize.value = '3vw'
  } else {
    itemSize.value = '4.5vw'
  }
}, { immediate: true })

const forestData = ref(null)
const showTooltip = ref(false)

const route = useRoute()
const router = useRouter()

onMounted(async () => {

  let forestId = route.params.forestId

  if (!forestId) {
    try {
      const res = await api.get('myforest')

      if (!res.ok) throw new Error('myforest 요청 실패')

      const forestList = await res.json()

      if (!forestList.length) {
        alert.show('소유한 숲이 없습니다.')
        return
      }

      // 개인 숲 ID를 사용 (우정의 숲 ID가 아님)
      const personalForestId = forestList[0].id
      
      router.replace(`forest-detail/${personalForestId}`)
      return
    } catch (err) {
      console.error('myforest 호출 실패:', err)
    }
  } else {
    try {
      const response = await api.get(`detail/${forestId}`)

      if (!response.ok) {
        alert.show("다시 로그인해 주세요!")
        router.push('/login')
        throw new Error('detail 요청 실패')
      }
      forestData.value = await response.json()
    } catch (error) {
      console.error('숲 정보 불러오기 실패:', error)
    }
  }
})

const togglePublic = async () => {
  if (!forestData.value) return;
  const forestId = route.params.forestId;
  try {
    const res = await api.patch(`emotion-forest/public/${forestId}`);

    const text = await res.text();
    if (!res.ok) throw new Error('공개여부 변경 실패');

    forestData.value.isPublic = !forestData.value.isPublic;
  } catch (err) {
    alert.show('공개여부 변경에 실패했습니다.')
  }
}
</script>

<template>
  <div class="container1">
    <div class="main-area1">
      <div class="icons">
        <img :src="buttonIcon_6" class="btn-img" />
        <img :src="buttonIcon_7" class="btn-img" />
        <img
          :src="buttonIcon_8"
          class="btn-img"
          @mouseenter="showTooltip = true"
          @mouseleave="showTooltip = false"
          @click="togglePublic"
          style="cursor:pointer;"
        />
        <div v-if="showTooltip" class="tooltip">
          <div class="tooltip-title">공개 범위 설정</div>
          <div class="tooltip-status"
            :class="forestData && forestData.isPublic ? 'public' : 'private'">
            {{ forestData && forestData.isPublic ? '공개중' : '비공개' }}
          </div>
        </div>
      </div>

      <div v-if="forestData && forestData.length" class="forest-container">
        <div class="background-container" 
          ref="backgroundContainer"
          :style="{ 
            backgroundImage: `url(${forestData[0].backgroundImageUrl})`,
            width: containerWidth
          }"
        >
          <div class="forest-title">
            <h1>{{ forestData[0].name }}</h1>
          </div>
          <div
            v-for="item in forestData[0].placementList"
            :key="item.placementId"
            class="item"
            :style="{
              left: `${item.placementPositionX}%`,
              top: `${item.placementPositionY}%`
            }"
          >
            <img 
              :src="item.itemImageUrl" 
              :alt="item.itemName" 
              class="item-image" 
              :style="{ width: itemSize, height: itemSize }"
            />
          </div>
        </div>
      </div>

      <div v-else>
        <p>데이터 불러오는 중...</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container1 {
  padding: 20px;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.main-area1 {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

.forest-container {
  width: 100%;
  max-width: 1200px;
  position: relative;
  margin: 0 auto;
}

.background-container {
  height: 600px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  margin: 0 auto;
  position: relative;
}

.item {
  position: absolute;
  transform: translate(-50%, -50%);
}

.item-image {
  object-fit: contain;
  transition: transform 0.3s ease;
  will-change: transform;
}

.icons {
  position: absolute;
  top: 12.83%;
  left: 5.07%;
  display: flex;
  gap: 16px;
  z-index: 10;
}

.btn-img {
  width: 32px;
  height: 32px;
  cursor: pointer;
}

.forest-title {
  position: absolute;
  left: 50%;
  top: calc(50% - 440px);
  transform: translateX(-50%);
  z-index: 5;
  pointer-events: none;
}

.forest-title h1 {
  color: white;
  font-size: 36px;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.3);
  margin-top: 15px;
}

.tooltip {
  position: absolute;
  bottom: 45px;
  left: 87%;
  transform: translateX(-50%);
  background: rgba(240, 248, 240, 0.95);
  opacity: 0.7;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  padding: 12px 24px 16px 24px;
  min-width: 180px;
  z-index: 100;
  text-align: center;
  font-size: 18px;
  color: #333;
  pointer-events: none;
}

.tooltip::after {
  content: '';
  position: absolute;
  left: 50.5%;
  bottom: -12px;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 14px solid transparent;
  border-right: 14px solid transparent;
  border-top: 16px solid rgba(240, 248, 240, 0.95);
}

.tooltip-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}
.tooltip-status {
  font-size: 15px;
  background: #bfcfc2;
  color: #fff;
  border-radius: 10px;
  padding: 2px 12px;
  display: inline-block;
}
.tooltip-status.public {
  background: rgba(11, 87, 138, 0.33);
}
.tooltip-status.private {
  background: rgba(255, 10, 38, 0.33);
}
</style>
