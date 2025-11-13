<template>
  <div class="result-screen">
    <img
        :src="backIcon"
        alt="뒤로가기"
        class="back-img"
        @click="emit('close')"
      />
    <div class="content-wrapper">
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
import { onMounted, ref } from 'vue'
import backIcon from '@/icons/back.png'
import { useDiaryWriteStore } from '@/stores/diaryWrite'
import { useAlertStore } from '@/stores/alert'
import api from '@/lib/api'

const diaryWrite = useDiaryWriteStore()
const alert = useAlertStore()

const pieces = ref([])

const selected = ref(null)
let selectedPiece = ref(null)

const selectPiece = (val) => {
  selected.value = val
  selectedPiece.value = pieces.value.find((piece) => piece.value === val)
}

const emit = defineEmits(['place','toStorage', 'close'])

function onSaveClick(piece) {
  // piece: 클릭된 조각 객체
  emit('toStorage', piece)
}

onMounted(() => {
    fetchDraftedItems();
})

const fetchDraftedItems = async () => {
  try {
    const res = await api.get(`diaries/items/storage?diaryId=${diaryWrite.savedDiaryId}`);

    const piecesArray = [
      {
        value: res.data.itemId1,
        label: res.data.itemName1,
        icon: res.data.itemImageUrl1,
      },
      {
        value: res.data.itemId2,
        label: res.data.itemName2,
        icon: res.data.itemImageUrl2,
      },
      {
        value: res.data.itemId3,
        label: res.data.itemName3,
        icon: res.data.itemImageUrl3,
      },
    ]

    pieces.value = piecesArray;
  } catch (e) {
    console.error(e);
    alert.show("선택할 아이템 목록을 불러오지 못했습니다.")
  }
}
</script>

<style scoped>
.result-screen {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 100px 0;
}

.back-img {
  position: absolute;
  top: 27px;
  left: 32px;
  width: 36px;
  height: 36px;
  cursor: pointer;
  z-index: 10;
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1;
  position: relative;
  top: 120px;
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