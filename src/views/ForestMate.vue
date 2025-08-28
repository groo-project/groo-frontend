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

    <div class="title-section">
      <h1 class="title">{{ forestData?.name || "숲 이름 없음" }}</h1>
      <img 
        src="@/icons/edit_icon.png" 
        alt="Edit" 
        class="edit-name-btn" 
        @click="openEditNameModal"
        title="숲 이름 수정"
      />
    </div>
    <div class="nickname-list">
      함께하는 친구👥 : {{ forestData?.nicknames?.join(", ") || "없음" }}
    </div>

    <div v-if="isLoading" class="loading">로딩 중...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    
    <!-- 성공 메시지 -->
    <div v-if="showSuccessMessage" class="success-message">
      <div class="success-content">
        <div class="success-icon">🌿</div>
        <div class="success-text">배치가 완료되었습니다!</div>
      </div>
    </div>
    
    <!-- 숲 이름 수정 모달 -->
    <EditMateForestNameModal
      v-if="isEditNameModalOpen"
      :isOpen="isEditNameModalOpen"
      :currentName="forestData?.name || ''"
      :forestId="forestId"
      @close="closeEditNameModal"
      @update="handleNameUpdated"
    />
    
    <!-- 알림 모달 -->
    <AlertModal
      v-if="showAlertModal"
      :message="alertMessage"
      @close="showAlertModal = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, getCurrentInstance, computed} from "vue";
import { useRoute, useRouter } from "vue-router";
import WithdrawModal from "../components/forest/mate/WithdrawModal.vue";
import EditMateForestNameModal from "../components/forest/mate/EditMateForestNameModal.vue";
import AlertModal from "@/components/common/AlertModal.vue";
import api from "@/lib/api.js";
import { useAuthStore } from "@/stores/auth.js";
import { storeToRefs } from "pinia";




const route = useRoute();
const router = useRouter();
const forestData = ref(null);
const isLoading = ref(true);
const error = ref(null);    
const isWithdrawModalOpen = ref(false);
const showSuccessMessage = ref(false);
const isEditNameModalOpen = ref(false);
const showAlertModal = ref(false);
const alertMessage = ref('');
const { proxy } = getCurrentInstance();
const selectedPiece = ref(null);
const dragPos = ref({ x: 50, y: 50 });
const isDragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });
const containerRef = ref(null);

const auth = useAuthStore();
// 반응형으로 꺼내기
const { accessToken, user, isAuthenticated } = storeToRefs(auth);

const showSuccess = () => {
  alertMessage.value = '배치가 완료되었습니다!';
  showAlertModal.value = true;
}; 
const Token = computed(() => accessToken.value ?? null);


const forestId = computed(() => {
  const routeId = route.params.id;
  
  console.log('=== ForestMate ForestId ===');
  console.log('Route params id (우정의 숲 ID):', routeId);
  console.log('User forestId (개인 숲 ID):', user.value?.forestId);
  console.log('Final forestId (우정의 숲 ID):', routeId);
  console.log('========================');
  
  return routeId;
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
  
  // 실시간 업데이트를 위한 주기적 폴링 (5초마다)
  const updateInterval = setInterval(() => {
    if (forestId.value && Token.value) {
      fetchForestData();
    }
  }, 5000);
  
  // 초대 수락 이벤트 감지
  proxy.emitter.on('invite-accepted', (data) => {
    if (data.forestId === forestId.value) {
      fetchForestData();
    }
  });
  
  // 아이템 배치 완료 이벤트 감지
  proxy.emitter.on('item-placed', (data) => {
    if (data.forestId === forestId.value) {
      fetchForestData();
    }
  });
  
  // 사용자 탈퇴 이벤트 감지
  proxy.emitter.on('user-withdrawn', (data) => {
    if (data.forestId === forestId.value) {
      fetchForestData();
    }
  });
  
  // 숲 이름 업데이트 이벤트 감지
  proxy.emitter.on('forest-name-updated', (data) => {
    if (data.forestId === forestId.value) {
      console.log('현재 우정의 숲 이름이 업데이트됨 - 데이터 즉시 업데이트');
      fetchForestData();
    }
  });
  
  proxy.emitter.on('place-item', (piece) => {
    selectedPiece.value = piece;
    dragPos.value = { x: 10, y: 20 };
    console.log('Received piece in ForestMate:', selectedPiece.value);
  });
  
  // 컴포넌트 언마운트 시 인터벌 정리
  onUnmounted(() => {
    clearInterval(updateInterval);
  });
});

onUnmounted(() => {
  proxy.emitter.off('place-item');
  proxy.emitter.off('invite-accepted');
  proxy.emitter.off('item-placed');
  proxy.emitter.off('user-withdrawn');
  proxy.emitter.off('forest-name-updated');
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
    alertMessage.value = '필수 정보가 없습니다.';
    showAlertModal.value = true;
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
      showSuccess();
      
      // 아이템 배치 완료 이벤트 발생 (다른 사용자들의 화면 업데이트)
      if (proxy?.emitter) {
        proxy.emitter.emit('item-placed', {
          forestId: forestId.value,
          itemId: selectedPiece.value.value,
          position: { x: dragPos.value.x, y: dragPos.value.y },
          timestamp: new Date().toISOString()
        });
        console.log('아이템 배치 완료 이벤트 발생:', forestId.value);
      }
      
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
    
    alertMessage.value = '배치에 실패했습니다.';
    showAlertModal.value = true;
  }
};

const openEditNameModal = () => {
  isEditNameModalOpen.value = true;
};

const closeEditNameModal = () => {
  isEditNameModalOpen.value = false;
};

const handleNameUpdated = async (newName) => {
  console.log('숲 이름이 업데이트됨:', newName);
  closeEditNameModal();
  
  // 숲 이름 업데이트 이벤트 발생 (다른 사용자들의 화면 업데이트)
  if (proxy?.emitter) {
    proxy.emitter.emit('forest-name-updated', {
      forestId: forestId.value,
      newName: newName,
      timestamp: new Date().toISOString()
    });
    console.log('숲 이름 업데이트 이벤트 발생:', forestId.value);
  }
  
  // 데이터 새로고침
  await fetchForestData();
};

const goToHome = () => {
  console.log('=== Go To Home ===');
  console.log('User:', user.value);
  console.log('Current 우정의 숲 ID:', forestId.value);
  console.log('User 개인 숲 ID:', user.value?.forestId);
  console.log('========================');
  
  if (user.value?.forestId) {
    // 개인 숲(감정의 숲)으로 이동
    router.push(`/forest-detail/${user.value.forestId}`);
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

.title-section {
  position: absolute;
  top: 12.83%;
  left: 5.07%;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 10;
}

.title {
  color: rgb(68, 116, 77);
  font-size: 32px;
  font-weight: 600;
  margin: 0;
  padding-top: 15px;
}

.edit-name-btn {
  width: 24px;
  height: 24px;
  cursor: pointer;
  transition: opacity 0.2s;
  filter: brightness(0) invert(1); /* 흰색으로 변경 */
}

.edit-name-btn:hover {
  opacity: 0.8;
}

.nickname-list {
  position: absolute;
  top: 20%;
  left: 5.07%;
  color: rgb(58, 90, 64);
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

.success-message {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease-in;
}

.success-content {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 40px 60px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.4s ease-out;
}

.success-icon {
  font-size: 60px;
  margin-bottom: 20px;
  animation: bounce 0.6s ease-in-out;
}

.success-text {
  font-size: 24px;
  font-weight: 600;
  color: #2d4632;
  margin: 0;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    transform: translateY(30px);
    opacity: 0;
  }
  to { 
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}
</style>
