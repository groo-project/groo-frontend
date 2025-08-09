<script setup>
// Props 정의
const props = defineProps({
  changedItemsCount: {
    type: Number,
    default: 0
  },
  removedItemsCount: {
    type: Number,
    default: 0
  }
})

// Emits 정의
const emit = defineEmits([
  'complete-rearrange',
  'cancel-rearrange'
])

// 이벤트 핸들러들
const handleCompleteRearrange = () => {
  emit('complete-rearrange')
}

const handleCancelRearrange = () => {
  emit('cancel-rearrange')
}
</script>

<template>
  <div class="complete-panel">
    <div class="complete-section">
      <h4>재배치 완료</h4>
      
      <div class="summary-info">
        <div class="summary-item">
          <span class="summary-label">변경된 아이템:</span>
          <span class="summary-value">{{ changedItemsCount }}개</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">회수된 아이템:</span>
          <span class="summary-value">{{ removedItemsCount }}개</span>
        </div>
      </div>
      
      <div class="complete-actions">
        <button @click="handleCompleteRearrange" class="complete-btn">완료</button>
        <button @click="handleCancelRearrange" class="cancel-btn">취소</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.complete-panel {
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
  display: flex;
  flex-direction: column;
}

.complete-section {
  display: flex;
  flex-direction: column;
}

.complete-section h4 {
  margin: 0 0 24px 0;
  color: #fff;
  font-size: 20px;
  font-weight: 700;
  text-align: center;
  letter-spacing: -0.5px;
}

.summary-info {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 20px;
  margin-bottom: 32px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.summary-item:last-child {
  margin-bottom: 0;
}

.summary-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  font-weight: 500;
}

.summary-value {
  color: #fff;
  font-size: 16px;
  font-weight: 700;
}

.complete-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.complete-btn, .cancel-btn {
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

.complete-btn {
  background: rgba(58, 90, 64, 0.8);
  border-color: rgba(58, 90, 64, 0.6);
}

.complete-btn:hover {
  background: rgba(58, 90, 64, 1);
  border-color: rgba(58, 90, 64, 0.8);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(58, 90, 64, 0.4);
}

.cancel-btn {
  background: rgba(108, 117, 125, 0.8);
  border-color: rgba(108, 117, 125, 0.6);
}

.cancel-btn:hover {
  background: rgba(108, 117, 125, 1);
  border-color: rgba(108, 117, 125, 0.8);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(108, 117, 125, 0.4);
}

.complete-btn:active, .cancel-btn:active {
  transform: translateY(0);
}
</style>
