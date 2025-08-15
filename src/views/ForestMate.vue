<template>
  <div class="forest-mate">
    <img 
      src="/icon.png" 
      alt="Home" 
      class="home-icon" 
      @click="goToHome"
    />
    <div ref="containerRef" class="placement-container">
      <div class="placement-inner-container">
        <button v-if="selectedPiece" class="complete-btn" @click="handleCompletePlacement">배치 완료</button>
        <img
          v-if="forestData"
          class="background"
          :src="forestData.backgroundImageUrl"
          alt="Background"
        />
        <img
          v-if="forestData"
          v-for="item in forestData.placementList"
          :key="item.placementId"
          class="item"
          :src="item.itemImageUrl" 
          :alt="item.itemName"
          :style="{
            left: `${item.placementPositionX}%`,
            top: `${item.placementPositionY}%`,
            width: '60px',
            zIndex: 100 + Math.round(item.placementPositionY)
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
            width: '60px',
            cursor: isDragging ? 'grabbing' : 'grab',
            zIndex: 100 + Math.round(dragPos.y)
          }"
          @mousedown="onMouseDown"
          @dragstart.prevent
          draggable="false"
        />
      </div>
    </div>

    <h1 class="title">{{ forestData?.name || "숲 이름 없음" }}</h1>
    <div class="nickname-list">
      함께하는 친구👥 : {{ forestData?.nicknames?.join(", ") || "없음" }}
    </div>

    <div v-if="isLoading" class="loading">로딩 중...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, getCurrentInstance, computed} from "vue";
import { useRoute, useRouter } from "vue-router";
import WithdrawModal from "../components/forest/mate/WithdrawModal.vue";
import api from "@/lib/api.js";
import { useAuthStore } from "@/stores/auth.js";
import { storeToRefs } from "pinia";



const route = useRoute();
const router = useRouter();
const forestData = ref(null);
const isLoading = ref(true);
const error = ref(null);    
const isWithdrawModalOpen = ref(false);
const { proxy } = getCurrentInstance();
const selectedPiece = ref(null);
const dragPos = ref({ x: 50, y: 50 });
const isDragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });
const containerRef = ref(null);

const auth = useAuthStore();
// 반응형으로 꺼내기
const { accessToken, user, isAuthenticated } = storeToRefs(auth); 
const Token = computed(() => accessToken.value ?? null);

// 간단하게 forestId 설정
const forestId = computed(() => {
  const id = user.value?.forestId;
  const routeId = route.params.id;
  
  console.log('ForestId - user.value?.forestId:', id);
  console.log('ForestId - route.params.id:', routeId);
  console.log('ForestId - final value:', id || routeId || null);
  
  return id || routeId || null;
});

const fetchForestData = async () => {
  try {
    isLoading.value = true;
    error.value = null;

    console.log('fetchForestData - forestId:', forestId.value);
    console.log('fetchForestData - Token:', Token.value);

    if (!forestId.value) {
      throw new Error("숲 ID가 없습니다.");
    }

    if (!Token.value) {
      throw new Error("로그인이 필요합니다.");
    }

    const apiUrl = `/mate/detail/${forestId.value}`;
    console.log("API URL:", apiUrl);
    
    const response = await api.get(apiUrl);

    console.log("API Response:", response);
    console.log("Forest ID used:", forestId.value);
    
    const data = response.data;
    console.log("Received data:", data);
    const validData = Array.isArray(data) ? data[0] : data;

    if (!validData) {
      throw new Error("유효한 데이터를 찾을 수 없습니다.");
    }

    forestData.value = validData;
  } catch (err) {
    console.error("Error:", err);
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
};

const handleImageError = (e) => {
  console.error("이미지 로드 실패:", e.target.src);
  console.log("아이템 정보:", forestData.value?.placementList);
};

onMounted(() => {
  console.log('ForestMate Mounted');
  console.log('User:', user.value);
  console.log('Forest ID:', forestId.value);
  console.log('Token:', Token.value);
  
  fetchForestData();
  
  proxy.emitter.on('place-item', (piece) => {
    selectedPiece.value = piece;
    dragPos.value = { x: 10, y: 20 };
    console.log('Received piece in ForestMate:', selectedPiece.value);
  });
});

onUnmounted(() => {
  proxy.emitter.off('place-item');
});

const onMouseDown = (event) => {
  event.preventDefault();
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

  if (!selectedPiece.value || !forestId.value) {
    alert('필수 정보가 없습니다.');
    return;
  }
  const body = {
    forestId: Number(forestId.value),
    itemPositionX: dragPos.value.x,
    itemPositionY: dragPos.value.y,
    itemId: selectedPiece.value.value
  };
  try {
    console.log('=== Item Placement Request ===');
    console.log('Request body:', body);
    console.log('Forest ID:', forestId.value);
    console.log('========================');
    
    const res = await api.post('/emotion-forest/placement', body);
    
    console.log('=== Item Placement Response ===');
    console.log('Response status:', res.status);
    console.log('Response data:', res.data);
    console.log('========================');
    
    if (res.status >= 200 && res.status < 300) {
      alert('배치가 완료되었습니다!');
      await fetchForestData();
      selectedPiece.value = null;
    } else {
      throw new Error(`배치 실패: ${res.status}`);
    }
  } catch (err) {
    console.error('=== 아이템 배치 실패 ===');
    console.error('Error:', err);
    console.error('Error message:', err.message);
    console.error('Error response:', err.response?.data);
    console.error('Error status:', err.response?.status);
    console.error('========================');
    
    alert('배치에 실패했습니다.');
  }
};

const goToHome = () => {
  console.log('=== Go To Home ===');
  console.log('User:', user.value);
  console.log('Forest ID:', forestId.value);
  console.log('========================');
  forestId.value = user.value?.forestId;
  
  if (forestId.value) {
    // 회원의 forestId로 이동
    router.push(`/forest-detail/${forestId.value}`);
  } else {
    // forestId가 없으면 기본 홈으로
    router.push('/');
  }
}
</script>

<style scoped>
.forest-mate {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

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

.item.draggable {
  user-select: none;
  touch-action: none;
  position: absolute;
}

.complete-btn {
  position: absolute;
  top: 530px;
  right: 340px;
  z-index: 30;
  padding: 15px 28px;
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

.title {
  position: absolute;
  top: 12.83%;
  left: 5.07%;
  color: white;
  font-size: 24px;
  font-weight: 500;
  margin: 0;
}

.nickname-list {
  position: absolute;
  top: 16%;
  left: 5.07%;
  color: white;
  font-size: 18px;
  margin: 0;
  text-align: left;
  width: auto;
}

.top-left-icons {
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

.loading,
.error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 18px;
  text-align: center;
}

.error {
  color: #ff6b6b;
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
