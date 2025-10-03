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
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, getCurrentInstance, computed, nextTick} from "vue";
import { useRoute, useRouter } from "vue-router";
import EditMateForestNameModal from "../components/forest/mate/EditMateForestNameModal.vue";
import api from "@/lib/api.js";
import { useAuthStore } from "@/stores/auth.js";
import { storeToRefs } from "pinia";
import { useAlertStore } from '@/stores/alert'

const alert = useAlertStore()

const route = useRoute();
const router = useRouter();
const forestData = ref(null);
const isLoading = ref(true);
const error = ref(null);    
const showSuccessMessage = ref(false);
const isEditNameModalOpen = ref(false);
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

const forestId = computed(() => {
  const routeId = route.params.id;
  
  return routeId;
});

const fetchForestData = async () => {
  try {
    isLoading.value = true;
    error.value = null;

    if (!forestId.value) {
      throw new Error("숲 ID가 없습니다.");
    }

    if (!Token.value) {
      throw new Error("로그인이 필요합니다.");
    }

    const apiUrl = `mate/detail/${forestId.value}`;
    
    const response = await api.get(apiUrl);

    // console.log("API Response:", response);

    
    const data = response.data;
    // console.log("Received data:", data);
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
};

onMounted(() => {

  // 숲 데이터 조회
  fetchForestData();
  
    let eventSource = null;
    
    if (forestId.value && Token.value && isAuthenticated.value) {
      
      // EventSource 인스턴스 생성
      const sseUrl = `${api.defaults.baseURL}/sse/mate/${forestId.value}/events`;
      
      try {
        eventSource = new EventSource(sseUrl, { withCredentials: true });
      } catch (error) {
        return;
      }
    
    setupSSEHandlers(eventSource);
  }
  
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
      fetchForestData();
    }
  });
  
  // SSE 연결 정리 이벤트 처리 (탈퇴 시)
  proxy.emitter.on('cleanup-sse-connection', (data) => {
    if (data.forestId === forestId.value && data.userId === user.value?.userId) {
      
      // 즉시 페이지 이동
      const userForestId = user.value?.forestId;
        if (userForestId) {
        router.push(`/forest-detail/${userForestId}?withdrawal=true`);
      } else {
        router.push('/');
      }
    }
  });
  
  proxy.emitter.on('place-item', (piece) => {
    selectedPiece.value = piece;
    dragPos.value = { x: 10, y: 20 };
  });
  

  onUnmounted(() => {
    if (eventSource) {
      eventSource.close();
    }
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
    alert.show('필수 정보가 없습니다.')
    return;
  }
  const body = {
    forestId: Number(forestId.value),
    itemPositionX: dragPos.value.x,
    itemPositionY: dragPos.value.y,
    itemId: selectedPiece.value.value
  };
  try {
    
    const res = await api.post('emotion-forest/placement', body);
    
    
    if (res.status >= 200 && res.status < 300) {
      alert.show("'배치가 완료되었습니다!'")
      
      // 아이템 배치 완료 이벤트 발생 (다른 사용자들의 화면 업데이트)
      if (proxy?.emitter) {
        proxy.emitter.emit('item-placed', {
          forestId: forestId.value,
          itemId: selectedPiece.value.value,
          position: { x: dragPos.value.x, y: dragPos.value.y },
          timestamp: new Date().toISOString()
        });
      }
      
    await fetchForestData();
    selectedPiece.value = null;
    } else {
      throw new Error(`배치 실패: ${res.status}`);
    }
  } catch (err) {
    console.error('Error:', err);
    
    alert.show('배치에 실패했습니다.')
  }
};

const openEditNameModal = () => {
  isEditNameModalOpen.value = true;
};

const closeEditNameModal = () => {
  isEditNameModalOpen.value = false;
};

//이벤트별 핸들러 함수

// 시퀀스 번호 관리 (중복 이벤트 방지)
let lastSeq = 0;

// SSE 재연결 함수 (새로고침 없이)
const reconnectSSE = () => {
  

  if (forestId.value && Token.value && isAuthenticated.value) {
    
    // 새로운 EventSource 생성
    const sseUrl = `${api.defaults.baseURL}/sse/mate/${forestId.value}/events`;
    
    try {
      const newEventSource = new EventSource(sseUrl, { withCredentials: true });
      
      // 기존 이벤트 핸들러 재등록
      setupSSEHandlers(newEventSource);
      
      // 기존 연결 정리
      if (eventSource) {
        eventSource.close();
      }
      
      // 새 연결로 교체
      eventSource = newEventSource;
      
      
      // 재연결 성공 시 카운터 리셋
      window.sseReconnectAttempts = 0;
      
    } catch (error) {
      console.error('SSE 재연결 실패:', error);
    }
  } else {
  }
};

// SSE 핸들러 설정 함수
const setupSSEHandlers = (emitter) => {
  // 이벤트 타입별 리스너 등록
  emitter.addEventListener('USER_JOINED', (event) => {
    try {
      const data = JSON.parse(event.data);
      handleUserJoined(data);
    } catch (error) {
      console.error('USER_JOINED 데이터 파싱 오류:', error);
    }
  });
  
  emitter.addEventListener('USER_LEFT', (event) => {
    try {
      const data = JSON.parse(event.data);
      handleUserLeft(data);
    } catch (error) {
      console.error('USER_LEFT 데이터 파싱 오류:', error);
    }
  });
  
  emitter.addEventListener('ITEM_PLACED', (event) => {
    try {
      const data = JSON.parse(event.data);
      handleItemPlaced(data);
    } catch (error) {
      console.error('ITEM_PLACED 데이터 파싱 오류:', error);
    }
  });
  
  emitter.addEventListener('FOREST_UPDATED', (event) => {
    try {
      const data = JSON.parse(event.data);
      handleForestUpdated(data);
    } catch (error) {
      console.error('FOREST_UPDATED 데이터 파싱 오류:', error);
    }
  });
  
  emitter.addEventListener('FOREST_NAME_CHANGED', (event) => {
    try {
      const data = JSON.parse(event.data);
      handleForestNameChanged(data);
    } catch (error) {
      console.error('FOREST_NAME_CHANGED 데이터 파싱 오류:', error);
    }
  });
  
  
  
  // 연결 성공 핸들러
  emitter.onopen = () => {
    // EventSource는 자체적으로 연결 상태를 관리하므로
    // 불필요한 주기적 체크 제거
  };
  
  // 연결 오류 핸들러
  emitter.onerror = (error) => {
    console.error('Error:', error);
    
    // 연결 재시도 로직 (새로고침 없이)
    if (emitter.readyState === EventSource.CLOSED) {
      
      // 재연결 시도 횟수 제한
      if (!window.sseReconnectAttempts) {
        window.sseReconnectAttempts = 0;
      }
      
      if (window.sseReconnectAttempts < 3) {
        window.sseReconnectAttempts++;
        
        setTimeout(() => {
          // 기존 연결 정리
          if (emitter) {
            emitter.close();
          }
          // 새 연결 시도 (새로고침 없이)
          reconnectSSE();
        }, 5000);
      } else {
        alert.show('연결이 불안정합니다. 페이지를 새로고침해주세요.')
      }
    }
  };
  
};

// USER_JOINED 핸들러 (새 멤버 참여)
const handleUserJoined = async (data) => {

  // 시퀀스 체크 및 중복 방지
  const { seq, payload = {} } = data || {};
  if (seq && seq <= lastSeq) {
    return;
  }
  if (seq) {
    lastSeq = seq;
  }

  // forestId 검증
  const eventForestId = payload.forestId ?? data.forestId;
  if (Number(eventForestId) !== Number(forestId.value)) {
    return;
  }

  // userId 검증
  const { userId } = payload;
  if (!userId) {
    return;
  }


  // 백엔드에서 전송한 nickname 정보 확인
  const eventNickname = payload.nickname;
  
  if (eventNickname) {
    // nicknames 배열에 직접 추가 (중복 방지)
    if (!forestData.value?.nicknames?.includes(eventNickname)) {
      if (!forestData.value) {
        forestData.value = { nicknames: [] };
      }
      if (!forestData.value.nicknames) {
        forestData.value.nicknames = [];
      }
      
      forestData.value.nicknames.push(eventNickname);
      
      // 화면 강제 업데이트
      await nextTick();
    } else {
    }
  } else {
    // 백업: fetchForestData()로 전체 데이터 새로고침
    await fetchForestData();
  }
  
  // 성공 메시지 표시
  alert.show(`새 멤버가 우정의 숲에 참여했습니다!`)
};

// USER_LEFT 핸들러 (멤버 탈퇴)
const handleUserLeft = async (data) => {
  const { seq, payload = {} } = data || {};
  
  // 시퀀스 체크
  if (seq && seq <= lastSeq) return;
  if (seq) lastSeq = seq;
  
  // forestId 검증
  const eventForestId = payload.forestId ?? data.forestId;
  if (Number(eventForestId) !== Number(forestId.value)) return;
  
  const { userId } = payload;
  if (!userId) return;
  
  
  // 데이터 새로고침
  await fetchForestData();
  
  // 성공 메시지 표시
  alert.show(`멤버가 우정의 숲을 떠났습니다.`)
};

// ITEM_PLACED 핸들러 (아이템 배치)
const handleItemPlaced = async (data) => {
  const { seq, payload = {} } = data || {};
  
  // 시퀀스 체크
  if (seq && seq <= lastSeq) return;
  if (seq) lastSeq = seq;
  
  // forestId 검증
  const eventForestId = payload.forestId ?? data.forestId;
  if (Number(eventForestId) !== Number(forestId.value)) return;
  
  
  // 데이터 새로고침
  await fetchForestData();
};

// FOREST_UPDATED 핸들러 (숲 정보 업데이트)
const handleForestUpdated = async (data) => {
  const { seq, payload = {} } = data || {};
  
  // 시퀀스 체크
  if (seq && seq <= lastSeq) return;
  if (seq) lastSeq = seq;
  
  // forestId 검증
  const eventForestId = payload.forestId ?? data.forestId;
  if (Number(eventForestId) !== Number(forestId.value)) return;
  
  
  // 데이터 새로고침
  await fetchForestData();
};

// FOREST_NAME_CHANGED 핸들러 (숲 이름 변경)
const handleForestNameChanged = async (data) => {
  const { seq, payload = {} } = data || {};
  
  // 시퀀스 체크
  if (seq && seq <= lastSeq) return;
  if (seq) lastSeq = seq;
  
  // forestId 검증
  const eventForestId = payload.forestId ?? data.forestId;
  if (Number(eventForestId) !== Number(forestId.value)) return;
  
  
  // 데이터 새로고침
  await fetchForestData();
};

const handleNameUpdated = async (newName) => { 
  closeEditNameModal();
  
  // 숲 이름 업데이트 이벤트 발생 (다른 사용자들의 화면 업데이트)
  if (proxy?.emitter) {
    proxy.emitter.emit('forest-name-updated', {
      forestId: forestId.value,
      newName: newName,
      timestamp: new Date().toISOString()
    });
  }
  
  // 데이터 새로고침
  await fetchForestData();
};

const goToHome = () => {
  
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
