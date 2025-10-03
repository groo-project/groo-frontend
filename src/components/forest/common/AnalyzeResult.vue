<template>
  <div class="result-screen">
    <div class="content-wrapper">
      <div class="top-message">
        오늘의 감정은<br />
        <span class="main-emotion">{{ summaryMessage }}</span>
      </div>

      <div class="emotion-result-container">
        <div
          v-for="(emo, idx) in emotions"
          :key="emo.label"
          class="emotion-card"
          :style="{ marginLeft: idx === 0 ? '0' : '16px' }"
        >
          <div class="emotion-label">{{ emo.label }}</div>
          <div class="emotion-icon">
            <img :src="emo.icon" alt="emotion icon" />
          </div>
          <div class="emotion-percent">{{ emo.percent }}%</div>
        </div>
      </div>

      <div class="result-title">
        감정을 기반으로<br />
        생성된 기억의 조각 중 하나를 선택해주세요
      </div>

      <div class="piece-options">
        <div
          v-for="piece in pieces"
          :key="piece.value"
          :class="['piece-card', { selected: selected === piece.value }]"
          @click="selectPiece(piece.value)"
        >
          <div class="piece-label">{{ piece.label }}</div>
          <img :src="piece.icon" class="piece-icon" />
        </div>
      </div>

      <transition name="fade">
        <div v-if="selected" class="result-actions">
          <button class="action-btn" @click="$emit('place', selectedPiece)">배치하기</button>
          <button class="action-btn secondary" @click="onSaveClick(selectedPiece)">보관소에 저장하기</button>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  emotions: {
    type: Array,
    required: true,
    // [{ label: '평온함', emoji: '😊', percent: 50 }, ...]
  },
  summaryMessage: {
    type: String,
    required: true
  },
  pieces: {
    type: Array,
    required: true,
    // [{ value: 'tree1', label: '동글 나무', icon: '...' }, ...]
  }
})
const selected = ref(null)
let selectedPiece = ref(null)

const selectPiece = (val) => {
  selected.value = val
  selectedPiece = props.pieces.filter((piece) => piece.value === val)[0]
}

const emit = defineEmits(['place','toStorage'])

function onSaveClick(piece) {
  // piece: 클릭된 조각 객체
  emit('toStorage', piece)
}
</script>

<style scoped>
.result-screen {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 100px 0;
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.top-message {
  color: #fff;
  font-size: 18px;
  margin-bottom: 32px;
  margin-left: 20px;
  line-height: 1.5;
}

.main-emotion {
  color: #fff;
  font-size: 20px;
  font-weight: 600;
  display: block;
  margin-top: 8px;
}

.emotion-result-container {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 32px;
}

.emotion-card {
  background: rgba(255,255,255,0.25);
  border-radius: 14px;
  padding: 12px 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 90px;
}

.emotion-label {
  color: #3a5a40;
  font-size: 15px;
  margin-bottom: 4px;
}

.emotion-icon {
  width: 40px;
  height: 40px;
  margin: 12px 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.emotion-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.emotion-percent {
  color: #3a5a40;
  font-size: 15px;
  font-weight: 500;
}

.result-title {
  color: #fff;
  font-size: 17px;
  text-align: center;
  margin-bottom: 24px;
  line-height: 1.5;
}

.piece-options {
  display: flex;
  justify-content: center;
  gap: 16px;
  width: 100%;
  margin-bottom: 20px;
}

.piece-card {
  background: rgba(255,255,255,0.25);
  border-radius: 14px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
  flex: 1;
  max-width: 100px;
}

.piece-card.selected {
  border: 2px solid #3a5a40;
  background: rgba(255,255,255,0.45);
}

.piece-label {
  color: #3a5a40;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
}

.piece-icon {
  width: 60px;
  height: 60px;
  object-fit: contain;
}

.result-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 0 20px;
  margin-top: 12px;
}

.action-btn {
  background: #3a5a40;
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 12px 24px;
  font-size: 16px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  width: 45%;
  max-width: 200px;
}

.action-btn:hover {
  background: #2d4632;
}

.action-btn.secondary {
  background: #b7cbb3;
  color: #3a5a40;
}

.action-btn.secondary:hover {
  background: #a5bca0;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style> 