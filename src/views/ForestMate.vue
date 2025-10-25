<template>
  <div class="forest-mate">
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
              :class="forestData && forestData.isPublic ? 'public' : 'private'">
              {{ forestData && forestData.isPublic ? '공개 중' : '비공개 중' }}
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

    <div ref="containerRef" class="placement-container">
      <div class="placement-inner-container">
        <img
          v-if="forestData"
          ref="bgRef"
          class="background"
          :src="forestData.backgroundImageUrl"
          alt="Green Background"
        />
        
        <img
          v-if="forestData"
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

    <div v-if="isLoading" class="loading">로딩 중...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    
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
import { useDiaryWriteStore } from "@/stores/diaryWrite";

import is_public_icon from "@/icons/is_public_icon.png"
import rearrange_icon from "@/icons/rearrange_icon.png"

import ItemControlPanel from "@/components/forest/common/placement/ItemControlPanel.vue";
import ItemEditPanel from "@/components/forest/common/placement/ItemEditPanel.vue";
import RearrangeCompletePanel from "@/components/forest/common/placement/RearrangeCompletePanel.vue";
import StoredItemControlPanel from "@/components/forest/common/placement/StoredItemControlPanel.vue";

const alert = useAlertStore();
const diaryWrite = useDiaryWriteStore();

const route = useRoute();
const router = useRouter();
const forestData = ref(null);
const isLoading = ref(true);
const error = ref(null);
const isEditNameModalOpen = ref(false);
const { proxy } = getCurrentInstance();
const containerRef = ref(null);
const bgRef = ref(null);

const auth = useAuthStore();
// 반응형으로 꺼내기
const { accessToken, user, isAuthenticated } = storeToRefs(auth); 

const Token = computed(() => accessToken.value ?? null);

const forestId = computed(() => {
  const routeId = route.params.id;
  
  return routeId;
});

// 아이템 배치 관련
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
const showRearrangeTooltip = ref(false);
const currentWeather = ref(null);
const forceUpdate = ref(0);
const showEditName = ref(false);

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

const togglePublic = async () => {
  if (!forestData.value) return;

  try {

    const res = await api.patch(`emotion-forest/public/${forestData.value.forestId}`, {});
    
    if (res.status >= 200 && res.status < 300) {
      // 성공 시 공개여부 토글
      forestData.value.isPublic = !forestData.value.isPublic;

      alert.show("공개여부가 변경되었습니다!")
    } else {
      throw new Error(`공개여부 변경 실패: ${res.status}`);
    }
  } catch (err) {

    alert.show("공개여부 변경에 실패했습니다.")
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

const exitRearrangeMode = async () => {
  await fetchForestData();
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
  
  // 변경 사항을 즉시 반영 (선택사항)
  if (selectedEditItem.value) {
    // forestData에서 해당 아이템의 위치 업데이트
    const itemIndex = forestData.value.placementList.findIndex(
      item => item.placementId === selectedEditItem.value.placementId
    );
    if (itemIndex !== -1) {
      forestData.value.placementList[itemIndex].placementPositionX = editDragPos.value.x
      forestData.value.placementList[itemIndex].placementPositionY = editDragPos.value.y
      forestData.value.placementList[itemIndex].placementWidth = editCalculatedWidth.value
      forestData.value.placementList[itemIndex].placementHeight = editCalculatedHeight.value
      forestData.value.placementList[itemIndex].placementZIndex = editItemZIndex.value
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
  const itemIndex = forestData.value.placementList.findIndex(
    item => item.placementId === selectedEditItem.value.placementId
  );
  if (itemIndex !== -1) {
    forestData.value.placementList[itemIndex] = updatedItem;
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
  forestData.value.placementList = forestData.value.placementList.filter(
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
      const itemIndex = forestData.value.placementList.findIndex(
        item => item.placementId === selectedEditItem.value.placementId
      );
      if (itemIndex !== -1) {
        forestData.value.placementList[itemIndex].placementPositionX = originalItem.placementPositionX;
        forestData.value.placementList[itemIndex].placementPositionY = originalItem.placementPositionY;
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
    
    if (allSuccess) {
      alert.show("재배치가 완료되었습니다!")
      await fetchForestData();
      exitRearrangeMode();
    } else {
      throw new Error('일부 요청이 실패했습니다.');
    }
    
  } catch (err) {
    alert.show("재배치에 실패했습니다.")
    console.error(err);
  }
};

const handleCancelRearrange = () => {
  // 원본 데이터로 복원
  fetchForestData();
  exitRearrangeMode();
};

// 기존 아이템 배치 관련 함수들
const handleCompletePlacement = async () => {

  if (!selectedPiece.value || !forestId) {
    alert.show("필수 정보가 없습니다.")
    return;
  }
  
  const body = {
    forestId: Number(forestId.value),
    itemPositionX: dragPos.value.x,
    itemPositionY: dragPos.value.y,
    itemId: selectedPiece.value.value,
    itemWidth: calculatedWidth.value,
    itemHeight: calculatedHeight.value,
    itemZIndex: itemZIndex.value,
    diaryId: diaryWrite.savedDiaryId
  };
  
  try {
    await api.post('emotion-forest/placement', body);
    
    alert.show("배치가 완료되었습니다!")
    await fetchForestData();
    resetControlPanel();
    forceUpdate.value++;
  } catch (err) {
    alert.show("배치에 실패했습니다.")
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

    const data = response.data;

    forestData.value = data;
  } catch (err) {
    console.error("Error:", err);
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
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

  // 아이템 배치 완료 이벤트 감지
  proxy.emitter.on('place-item', (piece) => {
    selectedPiece.value = piece;
    dragPos.value = { x: ITEM_CONSTANTS.DEFAULT_POSITION.x, y: ITEM_CONSTANTS.DEFAULT_POSITION.y };
    showControlPanel.value = true;
  });
  
  // 초대 수락 이벤트 감지
  proxy.emitter.on('invite-accepted', (data) => {
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

  // 보관함에서 재배치 이벤트 감지
  proxy.emitter.on('place-from-storage', (item) => {
    selectedStoredItem.value = item;
    storedItemPosition.value = { x: 10, y: 10 };
    storedItemScale.value = 1.0;
    storedItemZIndex.value = ITEM_CONSTANTS.DEFAULT_Z_INDEX;
    showStoredItemControlPanel.value = true;
  });

  // 재배치 이벤트 감지
  proxy.emitter.on('replacement', (item) => {

  })

  
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
  
  onUnmounted(() => {
    if (eventSource) {
      eventSource.close();
    }
  });
});

onUnmounted(() => {
  proxy.emitter.off('place-item');
  proxy.emitter.off('invite-accepted');
  proxy.emitter.off('user-withdrawn');
  proxy.emitter.off('forest-name-updated');
  proxy.emitter.off('replacement');
});

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
  if (userId !== auth.$state.user.userId) alert.show(`멤버가 우정의 숲을 떠났습니다.`)
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

const sortedPlacementList = computed(() => {
  if (!forestData.value) return [];
  return [...forestData.value.placementList].sort(
    (a, b) => a.placementPositionY - b.placementPositionY
  );
});

const goToHome = () => {
  
  if (user.value?.forestId) {
    // 개인 숲(감정의 숲)으로 이동
    router.push(`/forest-detail/${user.value.forestId}`);
  } else {
    // forestId가 없으면 기본 홈으로
    router.push('/');
  }
}

// 보관된 아이템 배치 관련
const completeStoredItemPlacement = async () => {
  if (!selectedStoredItem.value) return;
  
  try {

    
    const calculatedWidth = Math.round(ITEM_CONSTANTS.BASE_SIZE * storedItemScale.value);
    const calculatedHeight = Math.round(ITEM_CONSTANTS.BASE_SIZE * storedItemScale.value);
    
    const requestBody = {
      forestItemId: selectedStoredItem.value.id,
      itemPositionX: storedItemPosition.value.x,
      itemPositionY: storedItemPosition.value.y,
      itemWidth: calculatedWidth,
      itemHeight: calculatedHeight,
      itemZIndex: storedItemZIndex.value,
      forestId: forestId.value
    };
    
    const response = await api.post('emotion-forest/placements/from-storage', requestBody);

    if (response.status >= 200 && response.status < 300) {
      fetchForestData();
      alert.show("아이템이 성공적으로 배치되었습니다!")
      showStoredItemControlPanel.value = false;
    } else {
      throw new Error(`배치 실패: ${response.status}`);
    }
  } catch (error) {
    console.error('아이템 배치 실패:', error);
    alert.show("아이템 배치에 실패했습니다.")
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

<style scoped>
.forest-mate {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
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
  width: 120px;
  height: 100px;
}

.home-icon {
  width: 120px;
  height: 100px;
  cursor: pointer;
  object-fit: contain;
  transition: transform 0.2s ease;
  display: block;
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

.rearrange-container, 
.public-icon-container {
  position: relative;
  display: flex;
  align-items: center;
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
  box-shadow: 0 0 16px rgba(58, 90, 64, 0.5);
}

.item.draggable.stored-item:hover,
.item.draggable:hover {
  border-color: rgba(58, 90, 64, 0.6);
  box-shadow: 0 0 12px rgba(58, 90, 64, 0.3);
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
</style>
