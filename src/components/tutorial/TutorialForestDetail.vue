<script setup>
import { ref, onMounted, onUnmounted, getCurrentInstance, computed, watch } from "vue";
import edit_icon from "@/icons/edit_icon.png"
import is_public_icon from "@/icons/is_public_icon.png"
import rearrange_icon from "@/icons/rearrange_icon.png"
import { useRouter, useRoute } from 'vue-router';
import EditForestName from "@/components/forest/common/EidtNickname.vue";
import ItemControlPanel from "@/components/forest/common/placement/ItemControlPanel.vue";
import { useAuthStore } from "@/stores/auth.js";
import { storeToRefs } from 'pinia';
import { useAlertStore } from '@/stores/alert'

const alert = useAlertStore()

const auth = useAuthStore();
// 반응형으로 꺼내기
const { user } = storeToRefs(auth); 

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

const router = useRouter();
const route = useRoute();

const forestId = computed(() => route.params.forestId);
const bgRef = ref(null);
const containerRef = ref(null);

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

// 보관된 아이템 배치 관련
const selectedStoredItem = ref(null);
const showStoredItemControlPanel = ref(false);
const storedItemPosition = ref({ x: 10, y: 10 });
const storedItemScale = ref(1.0);
const storedItemZIndex = ref(ITEM_CONSTANTS.DEFAULT_Z_INDEX);

// 변경 사항 추적
const changedItems = ref(new Map());

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

const placedItems = ref([]);

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

onMounted(async () => {
  proxy.emitter.on('place-item', (piece) => {
    selectedPiece.value = piece;
    dragPos.value = { x: ITEM_CONSTANTS.DEFAULT_POSITION.x, y: ITEM_CONSTANTS.DEFAULT_POSITION.y };
    showControlPanel.value = true;
  });
  
  proxy.emitter.on('diary-saved', (response) => {
    if (response.weather) {
      currentWeather.value = response.weather;
    }
  });

  proxy.emitter.on('place-from-storage', (item) => {
    selectedStoredItem.value = item;
    storedItemPosition.value = { x: 10, y: 10 };
    storedItemScale.value = 1.0;
    storedItemZIndex.value = ITEM_CONSTANTS.DEFAULT_Z_INDEX;
    showStoredItemControlPanel.value = true;
  });
});

onUnmounted(() => {
  proxy.emitter.off('place-item');
  proxy.emitter.off('diary-saved');
  proxy.emitter.off('place-from-storage');
});

const togglePublic = async () => {
  alert.show("회원가입 후 만나요.")
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
  alert.show("회원가입 후 만나요.")
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

// 기존 아이템 배치 관련 함수들
const handleCompletePlacement = async () => {

  if (!selectedPiece.value || !forestId) {
    alert.show("필수 정보가 없습니다.")
    return;
  }
  
  try {
    alert.show("배치가 완료되었습니다!")
    // 여기에 값 추가
    placedItems.value.push({
        id: new Date(),
        itemImageUrl: selectedPiece.value.icon,
        itemName: selectedPiece.value.label,
        placementPositionX: dragPos.value.x,
        placementPositionY: dragPos.value.y,
        placementWidth: calculatedWidth.value,
        placementHeight: calculatedHeight.value,
        placementZIndex: itemZIndex.value
    })
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

const handleEditNameClick = () => {
  alert.show("회원가입 후 만나요.")
};

const handleNameUpdate = (newName) => {
  if (forestData.value && forestData.value.length) {
    forestData.value[0].name = newName;
  }
};

const goToHome = () => {
  if (user.value?.forestId) {
    // 회원의 forestId로 이동
    router.push(`/forest-detail/${user.value.forestId}`);
  } else {
    // forestId가 없으면 랜딩 페이지로
    router.push('/landing');
  }
};
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

    <div ref="containerRef" class="placement-container">
      <div class="placement-inner-container">
        <img
          ref="bgRef"
          class="background"
          src="/tutorial-items/background/default-green.webp"
          alt="Green Background"
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
            opacity: 1
          }"
          @mousedown="onMouseDown"
          @dragstart.prevent
          draggable="false"
        />

        <img
          v-if="placedItems && placedItems.length"
          v-for="item in placedItems"
          :key="item.id"
          class="item"
          :class="{ 
            'dragging': isEditDragging && selectedEditItem?.placementId === item.placementId
          }"
          :src="item.itemImageUrl" 
          :alt="item.itemName"
          :style="{
            left: `${item.placementPositionX}%`,
            top: `${item.placementPositionY}%`,
            width: `${item.placementWidth}px`,
            height: `${item.placementHeight}px`,
            zIndex: item.placementZIndex,
            opacity: 1,
            cursor: 'default'
          }"
        />
      </div>
    </div>
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