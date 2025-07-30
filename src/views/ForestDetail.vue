<script setup>
import { ref, onMounted, onUnmounted, getCurrentInstance, computed } from "vue";
import buttonIcon_6 from "../icons/edit_icon.png"
import buttonIcon_8 from "../icons/is_public_icon.png"
import GuestBookList from "../components/GuestBookList.vue";
import GuestBookDetail from "../components/GuestBookDetail.vue";
import { useRouter } from 'vue-router';
import RainEffects from "../components/RainEffects.vue"; // Rain 효과 컴포넌트 불러오기
import FlowerRainEffect from "../components/FlowerRainEffect.vue";
// import FogEffect from "../components/FogEffect.vue";
import FogEffects from "../components/FogEffects.vue";
import YellowDustEffects from "../components/YellowDustEffects.vue";
import SnowEffects from "../components/SnowEffects.vue";
import ThunderEffects from "../components/ThunderEffects.vue";
import CloudyEffects from "../components/CloudyEffects.vue";
import EditForestName from "../components/EditForestName.vue";
import AlertModal from "../components/AlertModal.vue";

const router = useRouter();
const showGuestBook = ref(false);
const showGuestBookDetail = ref(false);
const selectedGuestBookId = ref(null);

const bgRef = ref(null); // background 요소 참조
const containerRef = ref(null); // placement-container 요소 참조
const itemWidth = ref(60); // 아이템의 고정 크기
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

const { proxy } = getCurrentInstance();

const showRain = computed(() => {
  forceUpdate.value;
  const weather = localStorage.getItem('weather');
  return weather === '비';
});

const showFlowerRain = computed(() => {
  forceUpdate.value;
  const weather = localStorage.getItem('weather');
  return weather === '꽃비';
});

const showFog = computed(() => {
  forceUpdate.value;
  const weather = localStorage.getItem('weather');
  return weather === '안개';
});

const showYellowDust = computed(() => {
  forceUpdate.value;
  const weather = localStorage.getItem('weather');
  return weather === '황사';
});

const showSnow = computed(() => {
    forceUpdate.value;
    const weather = localStorage.getItem('weather');
    return weather === '맑음';
  });

const showThunder = computed(() => {
  forceUpdate.value;
  const weather = localStorage.getItem('weather');
  return weather === '번개';
});

const showCloudy = computed(() => {
  forceUpdate.value;
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
    dragPos.value = { x: 10, y: 20 };
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
    itemId: selectedPiece.value.value
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
}
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

    <template v-if="showGuestBook">
      <template v-if="showGuestBookDetail">
        <GuestBookDetail 
          :id="selectedGuestBookId"
          @back="handleDetailBack"
        />
      </template>
      <template v-else>
        <GuestBookList 
          @back="handleGuestBookBack"
          @show-detail="handleShowDetail"
        />
      </template>
    </template>

    <div ref="containerRef" class="placement-container">
      <div class="placement-inner-container">
        <button v-if="selectedPiece" class="complete-btn" @click="handleCompletePlacement">배치 완료</button>
        <img
          v-if="forestData && forestData.length"
          ref="bgRef"
          class="background"
          :src="forestData[0].backgroundImageUrl"
          alt="Green Background"
        />
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
            width: `${itemWidth}px`,
            zIndex: 100 + Math.round(item.placementPositionY),
            opacity: showYellowDust ? 0.7 : 1
          }"
          draggable="false"
        />
        <img
          v-if="selectedPiece"
          class="item draggable"
          :src="selectedPiece.icon"
          :alt="selectedPiece.label"
          :style="{
            left: `${dragPos.x}%`,
            top: `${dragPos.y}%`,
            width: `${itemWidth}px`,
            cursor: isDragging ? 'grabbing' : 'grab',
            zIndex: 100 + Math.round(dragPos.y),
            opacity: showYellowDust ? 0.7 : 1
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

/* .item.draggable:active {
  transform: scale(1.05);
} */

.place-btn {
  margin-top: 16px;
  padding: 8px 20px;
  background: #3a5a40;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}
.place-btn:hover {
  background: #2d4632;
}

.complete-btn {
  position: absolute;
  top: 530px;
  right: 340px;
  z-index: 30;
  padding: 16px 28px;
  background: #3a5a40;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.complete-btn:hover {
  background: #2d4632;
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

