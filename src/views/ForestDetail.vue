<script setup>
import { ref, onMounted, onUnmounted, getCurrentInstance, computed } from "vue";
import buttonIcon_6 from "@/icons/edit_icon.png"
import buttonIcon_8 from "@/icons/is_public_icon.png"
// import GuestBookList from "@/components/GuestBookList.vue";
import GuestBookDetail from "@/components/forest/common/guestbook/GuestBookDetail.vue";
import { useRouter } from 'vue-router';

import EditForestName from "@/components/forest/common/EditForestName.vue";
import AlertModal from "@/components/common/AlertModal.vue";

// weather effects
import RainEffects from "@/components/weather/RainEffects.vue";
import FlowerRainEffect from "@/components/weather/FlowerRainEffect.vue";
import FogEffects from "@/components/weather/FogEffects.vue";
import YellowDustEffects from "@/components/weather/YellowDustEffects.vue";
import SnowEffects from "@/components/weather/SnowEffects.vue";
import ThunderEffects from "@/components/weather/ThunderEffects.vue";
import CloudyEffects from "@/components/weather/CloudyEffects.vue";

// ===== 상수 정의 =====
const ITEM_CONSTANTS = {
  BASE_SIZE: 60,                    // 기본 아이템 크기
  DEFAULT_Z_INDEX: 50,              // 기본 zIndex
  MIN_SCALE: 0.3,                   // 최소 크기 배율
  MAX_SCALE: 3.0,                   // 최대 크기 배율
  SCALE_STEP: 0.1,                  // 크기 조절 단위
  MIN_Z_INDEX: 0,                   // 최소 zIndex
  MAX_Z_INDEX: 999,                 // 최대 zIndex
  Z_INDEX_STEP: 10,                 // zIndex 조절 단위
  DEFAULT_POSITION: { x: 10, y: 20 }, // 기본 배치 위치
  YELLOW_DUST_OPACITY: 0.7          // 황사 시 투명도
};

const UI_CONSTANTS = {
  TOOLTIP_DELAY: 0,                 // 툴팁 표시 지연시간
  CONTROL_PANEL_WIDTH: 260,         // 컨트롤 패널 최소 너비
  CONTROL_PANEL_HEIGHT: 500,        // 컨트롤 패널 최소 높이
  CONTAINER_WIDTH: 800,             // 배치 컨테이너 너비
  HOME_ICON_SIZE: { width: 120, height: 100 }, // 홈 아이콘 크기
  BTN_ICON_SIZE: 32                 // 버튼 아이콘 크기
};

const router = useRouter();
const showGuestBook = ref(false);
const showGuestBookDetail = ref(false);
const selectedGuestBookId = ref(null);
const bgRef = ref(null); // background 요소 참조
const containerRef = ref(null); // placement-container 요소 참조

// 크기 관련 변수들을 scale로 통합
const baseSize = ITEM_CONSTANTS.BASE_SIZE;
const itemScale = ref(1.0); // 크기 배율 (1.0 = 100%)
const itemZIndex = ref(ITEM_CONSTANTS.DEFAULT_Z_INDEX);
const showTooltip = ref(false);
const forestData = ref(null);
const currentWeather = ref(null); // 현재 날씨 상태를 저장할 ref 추가
const selectedPiece = ref(null)
const dragPos = ref({ x: 50, y: 50 })
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const forceUpdate = ref(0);
const showEditName = ref(false);
const showAlertModal = ref(false);
const alertMessage = ref('');
const showControlPanel = ref(false); // 컨트롤 패널 표시 여부

const { proxy } = getCurrentInstance();

// 계산된 크기 값들
const calculatedWidth = computed(() => Math.round(baseSize * itemScale.value));
const calculatedHeight = computed(() => Math.round(baseSize * itemScale.value));

const showRain = computed(() => {
  const weather = localStorage.getItem('weather');
  return weather === '비';
});

const showFlowerRain = computed(() => {
  const weather = localStorage.getItem('weather');
  return weather === '꽃비';
});

const showFog = computed(() => {
  const weather = localStorage.getItem('weather');
  return weather === '안개';
});

const showYellowDust = computed(() => {
  const weather = localStorage.getItem('weather');
  return weather === '황사';
});

const showSnow = computed(() => {
  const weather = localStorage.getItem('weather');
  return weather === '맑음';
});

const showThunder = computed(() => {
  const weather = localStorage.getItem('weather');
  return weather === '번개';
});

const showCloudy = computed(() => {
  const weather = localStorage.getItem('weather');
  return weather === '흐림';
});

const refreshForestData = async () => {
  const token = localStorage.getItem('accessToken');
  const forestId = localStorage.getItem("myRecentforestId");
  if (!forestId) return;
  
  try {
    const response = await fetch(`http://localhost:8080/detail/${forestId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      alert("다시 로그인해 주세요!");
      router.push('/login');
      throw new Error('detail 요청 실패');
    }
    
    const data = await response.json();
    console.log('Raw forest data:', data);
    forestData.value = data;
    console.log('Updated forestData:', forestData.value);
  } catch (error) {
    console.error('숲 정보 불러오기 실패:', error);
  }
};

onMounted(async () => {
  await refreshForestData();
  
  proxy.emitter.on('place-item', (piece) => {
    selectedPiece.value = piece;
    dragPos.value = { x: ITEM_CONSTANTS.DEFAULT_POSITION.x, y: ITEM_CONSTANTS.DEFAULT_POSITION.y };
    showControlPanel.value = true; // 아이템 선택 시 컨트롤 패널 표시
    console.log('Received piece in ForestDetail:', selectedPiece.value);
  });
  
  // 일기 저장 후 날씨 정보를 받는 리스너
  proxy.emitter.on('diary-saved', (response) => {
    console.log('Received diary save response:', response);
    if (response.weather) {
      currentWeather.value = response.weather;
      console.log('Updated weather:', currentWeather.value);
    }
  });
});

onUnmounted(() => {
  proxy.emitter.off('place-item');
  proxy.emitter.off('diary-saved');
});

const togglePublic = async () => {
  if (!forestData.value) return;
  
  const token = localStorage.getItem('accessToken');
  try {
    const res = await fetch(`http://localhost:8080/emotion-forest/public/${forestData.value[0].forestId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!res.ok) throw new Error('공개여부 변경 실패');
    
    forestData.value[0].isPublic = !forestData.value[0].isPublic;
  } catch (err) {
    alert('공개여부 변경에 실패했습니다.');
    console.error(err);
  }
};

const onMouseDown = (event) => {
  event.preventDefault(); // 브라우저 기본 드래그 방지
  isDragging.value = true;
  
  const container = containerRef.value;
  const rect = container.getBoundingClientRect();
  const imgCenterX = rect.left + (rect.width * dragPos.value.x / 100);
  const imgCenterY = rect.top + (rect.height * dragPos.value.y / 100);
  
  dragOffset.value = {
    x: event.clientX - imgCenterX,
    y: event.clientY - imgCenterY
  };
  
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
};

const onMouseMove = (event) => {
  if (!isDragging.value) return;
  
  const container = containerRef.value;
  const rect = container.getBoundingClientRect();
  
  const x = ((event.clientX - rect.left - dragOffset.value.x) / rect.width) * 100;
  const y = ((event.clientY - rect.top - dragOffset.value.y) / rect.height) * 100;
  
  dragPos.value = {
    x: Math.max(0, Math.min(100, x)),
    y: Math.max(0, Math.min(100, y))
  };
};

const onMouseUp = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
};

const handleCompletePlacement = async () => {
  const token = localStorage.getItem('accessToken');
  const forestId = localStorage.getItem('myRecentforestId');
  
  if (!selectedPiece.value || !forestId) {
    alertMessage.value = '필수 정보가 없습니다.';
    showAlertModal.value = true;
    return;
  }
  
  const body = {
    forestId: Number(forestId),
    itemPositionX: dragPos.value.x,
    itemPositionY: dragPos.value.y,
    itemId: selectedPiece.value.value,
    itemWidth: calculatedWidth.value,
    itemHeight: calculatedHeight.value,
    itemZIndex: itemZIndex.value
  };
  
  try {
    const res = await fetch('http://localhost:8080/emotion-forest/placement', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });
    
    if (!res.ok) throw new Error('배치 요청 실패');
    
    alertMessage.value = '배치가 완료되었습니다!';
    showAlertModal.value = true;
    await refreshForestData();
    selectedPiece.value = null;
    showControlPanel.value = false; // 배치 완료 후 컨트롤 패널 숨김
    // 값들을 기본값으로 리셋
    itemScale.value = 1.0;
    itemZIndex.value = ITEM_CONSTANTS.DEFAULT_Z_INDEX;
    forceUpdate.value++; // 배치 후 강제 리렌더 트리거
  } catch (err) {
    alertMessage.value = '배치에 실패했습니다.';
    showAlertModal.value = true;
    console.error(err);
  }
};

const closeAlertModal = () => {
  showAlertModal.value = false;
};

const handleShowDetail = (id) => {
  selectedGuestBookId.value = id;
  showGuestBookDetail.value = true;
};

const handleDetailBack = () => {
  showGuestBookDetail.value = false;
};

const handleGuestBookClick = () => {
  showGuestBook.value = true;
};

const handleGuestBookBack = () => {
  showGuestBook.value = false;
  showGuestBookDetail.value = false;
};

const handleEmotionWeather = (weather) => {
  if (forestData.value && forestData.value.length) {
    forestData.value[0].emotionWeather = weather;
  }
};

const sortedPlacementList = computed(() => {
  if (!forestData.value || !forestData.value.length) return [];
  // Y값(placementPositionY)이 작은 순 → 큰 순으로 정렬
  return [...forestData.value[0].placementList].sort(
    (a, b) => a.placementPositionY - b.placementPositionY
  );
});

const handleEditNameClick = () => {
  showEditName.value = !showEditName.value;
};

const handleNameUpdate = (newName) => {
  if (forestData.value && forestData.value.length) {
    forestData.value[0].name = newName;
  }
};

const goToHome = () => {
  router.push('/')
};

// 크기 및 zIndex 조절 함수들
const increaseScale = () => {
  if (itemScale.value < ITEM_CONSTANTS.MAX_SCALE) {
    itemScale.value += ITEM_CONSTANTS.SCALE_STEP;
  }
};

const decreaseScale = () => {
  if (itemScale.value > ITEM_CONSTANTS.MIN_SCALE) {
    itemScale.value -= ITEM_CONSTANTS.SCALE_STEP;
  }
};

const increaseZIndex = () => {
  if (itemZIndex.value < ITEM_CONSTANTS.MAX_Z_INDEX) {
    itemZIndex.value += ITEM_CONSTANTS.Z_INDEX_STEP;
  }
};

const decreaseZIndex = () => {
  if (itemZIndex.value > ITEM_CONSTANTS.MIN_Z_INDEX) {
    itemZIndex.value -= ITEM_CONSTANTS.Z_INDEX_STEP;
  }
};

const cancelPlacement = () => {
  selectedPiece.value = null;
  showControlPanel.value = false;
  // 값들을 기본값으로 리셋
  itemScale.value = 1.0;
  itemZIndex.value = ITEM_CONSTANTS.DEFAULT_Z_INDEX;
};
</script>

<template>
  <div class="forest-detail">
    <img 
      src="/icon.png"
      alt="Home"
      class="home-icon"
      @click="goToHome"
    />
    
    <div class="top-left-icons">
      <div class="edit-name-container">
        <img :src="buttonIcon_6" class="btn-img" @click="handleEditNameClick" />
        <EditForestName
          v-if="showEditName"
          :current-name="forestData?.[0]?.name || ''"
          @update="handleNameUpdate"
        />
      </div>
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
          :class="forestData && forestData[0].isPublic ? 'public' : 'private'">
          {{ forestData && forestData[0].isPublic ? '공개중' : '비공개' }}
        </div>
      </div>
    </div>

    <!-- 아이템 조절 컨트롤 패널 -->
    <div v-if="showControlPanel && selectedPiece" class="control-panel">
      <div class="control-section">
        <h4>아이템 설정</h4>
        
        <div class="item-preview">
          <img :src="selectedPiece.icon" :alt="selectedPiece.label" class="preview-image" />
          <p class="item-name">{{ selectedPiece.label }}</p>
        </div>
        
        <div class="control-group">
          <label class="control-label">크기 조절</label>
          <div class="scale-display">{{ Math.round(itemScale * 100) }}%</div>
          <div class="control-buttons">
            <button @click="decreaseScale" class="control-btn">-</button>
            <button @click="increaseScale" class="control-btn">+</button>
          </div>
        </div>
        
        <div class="control-group">
          <label class="control-label">레이어 조절</label>
          <div class="layer-display">{{ itemZIndex }}</div>
          <div class="control-buttons">
            <button @click="decreaseZIndex" class="control-btn">-</button>
            <button @click="increaseZIndex" class="control-btn">+</button>
          </div>
        </div>
        
        <div class="control-actions">
          <button @click="handleCompletePlacement" class="complete-btn-panel">배치 완료</button>
        </div>
      </div>
    </div>

    <template v-if="showGuestBook">
      <template v-if="showGuestBookDetail">
        <GuestBookDetail 
          :id="selectedGuestBookId"
          @back="handleDetailBack"
        />
      </template>
      <template v-else>
        <!-- GuestBookList 컴포넌트가 주석 처리되어 있으므로 여기에 추가 -->
        <!-- GuestBookList 
          @back="handleGuestBookBack"
          @show-detail="handleShowDetail"
        /> -->
      </template>
    </template>

    <div ref="containerRef" class="placement-container">
      <div class="placement-inner-container">
        <img
          v-if="forestData && forestData.length"
          ref="bgRef"
          class="background"
          :src="forestData[0].backgroundImageUrl"
          alt="Green Background"
        />
        
        <!-- 배치된 아이템들 -->
        <img
          v-if="forestData && forestData.length"
          v-for="item in sortedPlacementList"
          :key="item.placementId"
          class="item"
          :src="item.itemImageUrl" 
          :alt="item.itemName"
          :style="{
            left: `${item.placementPositionX}%`,
            top: `${item.placementPositionY}%`,
            width: item.placementWidth ? `${item.placementWidth}px` : `${ITEM_CONSTANTS.BASE_SIZE}px`,
            height: item.placementHeight ? `${item.placementHeight}px` : `${ITEM_CONSTANTS.BASE_SIZE}px`,
            zIndex: item.placementZIndex,
            opacity: showYellowDust ? ITEM_CONSTANTS.YELLOW_DUST_OPACITY : 1
          }"
          draggable="false"
        />
        
        <!-- 드래그 중인 아이템 -->
        <img
          v-if="selectedPiece"
          class="item draggable"
          :src="selectedPiece.icon"
          :alt="selectedPiece.label"
          :style="{
            left: `${dragPos.x}%`,
            top: `${dragPos.y}%`,
            width: `${calculatedWidth}px`,
            height: `${calculatedHeight}px`,
            cursor: isDragging ? 'grabbing' : 'grab',
            zIndex: itemZIndex,
            opacity: showYellowDust ? ITEM_CONSTANTS.YELLOW_DUST_OPACITY : 1
          }"
          @mousedown="onMouseDown"
          @dragstart.prevent
          draggable="false"
        />
      </div>
    </div>

    <RainEffects v-if="showRain" />
    <FlowerRainEffect v-if="showFlowerRain" />
    <FogEffects v-if="showFog" />
    <YellowDustEffects v-if="showYellowDust" />
    <SnowEffects v-if="showSnow" />
    <ThunderEffects v-if="showThunder" />
    <CloudyEffects v-if="showCloudy" />
    
    <AlertModal 
      v-if="showAlertModal"
      :message="alertMessage"
      @close="closeAlertModal"
    />
  </div>
</template>

<style scoped>
.placement-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

.placement-inner-container {
  position: relative;
  width: 800px;
  height: auto;
}

.background {
  width: 100%;
  height: auto;
  display: block;
}

.item {
  position: absolute;
  user-select: none;
  transform: translate(-50%, -50%);
  object-fit: contain;
}

.top-left-icons {
  position: absolute;
  top: 12.83%;
  left: 5.07%;
  display: flex;
  gap: 16px;
  z-index: 10;
}

.edit-name-container {
  position: relative;
}

.edit-name-container .forest-name-bubble {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
}

.btn-img {
  width: 32px;
  height: 32px;
  cursor: pointer;
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
  opacity: 1;
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

.item.draggable {
  user-select: none;
  touch-action: none;
  position: absolute;
}

.control-panel {
  position: fixed;
  top: 50%;
  right: 20px;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1.5px solid rgba(255, 255, 255, 0.25);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  padding: 32px 28px;
  z-index: 1000;
  min-width: 260px;
  min-height: 500px;
  display: flex;
  flex-direction: column;
}

.control-section {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.control-section h4 {
  margin: 0 0 24px 0;
  color: #fff;
  font-size: 20px;
  font-weight: 700;
  text-align: center;
  letter-spacing: -0.5px;
}

.item-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 32px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.preview-image {
  width: 64px;
  height: 64px;
  object-fit: contain;
  margin-bottom: 12px;
}

.item-name {
  color: rgba(255, 255, 255, 0.9);
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  text-align: center;
}

.control-group {
  margin-bottom: 32px;
}

.control-label {
  display: block;
  margin-bottom: 16px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 16px;
  font-weight: 600;
  text-align: center;
}

.scale-display, .layer-display {
  color: #fff;
  font-size: 24px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 8px;
}

.size-info {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  text-align: center;
  margin-bottom: 20px;
}

.control-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.control-btn {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1.5px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  cursor: pointer;
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.control-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.control-actions {
  margin-top: auto;
  display: flex;
  justify-content: center;
}

.complete-btn-panel {
  width: 100%;
  padding: 16px;
  background: rgba(58, 90, 64, 0.8);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #fff;
  border: 1.5px solid rgba(58, 90, 64, 0.6);
  border-radius: 12px;
  cursor: pointer;
  font-size: 18px;
  font-weight: 700;
  transition: all 0.3s ease;
  letter-spacing: -0.5px;
}

.complete-btn-panel:hover {
  background: rgba(58, 90, 64, 1);
  border-color: rgba(58, 90, 64, 0.8);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(58, 90, 64, 0.4);
}

.complete-btn-panel:active {
  transform: translateY(0);
}

.forest-detail {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.home-icon {
  position: absolute;
  top: 15px;
  left: 40px;
  width: 120px;
  height: 100px;
  cursor: pointer;
  z-index: 2;
  object-fit: contain;
  transition: transform 0.2s ease;
}

.home-icon:hover {
  transform: scale(1.1);
}
</style>