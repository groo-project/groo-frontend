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
import { ref, onMounted, onUnmounted, getCurrentInstance, computed, nextTick} from "vue";
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

    // console.log('fetchForestData - forestId:', forestId.value);
    // console.log('fetchForestData - Token:', Token.value);

    if (!forestId.value) {
      throw new Error("숲 ID가 없습니다.");
    }

    if (!Token.value) {
      throw new Error("로그인이 필요합니다.");
    }

    const apiUrl = `/mate/detail/${forestId.value}`;
    
    const response = await api.get(apiUrl);

    // console.log("API Response:", response);
    // console.log("Forest ID used:", forestId.value);
    
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
  console.log("아이템 정보:", forestData.value?.placementList);
};

onMounted(() => {
  console.log('ForestMate Mounted');

  // 숲 데이터 조회
  fetchForestData();
  
      // ===== A. SSE 연결 설정 =====
    let eventSource = null;
    
    if (forestId.value && Token.value && isAuthenticated.value) {
      console.log('=== SSE 연결 시작 ===');
      // console.log('Forest ID:', forestId.value);
      // console.log('Token 존재:', !!Token.value);
      // console.log('사용자 인증 상태:', isAuthenticated.value);
      // console.log('현재 사용자:', user.value?.nickname);
      
      // EventSource 인스턴스 생성
      const sseUrl = `${api.defaults.baseURL}/sse/mate/${forestId.value}/events`;
      console.log('EventSource URL:', sseUrl);
      console.log('EventSource 옵션:', { withCredentials: true });
      
      try {
        eventSource = new EventSource(sseUrl, { withCredentials: true });
        console.log('EventSource 인스턴스 생성 성공');
        console.log('EventSource readyState:', eventSource.readyState);
      } catch (error) {
        console.error('EventSource 생성 실패:', error);
        return;
      }
    
    // ===== B. 이벤트 수신 및 처리 =====
    // SSE 핸들러 설정
    setupSSEHandlers(eventSource);
  } else {
    console.log('SSE 연결 조건 미충족:', {
      forestId: forestId.value,
      hasToken: !!Token.value,
      isAuthenticated: isAuthenticated.value
    });
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
      console.log('현재 우정의 숲 이름이 업데이트됨 - 데이터 즉시 업데이트');
      fetchForestData();
    }
  });
  
  proxy.emitter.on('place-item', (piece) => {
    selectedPiece.value = piece;
    dragPos.value = { x: 10, y: 20 };
    console.log('Received piece in ForestMate:', selectedPiece.value);
  });
  
  // ===== E. 연결 관리 및 정리 =====
  // 컴포넌트 언마운트 시 SSE 연결 정리
  onUnmounted(() => {
    if (eventSource) {
      eventSource.close();
      console.log('SSE 연결 종료');
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

// ===== D. 이벤트별 핸들러 함수 =====

// 시퀀스 번호 관리 (중복 이벤트 방지)
let lastSeq = 0;

// SSE 재연결 함수 (새로고침 없이)
const reconnectSSE = () => {
  console.log('=== SSE 재연결 시작 ===');
  
  if (forestId.value && Token.value && isAuthenticated.value) {
    console.log('재연결 조건 확인 완료');
    
    // 새로운 EventSource 생성
    const sseUrl = `${api.defaults.baseURL}/sse/mate/${forestId.value}/events`;
    console.log('재연결 URL:', sseUrl);
    
    try {
      const newEventSource = new EventSource(sseUrl, { withCredentials: true });
      console.log('새 EventSource 생성 성공');
      
      // 기존 이벤트 핸들러 재등록
      setupSSEHandlers(newEventSource);
      
      // 기존 연결 정리
      if (eventSource) {
        eventSource.close();
      }
      
      // 새 연결로 교체
      eventSource = newEventSource;
      
      console.log('SSE 재연결 완료');
      
      // 재연결 성공 시 카운터 리셋
      window.sseReconnectAttempts = 0;
      
    } catch (error) {
      console.error('SSE 재연결 실패:', error);
    }
  } else {
    console.log('재연결 조건 미충족');
  }
};

// SSE 핸들러 설정 함수
const setupSSEHandlers = (emitter) => {
  console.log('SSE 핸들러 설정 시작');
  
  
  
  // 이벤트 타입별 리스너 등록
  emitter.addEventListener('USER_JOINED', (event) => {
    console.log('=== USER_JOINED 이벤트 수신 ===');
    console.log('USER_JOINED 데이터:', event.data);
    console.log('USER_JOINED 시간:', new Date().toLocaleTimeString());
    
    try {
      const data = JSON.parse(event.data);
      console.log('파싱된 데이터:', data);
      handleUserJoined(data);
    } catch (error) {
      console.error('USER_JOINED 데이터 파싱 오류:', error);
    }
  });
  
  emitter.addEventListener('USER_LEFT', (event) => {
    console.log('=== USER_LEFT 이벤트 수신 ===');
    console.log('USER_LEFT 데이터:', event.data);
    
    try {
      const data = JSON.parse(event.data);
      handleUserLeft(data);
    } catch (error) {
      console.error('USER_LEFT 데이터 파싱 오류:', error);
    }
  });
  
  emitter.addEventListener('ITEM_PLACED', (event) => {
    console.log('=== ITEM_PLACED 이벤트 수신 ===');
    console.log('ITEM_PLACED 데이터:', event.data);
    
    try {
      const data = JSON.parse(event.data);
      handleItemPlaced(data);
    } catch (error) {
      console.error('ITEM_PLACED 데이터 파싱 오류:', error);
    }
  });
  
  emitter.addEventListener('FOREST_UPDATED', (event) => {
    console.log('=== FOREST_UPDATED 이벤트 수신 ===');
    console.log('FOREST_UPDATED 데이터:', event.data);
    
    try {
      const data = JSON.parse(event.data);
      handleForestUpdated(data);
    } catch (error) {
      console.error('FOREST_UPDATED 데이터 파싱 오류:', error);
    }
  });
  
  emitter.addEventListener('FOREST_NAME_CHANGED', (event) => {
    console.log('=== FOREST_NAME_CHANGED 이벤트 수신 ===');
    console.log('FOREST_NAME_CHANGED 데이터:', event.data);
    
    try {
      const data = JSON.parse(event.data);
      handleForestNameChanged(data);
    } catch (error) {
      console.error('FOREST_NAME_CHANGED 데이터 파싱 오류:', error);
    }
  });
  
  
  
  // 연결 성공 핸들러
  emitter.onopen = () => {
    console.log('=== SSE 연결 성공 ===');
    console.log('연결된 Forest ID:', forestId.value);
    console.log('현재 사용자:', user.value?.nickname);
    console.log('실시간 이벤트 대기 중...');
    console.log('EventSource readyState:', emitter.readyState);
    
    // 연결 상태를 주기적으로 확인
    const connectionCheck = setInterval(() => {
      if (emitter.readyState === EventSource.OPEN) {
        console.log('SSE 연결 상태: OPEN - 정상 작동 중');
        console.log('EventSource 객체 상태:', {
          readyState: emitter.readyState,
          url: emitter.url,
          withCredentials: emitter.withCredentials
        });
        
        // 이벤트 리스너 상태 확인
        console.log('이벤트 리스너 상태 확인:');
        console.log('- onmessage:', !!emitter.onmessage);
        console.log('- onopen:', !!emitter.onopen);
        console.log('- onerror:', !!emitter.onerror);
        console.log('- addEventListener:', typeof emitter.addEventListener);
        
        // 이벤트 수신 테스트
        console.log('이벤트 수신 테스트 - 현재 시간:', new Date().toLocaleTimeString());
        
        // EventSource 객체 상세 정보
        console.log('EventSource 상세 정보:');
        console.log('- readyState:', emitter.readyState);
        console.log('- url:', emitter.url);
        console.log('- withCredentials:', emitter.withCredentials);
        console.log('- CONNECTING:', EventSource.CONNECTING);
        console.log('- OPEN:', EventSource.OPEN);
        console.log('- CLOSED:', EventSource.CLOSED);
        
        // 이벤트 리스너 개수 확인
        console.log('이벤트 리스너 개수 확인:');
        console.log('- message 리스너:', emitter.addEventListener ? '있음' : '없음');
        console.log('- open 리스너:', emitter.addEventListener ? '있음' : '없음');
        console.log('- error 리스너:', emitter.addEventListener ? '있음' : '없음');
      } else if (emitter.readyState === EventSource.CONNECTING) {
        console.log('SSE 연결 상태: CONNECTING - 재연결 시도 중');
      } else if (emitter.readyState === EventSource.CLOSED) {
        console.log('SSE 연결 상태: CLOSED - 연결 끊김');
        clearInterval(connectionCheck);
      }
    }, 5000); // 5초마다 확인 (더 자주)
    
    // 컴포넌트 언마운트 시 인터벌 정리
    onUnmounted(() => {
      clearInterval(connectionCheck);
    });
  };
  
  // 연결 오류 핸들러
  emitter.onerror = (error) => {
    console.error('=== SSE 연결 오류 ===');
    console.error('Error:', error);
    console.error('EventSource readyState:', emitter.readyState);
    console.error('연결 URL:', `${api.defaults.baseURL}/sse/mate/${forestId.value}/events`);
    
    // 연결 재시도 로직 (새로고침 없이)
    if (emitter.readyState === EventSource.CLOSED) {
      console.log('SSE 연결이 끊어짐 - 5초 후 재연결 시도');
      
      // 재연결 시도 횟수 제한
      if (!window.sseReconnectAttempts) {
        window.sseReconnectAttempts = 0;
      }
      
      if (window.sseReconnectAttempts < 3) {
        window.sseReconnectAttempts++;
        console.log(`SSE 재연결 시도 ${window.sseReconnectAttempts}/3`);
        
        setTimeout(() => {
          console.log('SSE 재연결 시도 중...');
          // 기존 연결 정리
          if (emitter) {
            emitter.close();
          }
          // 새 연결 시도 (새로고침 없이)
          reconnectSSE();
        }, 5000);
      } else {
        console.error('SSE 재연결 시도 횟수 초과 - 수동 새로고침 필요');
        alert('연결이 불안정합니다. 페이지를 새로고침해주세요.');
      }
    }
  };
  
  console.log('SSE 핸들러 설정 완료');
};

// USER_JOINED 핸들러 (새 멤버 참여)
const handleUserJoined = async (data) => {
  console.log('=== handleUserJoined 함수 시작 ===');
  console.log('새 멤버 참여 이벤트 수신:', data);
  console.log('현재 forestId.value:', forestId.value);
  console.log('현재 사용자:', user.value?.nickname);
  console.log('함수 호출 시간:', new Date().toLocaleTimeString());

  // 시퀀스 체크 및 중복 방지
  const { seq, payload = {} } = data || {};
  console.log('handleUserJoined - 시퀀스 체크:', { seq, lastSeq });
  if (seq && seq <= lastSeq) {
    console.log('handleUserJoined - 중복 이벤트 감지, 처리 중단');
    return;
  }
  if (seq) {
    console.log('handleUserJoined - 시퀀스 업데이트:', lastSeq, '->', seq);
    lastSeq = seq;
  }

  // forestId 검증
  const eventForestId = payload.forestId ?? data.forestId;
  console.log('handleUserJoined - forestId 검증:', { eventForestId, currentForestId: forestId.value });
  if (Number(eventForestId) !== Number(forestId.value)) {
    console.log('handleUserJoined - forestId 불일치, 처리 중단');
    return;
  }

  // userId 검증
  const { userId } = payload;
  if (!userId) {
    console.log('handleUserJoined - userId가 없음, 처리 중단');
    return;
  }

  console.log('새 멤버 참여 처리 시작:', userId);

  // 백엔드에서 전송한 nickname 정보 확인
  const eventNickname = payload.nickname;
  console.log('백엔드에서 받은 nickname:', eventNickname);
  
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
      console.log('nicknames 배열에 새 멤버 추가됨:', eventNickname);
      console.log('업데이트된 nicknames:', forestData.value.nicknames);
      
      // 화면 강제 업데이트
      await nextTick();
    } else {
      console.log('이미 존재하는 nickname:', eventNickname);
    }
  } else {
    console.log('백엔드에서 nickname 정보가 전송되지 않음 - 전체 데이터 새로고침');
    // 백업: fetchForestData()로 전체 데이터 새로고침
    await fetchForestData();
  }
  
  // 성공 메시지 표시
  alertMessage.value = `새 멤버가 우정의 숲에 참여했습니다!`;
  showAlertModal.value = true;
  
  // 3초 후 메시지 숨기기
  setTimeout(() => {
    showAlertModal.value = false;
  }, 3000);
};

// USER_LEFT 핸들러 (멤버 탈퇴)
const handleUserLeft = async (data) => {
  console.log('=== handleUserLeft 함수 시작 ===');
  const { seq, payload = {} } = data || {};
  
  // 시퀀스 체크
  if (seq && seq <= lastSeq) return;
  if (seq) lastSeq = seq;
  
  // forestId 검증
  const eventForestId = payload.forestId ?? data.forestId;
  if (Number(eventForestId) !== Number(forestId.value)) return;
  
  const { userId } = payload;
  if (!userId) return;
  
  console.log('멤버 탈퇴 처리:', userId);
  
  // 데이터 새로고침
  await fetchForestData();
  
  // 성공 메시지 표시
  alertMessage.value = `멤버가 우정의 숲을 떠났습니다.`;
  showAlertModal.value = true;
  setTimeout(() => { showAlertModal.value = false; }, 3000);
};

// ITEM_PLACED 핸들러 (아이템 배치)
const handleItemPlaced = async (data) => {
  console.log('=== handleItemPlaced 함수 시작 ===');
  const { seq, payload = {} } = data || {};
  
  // 시퀀스 체크
  if (seq && seq <= lastSeq) return;
  if (seq) lastSeq = seq;
  
  // forestId 검증
  const eventForestId = payload.forestId ?? data.forestId;
  if (Number(eventForestId) !== Number(forestId.value)) return;
  
  console.log('아이템 배치 처리:', payload);
  
  // 데이터 새로고침
  await fetchForestData();
};

// FOREST_UPDATED 핸들러 (숲 정보 업데이트)
const handleForestUpdated = async (data) => {
  console.log('=== handleForestUpdated 함수 시작 ===');
  const { seq, payload = {} } = data || {};
  
  // 시퀀스 체크
  if (seq && seq <= lastSeq) return;
  if (seq) lastSeq = seq;
  
  // forestId 검증
  const eventForestId = payload.forestId ?? data.forestId;
  if (Number(eventForestId) !== Number(forestId.value)) return;
  
  console.log('숲 정보 업데이트 처리:', payload);
  
  // 데이터 새로고침
  await fetchForestData();
};

// FOREST_NAME_CHANGED 핸들러 (숲 이름 변경)
const handleForestNameChanged = async (data) => {
  console.log('=== handleForestNameChanged 함수 시작 ===');
  const { seq, payload = {} } = data || {};
  
  // 시퀀스 체크
  if (seq && seq <= lastSeq) return;
  if (seq) lastSeq = seq;
  
  // forestId 검증
  const eventForestId = payload.forestId ?? data.forestId;
  if (Number(eventForestId) !== Number(forestId.value)) return;
  
  console.log('숲 이름 변경 처리:', payload);
  
  // 데이터 새로고침
  await fetchForestData();
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
