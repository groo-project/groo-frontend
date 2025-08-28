<script setup>
import { ref, onMounted, onUnmounted, getCurrentInstance, computed } from "vue";
import edit_icon from "@/icons/edit_icon.png"
import is_public_icon from "@/icons/is_public_icon.png"
import rearrange_icon from "@/icons/rearrange_icon.png"
import GuestBookDetail from "@/components/forest/common/guestbook/GuestBookDetail.vue";
import { useRouter, useRoute } from 'vue-router';
import EditForestName from "@/components/forest/common/EditForestName.vue";
import ItemControlPanel from "@/components/forest/common/placement/ItemControlPanel.vue";
import ItemEditPanel from "@/components/forest/common/placement/ItemEditPanel.vue";
import RearrangeCompletePanel from "@/components/forest/common/placement/RearrangeCompletePanel.vue";
import api from "@/lib/api.js";
import { useAuthStore } from "@/stores/auth.js";
import { storeToRefs } from 'pinia';

// weather effects
import RainEffects from "@/components/weather/RainEffects.vue";
import FlowerRainEffect from "@/components/weather/FlowerRainEffect.vue";
import FogEffects from "@/components/weather/FogEffects.vue";
import YellowDustEffects from "@/components/weather/YellowDustEffects.vue";
import SnowEffects from "@/components/weather/SnowEffects.vue";
import ThunderEffects from "@/components/weather/ThunderEffects.vue";
import CloudyEffects from "@/components/weather/CloudyEffects.vue";
import StoredItemControlPanel from "@/components/forest/common/placement/StoredItemControlPanel.vue";



const auth = useAuthStore();
// 반응형으로 꺼내기
const { accessToken, user, isAuthenticated } = storeToRefs(auth); 
const Token = computed(() => accessToken.value ?? null);

// ===== 상수 정의 =====
const ITEM_CONSTANTS = {
  BASE_SIZE: 60,
  DEFAULT_Z_INDEX: 50,
  MIN_SCALE: 0.3,
  MAX_SCALE: 3.0,
  SCALE_STEP: 0.1,
  MIN_Z_INDEX: 0,
  MAX_Z_INDEX: 999,
  Z_INDEX_STEP: 10,
  DEFAULT_POSITION: { x: 10, y: 10 },
  YELLOW_DUST_OPACITY: 0.7
};

const UI_CONSTANTS = {
  TOOLTIP_DELAY: 0,
  CONTROL_PANEL_WIDTH: 260,
  CONTROL_PANEL_HEIGHT: 500,
  CONTAINER_WIDTH: 800,
  HOME_ICON_SIZE: { width: 120, height: 100 },
  BTN_ICON_SIZE: 32
};

const router = useRouter();
const route = useRoute();

const forestId = computed(() => route.params.forestId);

const showGuestBook = ref(false);
const showGuestBookDetail = ref(false);
const selectedGuestBookId = ref(null);
const bgRef = ref(null);
const containerRef = ref(null);
const emit = defineEmits(["showAlert"]);

// 기존 아이템 배치 관련
const baseSize = ITEM_CONSTANTS.BASE_SIZE;
const itemScale = ref(1.0);
const itemZIndex = ref(ITEM_CONSTANTS.DEFAULT_Z_INDEX);
const selectedPiece = ref(null)
const dragPos = ref({ x: 50, y: 50 })
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const showControlPanel = ref(false);

// 재배치 모드 관련
const isRearrangeMode = ref(false);
const selectedEditItem = ref(null);
const editItemScale = ref(1.0);
const editItemZIndex = ref(50);
const editDragPos = ref({ x: 0, y: 0 });
const isEditDragging = ref(false);
const editDragOffset = ref({ x: 0, y: 0 });
const showEditPanel = ref(false);
const showCompletePanel = ref(false);

// 보관된 아이템 배치 관련
const selectedStoredItem = ref(null);
const showStoredItemControlPanel = ref(false);
const storedItemPosition = ref({ x: 10, y: 10 });
const storedItemScale = ref(1.0);
const storedItemZIndex = ref(ITEM_CONSTANTS.DEFAULT_Z_INDEX);
const isStoredItemDragging = ref(false);
const storedItemDragOffset = ref({ x: 0, y: 0 });

// 변경 사항 추적
const originalItems = ref(new Map());
const changedItems = ref(new Map());
const removedItems = ref(new Set());

// 기타
const showTooltip = ref(false);
const showEditNameTooltip = ref(false);
const showRearrangeTooltip = ref(false);
const forestData = ref(null);
const currentWeather = ref(null);
const forceUpdate = ref(0);
const showEditName = ref(false);
const { proxy } = getCurrentInstance();

// 계산된 크기 값들
const calculatedWidth = computed(() => Math.round(baseSize * itemScale.value));
const calculatedHeight = computed(() => Math.round(baseSize * itemScale.value));
const editCalculatedWidth = computed(() => Math.round(baseSize * editItemScale.value));
const editCalculatedHeight = computed(() => Math.round(baseSize * editItemScale.value));

// 변경 사항 요약
const changedItemsCount = computed(() => changedItems.value.size);
const removedItemsCount = computed(() => removedItems.value.size);

// 날씨 관련 computed들
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

// 배경 이미지 영역 계산 함수
const getBackgroundBounds = () => {
  if (!bgRef.value) return null;
  
  const bgRect = bgRef.value.getBoundingClientRect();
  return {
    left: bgRect.left,
    top: bgRect.top,
    right: bgRect.right,
    bottom: bgRect.bottom,
    width: bgRect.width,
    height: bgRect.height
  };
};

// 좌표가 배경 영역 내에 있는지 확인 (드래그 시작 시에만 사용)
const isWithinBackground = (clientX, clientY) => {
  const bounds = getBackgroundBounds();
  if (!bounds) return false;
  
  return clientX >= bounds.left &&
         clientX <= bounds.right &&
         clientY >= bounds.top &&
         clientY <= bounds.bottom;
};

// 퍼센트 좌표를 배경 영역 기준으로 계산 (경계 제한 포함)
const calculatePercentagePosition = (clientX, clientY) => {
  const bounds = getBackgroundBounds();
  if (!bounds) return { x: 50, y: 50 };
  
  // 마우스 위치를 배경 영역 기준으로 변환
  let x = ((clientX - bounds.left) / bounds.width) * 100;
  let y = ((clientY - bounds.top) / bounds.height) * 100;
  
  // 경계 제한 (0-100% 범위 내로)
  x = Math.max(0, Math.min(100, x));
  y = Math.max(0, Math.min(100, y));
  
  return { x, y };
};


const refreshForestData = async () => {
  if (!forestId.value) return;
  
  try {

    const response = await api.get(`detail/${forestId.value}`);

    const data = response.data;
    forestData.value = data;
    
    // 원본 아이템 데이터 저장 (재배치 모드용)
    if (data && data.length && data[0].placementList) {
      originalItems.value.clear();
      data[0].placementList.forEach(item => {
        originalItems.value.set(item.placementId, { ...item });
      });
    }
    
  } catch (error) {
    console.error('숲 정보 불러오기 실패:', error);
    console.log('Error details:', error.response?.data);
  }
};

onMounted(async () => {
  await refreshForestData();
  
  proxy.emitter.on('place-item', (piece) => {
    selectedPiece.value = piece;
    dragPos.value = { x: ITEM_CONSTANTS.DEFAULT_POSITION.x, y: ITEM_CONSTANTS.DEFAULT_POSITION.y };
    showControlPanel.value = true;
    console.log('Received piece in ForestDetail:', selectedPiece.value);
  });
  
  proxy.emitter.on('diary-saved', (response) => {
    console.log('Received diary save response:', response);
    if (response.weather) {
      currentWeather.value = response.weather;
      console.log('Updated weather:', currentWeather.value);
    }
  });

  proxy.emitter.on('place-from-storage', (item) => {
    selectedStoredItem.value = item;
    storedItemPosition.value = { x: 10, y: 10 };
    storedItemScale.value = 1.0;
    storedItemZIndex.value = ITEM_CONSTANTS.DEFAULT_Z_INDEX;
    showStoredItemControlPanel.value = true;
    console.log('Received stored item for placement:', item);
  });
});

onUnmounted(() => {
  proxy.emitter.off('place-item');
  proxy.emitter.off('diary-saved');
  proxy.emitter.off('place-from-storage');
});

const togglePublic = async () => {
  if (!forestData.value) return;

  try {
    console.log('=== 공개여부 변경 시작 ===');
    console.log('Forest ID:', forestData.value[0].forestId);
    console.log('현재 공개여부:', forestData.value[0].isPublic);
    
    const res = await api.patch(`emotion-forest/public/${forestData.value[0].forestId}`, {});
    
    console.log('=== 공개여부 변경 API 응답 ===');
    console.log('Response status:', res.status);
    console.log('Response data:', res.data);
    console.log('========================');
    
    if (res.status >= 200 && res.status < 300) {
      // 성공 시 공개여부 토글
      forestData.value[0].isPublic = !forestData.value[0].isPublic;
      console.log('공개여부 변경 성공:', forestData.value[0].isPublic);
      
      alertMessage.value = '공개여부가 변경되었습니다!';
      showAlertModal.value = true;
    } else {
      throw new Error(`공개여부 변경 실패: ${res.status}`);
    }
  } catch (err) {
    console.error('=== 공개여부 변경 실패 ===');
    console.error('Error:', err);
    console.error('Error message:', err.message);
    console.error('Error response:', err.response?.data);
    console.error('========================');
    
    alertMessage.value = '공개여부 변경에 실패했습니다.';
    showAlertModal.value = true;
  }
};

// 기존 아이템 배치 관련 함수들 (수정됨)
const onMouseDown = (event) => {
  event.preventDefault();
  
  // 드래그 시작 시에만 배경 영역 체크
  if (!isWithinBackground(event.clientX, event.clientY)) {
    return;
  }
  
  isDragging.value = true;
  
  const bounds = getBackgroundBounds();
  if (!bounds) return;
  
  // 현재 아이템의 중심점 계산
  const itemCenterX = bounds.left + (bounds.width * dragPos.value.x / 100);
  const itemCenterY = bounds.top + (bounds.height * dragPos.value.y / 100);
  
  // 마우스와 아이템 중심점 간의 오프셋 저장
  dragOffset.value = {
    x: event.clientX - itemCenterX,
    y: event.clientY - itemCenterY
  };
  
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
};

const onMouseMove = (event) => {
  if (!isDragging.value) return;
  
  // 드래그 중에는 영역 체크 없이 부드럽게 이동
  // 대신 calculatePercentagePosition에서 경계 제한
  const newPos = calculatePercentagePosition(
    event.clientX - dragOffset.value.x,
    event.clientY - dragOffset.value.y
  );
  
  dragPos.value = newPos;
};

const onMouseUp = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
  
  // 드랍 완료 후 위치 유지 - 추가 처리 없음
  console.log('드랍 완료, 최종 위치:', dragPos.value);
};

// 재배치 모드 관련 함수들
const toggleRearrangeMode = () => {
  if (isRearrangeMode.value) {
    exitRearrangeMode();
  } else {
    enterRearrangeMode();
  }
};

const enterRearrangeMode = () => {
  isRearrangeMode.value = true;
  showCompletePanel.value = true;
  changedItems.value.clear();
  removedItems.value.clear();
};

const exitRearrangeMode = () => {
  isRearrangeMode.value = false;
  showCompletePanel.value = false;
  showEditPanel.value = false;
  selectedEditItem.value = null;
  changedItems.value.clear();
  removedItems.value.clear();
};

const selectItemForEdit = (item) => {
  if (!isRearrangeMode.value) return;
  
  selectedEditItem.value = item;
  editItemScale.value = (item.placementWidth || ITEM_CONSTANTS.BASE_SIZE) / ITEM_CONSTANTS.BASE_SIZE;
  editItemZIndex.value = item.placementZIndex || ITEM_CONSTANTS.DEFAULT_Z_INDEX;
  
  // 현재 아이템의 위치를 editDragPos에 설정 (원본 위치 유지)
  editDragPos.value = {
    x: item.placementPositionX,
    y: item.placementPositionY
  };
  
  showEditPanel.value = true;
  showCompletePanel.value = false;
};

// 편집 아이템 드래그 관련 (수정됨)
const onEditMouseDown = (event) => {
  if (!selectedEditItem.value) return;
  
  event.preventDefault();
  
  // 드래그 시작 시에만 배경 영역 체크
  if (!isWithinBackground(event.clientX, event.clientY)) {
    return;
  }
  
  isEditDragging.value = true;
  
  const bounds = getBackgroundBounds();
  if (!bounds) return;
  
  // 현재 아이템의 중심점 계산
  const itemCenterX = bounds.left + (bounds.width * editDragPos.value.x / 100);
  const itemCenterY = bounds.top + (bounds.height * editDragPos.value.y / 100);
  
  // 마우스와 아이템 중심점 간의 오프셋 저장
  editDragOffset.value = {
    x: event.clientX - itemCenterX,
    y: event.clientY - itemCenterY
  };
  
  document.addEventListener('mousemove', onEditMouseMove);
  document.addEventListener('mouseup', onEditMouseUp);
};

const onEditMouseMove = (event) => {
  if (!isEditDragging.value) return;
  
  // 드래그 중에는 영역 체크 없이 부드럽게 이동
  const newPos = calculatePercentagePosition(
    event.clientX - editDragOffset.value.x,
    event.clientY - editDragOffset.value.y
  );
  
  editDragPos.value = newPos;
};

const onEditMouseUp = () => {
  isEditDragging.value = false;
  document.removeEventListener('mousemove', onEditMouseMove);
  document.removeEventListener('mouseup', onEditMouseUp);
  
  // 드랍 완료 후 위치 유지 - 추가 처리 없음
  console.log('편집 아이템 드랍 완료, 최종 위치:', editDragPos.value);
  
  // 변경 사항을 즉시 반영 (선택사항)
  if (selectedEditItem.value) {
    // forestData에서 해당 아이템의 위치 업데이트
    const itemIndex = forestData.value[0].placementList.findIndex(
      item => item.placementId === selectedEditItem.value.placementId
    );
    if (itemIndex !== -1) {
      forestData.value[0].placementList[itemIndex].placementPositionX = editDragPos.value.x;
      forestData.value[0].placementList[itemIndex].placementPositionY = editDragPos.value.y;
    }
    
    // 변경 사항 추적에 추가
    changedItems.value.set(selectedEditItem.value.placementId, {
      itemPositionX: editDragPos.value.x,
      itemPositionY: editDragPos.value.y,
      itemWidth: editCalculatedWidth.value,
      itemHeight: editCalculatedHeight.value,
      itemZIndex: editItemZIndex.value,
      placementId: selectedEditItem.value.placementId
    });
  }
};

// 편집 패널 이벤트 핸들러들
const handleUpdatePlacement = () => {
  if (!selectedEditItem.value) return;
  
  const updatedItem = {
    ...selectedEditItem.value,
    placementPositionX: editDragPos.value.x,
    placementPositionY: editDragPos.value.y,
    placementWidth: editCalculatedWidth.value,
    placementHeight: editCalculatedHeight.value,
    placementZIndex: editItemZIndex.value
  };
  
  // 변경 사항 추적
  changedItems.value.set(selectedEditItem.value.placementId, {
    itemPositionX: editDragPos.value.x,
    itemPositionY: editDragPos.value.y,
    itemWidth: editCalculatedWidth.value,
    itemHeight: editCalculatedHeight.value,
    itemZIndex: editItemZIndex.value,
    placementId: selectedEditItem.value.placementId
  });
  
  // forestData 업데이트
  const itemIndex = forestData.value[0].placementList.findIndex(
    item => item.placementId === selectedEditItem.value.placementId
  );
  if (itemIndex !== -1) {
    forestData.value[0].placementList[itemIndex] = updatedItem;
  }
  
  showEditPanel.value = false;
  showCompletePanel.value = true;
  selectedEditItem.value = null;
};

const handleRemoveItem = () => {
  if (!selectedEditItem.value) return;
  
  // 회수 목록에 추가
  removedItems.value.add(selectedEditItem.value.placementId);
  
  // 변경 목록에서 제거 (회수되는 아이템이므로)
  changedItems.value.delete(selectedEditItem.value.placementId);
  
  // forestData에서 제거
  forestData.value[0].placementList = forestData.value[0].placementList.filter(
    item => item.placementId !== selectedEditItem.value.placementId
  );
  
  showEditPanel.value = false;
  showCompletePanel.value = true;
  selectedEditItem.value = null;
};

const handleCancelSelection = () => {
  // 선택 취소 시 원래 위치로 복원
  if (selectedEditItem.value) {
    const originalItem = originalItems.value.get(selectedEditItem.value.placementId);
    if (originalItem) {
      editDragPos.value = {
        x: originalItem.placementPositionX,
        y: originalItem.placementPositionY
      };
      
      // forestData도 원래 위치로 복원
      const itemIndex = forestData.value[0].placementList.findIndex(
        item => item.placementId === selectedEditItem.value.placementId
      );
      if (itemIndex !== -1) {
        forestData.value[0].placementList[itemIndex].placementPositionX = originalItem.placementPositionX;
        forestData.value[0].placementList[itemIndex].placementPositionY = originalItem.placementPositionY;
      }
    }
    
    // 변경 사항에서 제거
    changedItems.value.delete(selectedEditItem.value.placementId);
  }
  
  showEditPanel.value = false;
  showCompletePanel.value = true;
  selectedEditItem.value = null;
};

// 재배치 완료 관련
const handleCompleteRearrange = async () => {

  
  try {
    const promises = [];
    
    // 변경된 아이템들 업데이트
    if (changedItems.value.size > 0) {
      const updateData = Array.from(changedItems.value.values());
              promises.push(
          api.patch('emotion-forest/placement', updateData)
        );
    }
    
    // 회수된 아이템들 삭제
    if (removedItems.value.size > 0) {
      const placementIds = Array.from(removedItems.value);
      const queryParams = placementIds.map(id => `placementIds=${id}`).join('&');
      promises.push(
        api.delete(`emotion-forest/placement?${queryParams}`)
      );
    }
    
    // 모든 요청 병렬 실행
    const results = await Promise.all(promises);
    
    // 모든 요청이 성공했는지 확인 (Axios 방식)
    const allSuccess = results.every(response => response.status >= 200 && response.status < 300);
    
    console.log('=== 재배치 결과 확인 ===');
    results.forEach((response, index) => {
      console.log(`요청 ${index + 1}:`, response.status, response.data);
    });
    console.log('모든 요청 성공:', allSuccess);
    console.log('========================');
    
    if (allSuccess) {
      emit('showAlert', "재배치가 완료되었습니다!")
      await refreshForestData();
      exitRearrangeMode();
    } else {
      throw new Error('일부 요청이 실패했습니다.');
    }
    
  } catch (err) {
    emit('showAlert', "재배치에 실패했습니다.");
    console.error(err);
  }
};

const handleCancelRearrange = () => {
  // 원본 데이터로 복원
  refreshForestData();
  exitRearrangeMode();
};

// 기존 아이템 배치 관련 함수들
const handleCompletePlacement = async () => {

  if (!selectedPiece.value || !forestId) {
    emit('showAlert', "필수 정보가 없습니다.")
    return;
  }
  
  const body = {
          forestId: Number(forestId.value),
    itemPositionX: dragPos.value.x,
    itemPositionY: dragPos.value.y,
    itemId: selectedPiece.value.value,
    itemWidth: calculatedWidth.value,
    itemHeight: calculatedHeight.value,
    itemZIndex: itemZIndex.value
  };
  
  try {
    console.log('=== 아이템 배치 시작 ===');
    console.log('Request body:', body);
    
    const res = await api.post('emotion-forest/placement', body);
    
    emit('showAlert', "배치가 완료되었습니다!")
    await refreshForestData();
    resetControlPanel();
    forceUpdate.value++;
  } catch (err) {
    emit('showAlert', "배치에 실패했습니다.");
    console.error(err);
  }
};

const resetControlPanel = () => {
  selectedPiece.value = null;
  showControlPanel.value = false;
  itemScale.value = 1.0;
  itemZIndex.value = ITEM_CONSTANTS.DEFAULT_Z_INDEX;
  // dragPos는 리셋하지 않음 - 위치 유지
};

// 크기 및 zIndex 조절 함수들 (기존 배치용)
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

// 편집용 크기 및 zIndex 조절 함수들
const increaseEditScale = () => {
  if (editItemScale.value < ITEM_CONSTANTS.MAX_SCALE) {
    editItemScale.value += ITEM_CONSTANTS.SCALE_STEP;
  }
};

const decreaseEditScale = () => {
  if (editItemScale.value > ITEM_CONSTANTS.MIN_SCALE) {
    editItemScale.value -= ITEM_CONSTANTS.SCALE_STEP;
  }
};

const increaseEditZIndex = () => {
  if (editItemZIndex.value < ITEM_CONSTANTS.MAX_Z_INDEX) {
    editItemZIndex.value += ITEM_CONSTANTS.Z_INDEX_STEP;
  }
};

const decreaseEditZIndex = () => {
  if (editItemZIndex.value > ITEM_CONSTANTS.MIN_Z_INDEX) {
    editItemZIndex.value -= ITEM_CONSTANTS.Z_INDEX_STEP;
  }
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
  console.log('=== Go To Home ===');
  console.log('User:', user.value);
  console.log('Current Forest ID:', forestId.value);
  console.log('========================');
  
  if (user.value?.forestId) {
    // 회원의 forestId로 이동
    router.push(`/forest-detail/${user.value.forestId}`);
  } else {
    // forestId가 없으면 기본 홈으로
    router.push('/');
  }
};


// 보관된 아이템 배치 관련
const completeStoredItemPlacement = async () => {
  if (!selectedStoredItem.value) return;
  
  try {

    
    const calculatedWidth = Math.round(ITEM_CONSTANTS.BASE_SIZE * storedItemScale.value);
    const calculatedHeight = Math.round(ITEM_CONSTANTS.BASE_SIZE * storedItemScale.value);
    
    const requestBody = {
      userItemId: selectedStoredItem.value.id,
      itemPositionX: storedItemPosition.value.x,
      itemPositionY: storedItemPosition.value.y,
      itemWidth: calculatedWidth,
      itemHeight: calculatedHeight,
      itemZIndex: storedItemZIndex.value
    };
    
    console.log('=== Stored Item Placement Request ===');
    console.log('Request body:', requestBody);
    console.log('Token:', Token.value);
    console.log('========================');
    
    const response = await api.post('emotion-forest/placements/from-storage', requestBody);

    console.log('=== Stored Item Placement Response ===');
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    console.log('========================');

    if (response.status >= 200 && response.status < 300) {
      refreshForestData();
      emit('showAlert', "아이템이 성공적으로 배치되었습니다!")
      showStoredItemControlPanel.value = false;
    } else {
      throw new Error(`배치 실패: ${response.status}`);
    }
  } catch (error) {
    console.error('아이템 배치 실패:', error);
    emit('showAlert', "아이템 배치에 실패했습니다.")
  }
};

const cancelStoredItemPlacement = () => {
  resetStoredItemPlacement();
};

const onStoredItemMouseDown = (event) => {
  event.preventDefault();
  
  if (!isWithinBackground(event.clientX, event.clientY)) {
    return;
  }
  
  isStoredItemDragging.value = true;
  
  const bounds = getBackgroundBounds();
  if (!bounds) return;
  
  const itemCenterX = bounds.left + (bounds.width * storedItemPosition.value.x / 100);
  const itemCenterY = bounds.top + (bounds.height * storedItemPosition.value.y / 100);
  
  storedItemDragOffset.value = {
    x: event.clientX - itemCenterX,
    y: event.clientY - itemCenterY
  };
  
  document.addEventListener('mousemove', onStoredItemMouseMove);
  document.addEventListener('mouseup', onStoredItemMouseUp);
};

const onStoredItemMouseMove = (event) => {
  if (!isStoredItemDragging.value) return;
  
  const newPos = calculatePercentagePosition(
    event.clientX - storedItemDragOffset.value.x,
    event.clientY - storedItemDragOffset.value.y
  );
  
  storedItemPosition.value = newPos;
};

const onStoredItemMouseUp = () => {
  isStoredItemDragging.value = false;
  document.removeEventListener('mousemove', onStoredItemMouseMove);
  document.removeEventListener('mouseup', onStoredItemMouseUp);
  
  console.log('Stored item drop completed, final position:', storedItemPosition.value);
};

const increaseStoredItemScale = () => {
  if (storedItemScale.value < ITEM_CONSTANTS.MAX_SCALE) {
    storedItemScale.value += ITEM_CONSTANTS.SCALE_STEP;
  }
};

const decreaseStoredItemScale = () => {
  if (storedItemScale.value > ITEM_CONSTANTS.MIN_SCALE) {
    storedItemScale.value -= ITEM_CONSTANTS.SCALE_STEP;
  }
};

const increaseStoredItemZIndex = () => {
  if (storedItemZIndex.value < ITEM_CONSTANTS.MAX_Z_INDEX) {
    storedItemZIndex.value += ITEM_CONSTANTS.Z_INDEX_STEP;
  }
};

const decreaseStoredItemZIndex = () => {
  if (storedItemZIndex.value > ITEM_CONSTANTS.MIN_Z_INDEX) {
    storedItemZIndex.value -= ITEM_CONSTANTS.Z_INDEX_STEP;
  }
};

const resetStoredItemPlacement = () => {
  selectedStoredItem.value = null;
  showStoredItemControlPanel.value = false;
  storedItemScale.value = 1.0;
  storedItemZIndex.value = ITEM_CONSTANTS.DEFAULT_Z_INDEX;
  storedItemPosition.value = { x: 10, y: 10 };
};

// Computed values for stored item
const storedItemCalculatedWidth = computed(() => Math.round(ITEM_CONSTANTS.BASE_SIZE * storedItemScale.value));
const storedItemCalculatedHeight = computed(() => Math.round(ITEM_CONSTANTS.BASE_SIZE * storedItemScale.value));
</script>

<template>
  <div class="forest-detail">
    <div class="header-icons">
      <div class="home-icon-container">
        <img 
          src="/icon.png"
          alt="Home"
          class="home-icon"
          @click="goToHome"
        />
      </div>
      <div class="control-icons">
        <div class="edit-name-container">
          <img 
            :src="edit_icon"
            class="btn-img"
            @click="handleEditNameClick"
            @mouseenter="showEditNameTooltip = true"
            @mouseleave="showEditNameTooltip = false"
          />
          <div v-if="showEditNameTooltip" class="name-tooltip">
            숲 이름 변경하기
          </div>
          <EditForestName
            v-if="showEditName"
            :current-name="forestData?.[0]?.name || ''"
            @update="handleNameUpdate"
          />
        </div>
        
        <div class="rearrange-container">
          <img 
            :src="rearrange_icon"
            class="btn-img rearrange-btn"
            @click="toggleRearrangeMode"
            @mouseenter="showRearrangeTooltip = true"
            @mouseleave="showRearrangeTooltip = false"
            :class="{ active: isRearrangeMode }"
          />
          <div v-if="showRearrangeTooltip" class="rearrange-tooltip">
            아이템 재배치하기
          </div>
        </div>
        
        <div class="public-icon-container">
          <img
            :src="is_public_icon"
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
      </div>
    </div>

    <ItemControlPanel
      v-if="showControlPanel && selectedPiece && !isRearrangeMode"
      :selected-piece="selectedPiece"
      :item-scale="itemScale"
      :item-z-index="itemZIndex"
      :base-size="baseSize"
      @complete-placement="handleCompletePlacement"
      @increase-scale="increaseScale"
      @decrease-scale="decreaseScale"
      @increase-z-index="increaseZIndex"
      @decrease-z-index="decreaseZIndex"
    />

    <ItemEditPanel
      v-if="showEditPanel && selectedEditItem"
      :selected-item="selectedEditItem"
      :item-scale="editItemScale"
      :item-z-index="editItemZIndex"
      :base-size="baseSize"
      @update-placement="handleUpdatePlacement"
      @remove-item="handleRemoveItem"
      @cancel-selection="handleCancelSelection"
      @increase-scale="increaseEditScale"
      @decrease-scale="decreaseEditScale"
      @increase-z-index="increaseEditZIndex"
      @decrease-z-index="decreaseEditZIndex"
    />

    <RearrangeCompletePanel
      v-if="showCompletePanel && isRearrangeMode"
      :changed-items-count="changedItemsCount"
      :removed-items-count="removedItemsCount"
      @complete-rearrange="handleCompleteRearrange"
      @cancel-rearrange="handleCancelRearrange"
    />

    <StoredItemControlPanel
      v-if="showStoredItemControlPanel && selectedStoredItem"
      :selectedItem="selectedStoredItem"
      :itemScale="storedItemScale"
      :itemZIndex="storedItemZIndex"
      :baseSize="ITEM_CONSTANTS.BASE_SIZE"
      @confirm-placement="completeStoredItemPlacement"
      @cancel-placement="cancelStoredItemPlacement"
      @increase-scale="increaseStoredItemScale"
      @decrease-scale="decreaseStoredItemScale"
      @increase-z-index="increaseStoredItemZIndex"
      @decrease-z-index="decreaseStoredItemZIndex"
    />

    <template v-if="showGuestBook">
      <template v-if="showGuestBookDetail">
        <GuestBookDetail 
          :id="selectedGuestBookId"
          @back="handleDetailBack"
        />
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
        
        <img
          v-if="forestData && forestData.length"
          v-for="item in sortedPlacementList"
          :key="item.placementId"
          class="item"
          :class="{ 
            'selectable': isRearrangeMode,
            'selected': selectedEditItem?.placementId === item.placementId,
            'dragging': isEditDragging && selectedEditItem?.placementId === item.placementId
          }"
          :src="item.itemImageUrl" 
          :alt="item.itemName"
          :style="{
            left: selectedEditItem?.placementId === item.placementId ? `${editDragPos.x}%` : `${item.placementPositionX}%`,
            top: selectedEditItem?.placementId === item.placementId ? `${editDragPos.y}%` : `${item.placementPositionY}%`,
            width: selectedEditItem?.placementId === item.placementId ? `${editCalculatedWidth}px` : (item.placementWidth ? `${item.placementWidth}px` : `${ITEM_CONSTANTS.BASE_SIZE}px`),
            height: selectedEditItem?.placementId === item.placementId ? `${editCalculatedHeight}px` : (item.placementHeight ? `${item.placementHeight}px` : `${ITEM_CONSTANTS.BASE_SIZE}px`),
            zIndex: selectedEditItem?.placementId === item.placementId ? editItemZIndex : item.placementZIndex,
            opacity: showYellowDust ? ITEM_CONSTANTS.YELLOW_DUST_OPACITY : 1,
            cursor: isRearrangeMode ? 'pointer' : 'default'
          }"
          @click="selectItemForEdit(item)"
          @mousedown="selectedEditItem?.placementId === item.placementId ? onEditMouseDown($event) : null"
          @dragstart.prevent
          draggable="false"
        />
        
        <img
          v-if="selectedPiece && !isRearrangeMode"
          class="item draggable"
          :class="{ 'dragging': isDragging }"
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

        <!-- 배치 중인 아이템 (보관소에서) -->
        <img
          v-if="selectedStoredItem && showStoredItemControlPanel"
          class="item draggable stored-item"
          :class="{ 'dragging': isStoredItemDragging }"
          :src="selectedStoredItem.imageUrl"
          :alt="selectedStoredItem.itemName"
          :style="{
            left: `${storedItemPosition.x}%`,
            top: `${storedItemPosition.y}%`,
            width: `${storedItemCalculatedWidth}px`,
            height: `${storedItemCalculatedHeight}px`,
            cursor: isStoredItemDragging ? 'grabbing' : 'grab',
            zIndex: storedItemZIndex,
            opacity: showYellowDust ? ITEM_CONSTANTS.YELLOW_DUST_OPACITY : 1
          }"
          @mousedown="onStoredItemMouseDown"
          @dragstart.prevent
          draggable="false"
        />
      </div>
    </div>

     날씨 효과들 
    <RainEffects v-if="showRain" />
    <FlowerRainEffect v-if="showFlowerRain" />
    <FogEffects v-if="showFog" />
    <YellowDustEffects v-if="showYellowDust" />
    <SnowEffects v-if="showSnow" />
    <ThunderEffects v-if="showThunder" />
    <CloudyEffects v-if="showCloudy" />
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
  overflow: hidden;
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
  user-select: none;
  pointer-events: none;
}

.item {
  position: absolute;
  user-select: none;
  transform: translate(-50%, -50%);
  object-fit: contain;
  transition: all 0.2s ease;
}

/* 드래그 중일 때는 transition 제거하여 부드러운 움직임 */
.item.dragging {
  transition: none;
}

.item.selectable {
  border: 2px solid transparent;
  border-radius: 8px;
}

.item.selectable:hover {
  border-color: rgba(58, 90, 64, 0.6);
  box-shadow: 0 0 12px rgba(58, 90, 64, 0.3);
}

.item.selected {
  border-color: rgba(58, 90, 64, 1);
  box-shadow: 0 0 16px rgba(58, 90, 64, 0.5);
}

.item.draggable {
  user-select: none;
  touch-action: none;
  position: absolute;
}

/* 수직으로 배치된 헤더 아이콘 스타일 */
.header-icons {
  position: absolute;
  top: 15px;
  left: 40px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  z-index: 10;
}

.home-icon-container {
  display: flex;
  align-items: center;
}

.home-icon {
  width: 120px;
  height: 100px;
  cursor: pointer;
  object-fit: contain;
  transition: transform 0.2s ease;
}

.home-icon:hover {
  transform: scale(1.1);
}

.control-icons {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: 8px; /* 홈 아이콘과 약간의 들여쓰기 */
}

.edit-name-container, 
.rearrange-container, 
.public-icon-container {
  position: relative;
  display: flex;
  align-items: center;
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
  transition: all 0.2s ease;
}

.rearrange-btn.active {
  background-color: rgba(58, 90, 64, 0.3);
  border-radius: 6px;
  transform: scale(1.1);
}

.name-tooltip, .rearrange-tooltip {
  position: absolute;
  bottom: 45px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(240, 248, 240, 0.95);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  padding: 8px 12px;
  font-size: 14px;
  color: #333;
  white-space: nowrap;
  z-index: 100;
  pointer-events: none;
}

.name-tooltip::after, .rearrange-tooltip::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -8px;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid rgba(240, 248, 240, 0.95);
}

.tooltip {
  position: absolute;
  bottom: 45px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(240, 248, 240, 0.95);
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
  left: 50%;
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

.forest-detail {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
</style>