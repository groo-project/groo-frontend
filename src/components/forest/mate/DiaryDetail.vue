<template>
    <div class="diary-detail-bg">
      <img
        :src="backPageIcon"
        alt="뒤로가기"
        class="back-img"
        @click="$emit('close')"
      />
      <div class="diary-detail-username">
        {{ nickname }} 님이 작성한,
      </div>
      <div class="diary-detail-title">
        {{ year }}년 {{ month }}월 {{ day }}일의 우정 일기
        <span
          class="emotion-tag"
          v-for="emotion in emotions"
          :key="emotion"
        >{{ emotion }}</span>
      </div>
  
      <div class="diary-detail-content-title">
        우정 일기 <span class="emoji">🌳</span>
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
  
  const props = defineProps({
    nickname: { type: String, required: true },
    year: { type: Number, required: true },
    month: { type: Number, required: true },
    day: { type: Number, required: true },
    weekday: { type: String, required: false },
    emotions: { type: Array, default: () => [] },
    content: { type: String, default: '' },
    showPrev: { type: Boolean, default: false },
    showNext: { type: Boolean, default: false }
  })
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
  }
  .back-img {
    position: absolute;
    top: -10px;
    left: -10px;
    width: 32px;
    height: 32px;
    cursor: pointer;
    z-index: 10;
  }
  .diary-detail-username {
    color: #fff;
    font-size: 1.3rem;
    font-weight: 400;
    margin-top: 40px;
    margin-bottom: 0px;
    margin-left: -10px;
    letter-spacing: -0.5px;
  }
  .diary-detail-title {
    font-size: 1.3rem;
    font-weight: 600;
    color: #fff;
    margin-bottom: 30px;
    margin-top: 10px;
    margin-left: -10px;
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
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
    margin-left: -10px;
    position: relative;
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
    margin-left: -20px;
    box-shadow: 0 2px 12px 0 rgba(0,0,0,0.04);
    display: flex;
    flex-direction: column;
    position: relative;
  }
  .diary-detail-content-text {
    color: #222;
    font-size: 1.05rem;
    line-height: 1.7;
    margin-bottom: 24px;
    margin-left: -20px;
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
    margin-left: 24px;
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
  </style>
  