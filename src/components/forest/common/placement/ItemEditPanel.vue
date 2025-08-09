<script setup>
import { computed } from 'vue'

// Props 정의
const props = defineProps({
  selectedItem: {
    type: Object,
    required: true
  },
  itemScale: {
    type: Number,
    default: 1.0
  },
  itemZIndex: {
    type: Number,
    default: 50
  },
  baseSize: {
    type: Number,
    default: 60
  }
})

// Emits 정의
const emit = defineEmits([
  'update-placement',
  'remove-item',
  'cancel-selection',
  'increase-scale',
  'decrease-scale',
  'increase-z-index',
  'decrease-z-index'
])

// 상수 정의
const ITEM_CONSTANTS = {
  MIN_SCALE: 0.3,
  MAX_SCALE: 3.0,
  MIN_Z_INDEX: 0,
  MAX_Z_INDEX: 999
}

// 계산된 값들
const calculatedWidth = computed(() => Math.round(props.baseSize * props.itemScale))
const calculatedHeight = computed(() => Math.round(props.baseSize * props.itemScale))

// 이벤트 핸들러들
const handleUpdatePlacement = () => {
  emit('update-placement')
}

const handleRemoveItem = () => {
  emit('remove-item')
}

const handleCancelSelection = () => {
  emit('cancel-selection')
}

const increaseScale = () => {
  if (props.itemScale < ITEM_CONSTANTS.MAX_SCALE) {
    emit('increase-scale')
  }
}

const decreaseScale = () => {
  if (props.itemScale > ITEM_CONSTANTS.MIN_SCALE) {
    emit('decrease-scale')
  }
}

const increaseZIndex = () => {
  if (props.itemZIndex < ITEM_CONSTANTS.MAX_Z_INDEX) {
    emit('increase-z-index')
  }
}

const decreaseZIndex = () => {
  if (props.itemZIndex > ITEM_CONSTANTS.MIN_Z_INDEX) {
    emit('decrease-z-index')
  }
}
</script>

<template>
  <div class="control-panel">
    <div class="control-section">
      <h4>아이템 편집</h4>
      
      <div class="item-preview">
        <img :src="selectedItem.itemImageUrl" :alt="selectedItem.itemName" class="preview-image" />
        <p class="item-name">{{ selectedItem.itemName }}</p>
      </div>
      
      <div class="control-group">
        <label class="control-label">크기 조절</label>
        <div class="scale-display">{{ Math.round(itemScale * 100) }}%</div>
        <div class="size-info">{{ calculatedWidth }}px × {{ calculatedHeight }}px</div>
        <div class="control-buttons">
          <button @click="decreaseScale" class="control-btn" :disabled="itemScale <= ITEM_CONSTANTS.MIN_SCALE">-</button>
          <button @click="increaseScale" class="control-btn" :disabled="itemScale >= ITEM_CONSTANTS.MAX_SCALE">+</button>
        </div>
      </div>
      
      <div class="control-group">
        <label class="control-label">레이어 조절</label>
        <div class="layer-display">{{ itemZIndex }}</div>
        <div class="control-buttons">
          <button @click="decreaseZIndex" class="control-btn" :disabled="itemZIndex <= ITEM_CONSTANTS.MIN_Z_INDEX">-</button>
          <button @click="increaseZIndex" class="control-btn" :disabled="itemZIndex >= ITEM_CONSTANTS.MAX_Z_INDEX">+</button>
        </div>
      </div>
      
      <div class="control-actions">
        <button @click="handleUpdatePlacement" class="update-btn-panel">변경 적용</button>
        <button @click="handleRemoveItem" class="remove-btn-panel">회수</button>
        <button @click="handleCancelSelection" class="cancel-btn-panel">취소</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
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

.control-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.control-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-actions {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.update-btn-panel, .remove-btn-panel, .cancel-btn-panel {
  width: 100%;
  padding: 16px;
  color: #fff;
  border: 1.5px solid;
  border-radius: 12px;
  cursor: pointer;
  font-size: 18px;
  font-weight: 700;
  transition: all 0.3s ease;
  letter-spacing: -0.5px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.update-btn-panel {
  background: rgba(58, 90, 64, 0.8);
  border-color: rgba(58, 90, 64, 0.6);
}

.update-btn-panel:hover {
  background: rgba(58, 90, 64, 1);
  border-color: rgba(58, 90, 64, 0.8);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(58, 90, 64, 0.4);
}

.remove-btn-panel {
  background: rgba(220, 53, 69, 0.8);
  border-color: rgba(220, 53, 69, 0.6);
}

.remove-btn-panel:hover {
  background: rgba(220, 53, 69, 1);
  border-color: rgba(220, 53, 69, 0.8);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(220, 53, 69, 0.4);
}

.cancel-btn-panel {
  background: rgba(108, 117, 125, 0.8);
  border-color: rgba(108, 117, 125, 0.6);
}

.cancel-btn-panel:hover {
  background: rgba(108, 117, 125, 1);
  border-color: rgba(108, 117, 125, 0.8);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(108, 117, 125, 0.4);
}

.update-btn-panel:active, .remove-btn-panel:active, .cancel-btn-panel:active {
  transform: translateY(0);
}
</style>
