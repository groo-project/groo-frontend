<template>
  <div class="diary-detail-bg">
    <img
      :src="backPageIcon"
      alt="뒤로가기"
      class="back-img"
      @click="$emit('close')"
    />
    <div class="author-badge">
        {{ nickname }} 님이 작성한,
      </div>
    <div class="diary-detail-title">
      {{ year }}년 {{ month }}월 {{ day }}일의 우정 일기
      <span
        class="emotion-tag"
        v-for="emotion in emotions"
        :key="emotion"
        :style="{ backgroundColor: getEmotionColor(emotion) }"
      >{{ emotion }}</span>
    </div>

    <div class="diary-detail-content-title">
      우정 일기 <span class="emoji">🌳</span>
      <button
        v-if="!itemSelected"
        class="select-item-btn"
        @click="handleSelectItem"
      >
        아이템 선택하기
      </button>
      <div class="diary-detail-arrows">
        <img
          :src="forwardIcon"
          class="arrow-btn"
          :class="{ 'invisible': !showPrev }"
          @click="showPrev && $emit('prev')"
          style="transform: rotate(180deg);"
        />
        <img
          :src="forwardIcon"
          class="arrow-btn"
          :class="{ 'invisible': !showNext }"
          @click="showNext && $emit('next')"
        />
      </div>
    </div>
    <div class="diary-detail-content-box">
      <div class="diary-detail-content-text">
        {{ content }}
      </div>
      <div class="diary-detail-content-count">
        {{ content.length }}/1000
      </div>
    </div>
  </div>
  </template>
  
  <script setup>
  import backPageIcon from '@/icons/back.png'
  import forwardIcon from '@/icons/arrow_forward.png'
  import { useDiaryWriteStore } from '@/stores/diaryWrite';

  const diaryWrite = useDiaryWriteStore();

  const emit = defineEmits(['select-item', 'close', 'prev', 'next'])

  const getEmotionColor = (emotion) => {
  const colorMap = {
    슬픔: '#6B8EFF',     // 파란색
    즐거움: '#FFD93D',   // 노란색
    평온함: '#95D1CC',   // 민트색
    짜증: '#FF6B6B',     // 빨간색
    지침: '#A8A8A8',     // 회색
    설렘: '#FF9ECD',     // 분홍색
    우울함: '#7B7FEA',   // 보라색
    불안함: '#98A8F8'    // 연한 보라색
  };
  return colorMap[emotion] || '#8fa6a6'; // 기본색
};
  
  const props = defineProps({
    nickname: { type: String, required: true },
    year: { type: Number, required: true },
    month: { type: Number, required: true },
    day: { type: Number, required: true },
    weekday: { type: String, required: false },
    emotions: { type: Array, default: () => [] },
    content: { type: String, default: '' },
    showPrev: { type: Boolean, default: false },
    showNext: { type: Boolean, default: false },
    itemSelected: { type: Boolean, default: true },
    diaryId: { type: Number },
  })

  const handleSelectItem = () => {
  diaryWrite.setSavedDiaryId(props.diaryId);
  emit('select-item');
}
  </script>
  
  <style scoped>
  .diary-detail-bg {
    width: 100%;
    height: 100%;
    min-width: 340px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    position: relative;
    background: none;
    padding: 0 0 0 40px;
    padding-top: 70px;
  }
.back-img {
    position: absolute;
    top: 27px;
    left: 12px;
    width: 36px;
    height: 36px;
    cursor: pointer;
    z-index: 10;
  }
.diary-detail-username {
    color: #fff;
    font-size: 1.3rem;
    font-weight: 400;
    margin-left: 8px;
    letter-spacing: -0.5px;
  }
.diary-detail-username .nickname {
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    margin-right: 6px;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.2);
    box-shadow: 0 4px 14px rgba(0,0,0,0.08);
    font-weight: 600;
  }
.diary-detail-title {
    font-size: 1.3rem;
    font-weight: 600;
    color: #fff;
    margin-bottom: 30px;
    margin-top: 0px;
    margin-left: 8px;
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    position: relative;
    top: 28px;
  }
  .emotion-tag {
    background: #8fa6a6;
    color: #fff;
    border-radius: 12px;
    padding: 3px 16px;
    font-size: 1rem;
    margin-left: 10px;
  }
.diary-detail-content-title {
  font-size: 1.7rem;
  font-weight: 500;
  color: #fff;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 8px;
  position: relative;
  top: 28px;
}
.author-badge {
  font-size: 1.1rem;
  font-weight: 500;
  color: rgba(255,255,255,0.85);
  margin-left: 8px;
  position: relative;
  top: 28px;
}

.author-badge.nickname {
  font-size: 1.3rem;
  font-weight: 600;
  color: #fff;
}
  .emoji {
    font-size: 1.7rem;
  }
  .diary-detail-content-box {
    background: rgba(255,255,255,0.18);
    border-radius: 18px;
    padding: 32px 24px 24px 40px;
    width: 80%;
    min-width: 230px;
    min-height: 460px;
    margin-top: 0;
    margin-left: 0px;
    box-shadow: 0 2px 12px 0 rgba(0,0,0,0.04);
    display: flex;
    flex-direction: column;
    position: relative;
    top: 28px;
  }
  .diary-detail-content-text {
    color: #222;
    font-size: 1.05rem;
    line-height: 1.7;
    margin-bottom: 24px;
    margin-left: -15px;
    word-break: keep-all;
  }
  .diary-detail-content-count {
    position: absolute;
    right: 24px;
    bottom: 16px;
    color: #fff;
    font-size: 1rem;
    opacity: 0.7;
  }
  .diary-detail-arrows {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-left: auto;
  }
  .arrow-btn {
    width: 28px;
    height: 28px;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.2s;
  }
  .arrow-btn.invisible {
    opacity: 0;
    cursor: default;
    pointer-events: none;
  }
  .arrow-btn:not(.invisible):hover {
    opacity: 1;
  }

  .select-item-btn {
  margin-left: 12px;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.65);
  color: #2d4c2d;
  border: none;
  border-radius: 16px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  position: relative;
}

.select-item-btn:hover {
  background: #b6d6b6;
  color: #1e361e;
  transform: translateY(-1px);
}
  </style>
  