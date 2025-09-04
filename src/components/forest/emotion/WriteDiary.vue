<template>
  <div class="diary-screen">
    <div class="content-wrapper">
      <div class="top-message">
        오늘 하루는 어땠나요?<br />
        하루의 감정을 숲에 심어보세요.
      </div>

      <div class="diary-container">
        <div class="diary-header">
          <div class="diary-title">
            <span class="diary-icon">🌳</span>
            감정 일기 쓰기
          </div>
          <!-- 날짜 선택 -->
          <div class="date-selector">
            {{ formattedDate }}
          </div>
        </div>

        <div class="button-group">
          <button class="action-btn secondary" @click="loadDraft">
            불러오기
          </button>
          <button class="action-btn secondary" @click="saveDraft">
            임시저장
          </button>
        </div>

        <textarea
          v-model="diaryContent"
          class="diary-textarea"
          placeholder="일기 내용을 입력해주세요"
          @input="updateCharCount"
        ></textarea>

        <div class="char-counter">{{ charCount }}/1000</div>

        <!-- 텍스트 길이에 따른 메시지 -->
        <div v-if="lengthMessage" class="length-message">
          {{ lengthMessage }}
        </div>

        <button 
          class="save-btn"
          @click="saveDiary"
          :disabled="!canSave"
        >
          저장하기
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import 'flatpickr/dist/flatpickr.css';
import { diaryApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { useDiaryWriteStore } from '@/stores/diaryWrite';

const auth = useAuthStore();
const diaryWriteStore = useDiaryWriteStore();

const props = defineProps({
  categoryId: {
    type: Number,
    required: true,
    validator: (value) => {
      return value > 0;
    }
  }
});

const diaryContent = ref('');
const charCount = ref(0);
const selectedDate = ref(new Date());

// 날짜 포맷팅
const formattedDate = computed(() => {
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const dateStr = diaryWriteStore.writeDate;
  const date = new Date(dateStr);
  const dayOfWeek = weekdays[date.getDay()];
  return `${dateStr} ${dayOfWeek}`;
});

// 텍스트 길이에 따른 메시지
const lengthMessage = computed(() => {
  const length = charCount.value;
  
  if (length > 1000) {
    return "1000자 이상 넘어갈 수 없어요.";
  } else if (length >= 100) {
    return "분석하기 좋은 충분한 길이네요!";
  } else if (length >= 50) {
    return "좋아요! 조금 더 작성해 볼까요?";
  } else if (length > 0 && length < 30) {
    return "조금 더 자세히 적어주시면 분석이 더 정확해져요! (최소 30자가 필요해요.)";
  }
  
  return "";
});

// 저장 버튼 활성화 조건
const canSave = computed(() => {

  return true;

  // 배포 시 활성화
  // const length = charCount.value;
  // return length >= 30 && length <= 1000 && diaryContent.value.trim();
});

const updateCharCount = () => {
  charCount.value = diaryContent.value.length;
};

const saveDraft = () => {

  // 실제 api로 수정 필요
  localStorage.setItem('diaryDraft', JSON.stringify({
    content: diaryContent.value,
    date: selectedDate.value
  }));
  emit("showAlert", "임시저장되었습니다.");
};

const loadDraft = () => {

  // 실제 api로 수정 필요
  emit("showAlert", "임시저장 기능은 현재 사용할 수 없습니다.");
};

const emit = defineEmits(['save', 'loading', 'showAlert']);

const saveDiary = async () => {
  try {
    if (!props.categoryId) {
      emit("showAlert", "카테고리가 선택되지 않았습니다.");
      return;
    }

    emit('loading', true);

    const createdAt = `${diaryWriteStore.writeDate}T00:00:00`;
    
    const forestId = auth.user?.forestId;
    
    if (forestId === null || forestId === undefined) {
      console.error('Invalid forestId:', forestId);
      emit("showAlert", "숲 정보를 찾을 수 없습니다. 다시 로그인해주세요.");
      return;
    }
    
    const requestData = {
      content: diaryContent.value,
      categoryId: props.categoryId,
      forestId: forestId,
      createdAt: createdAt
    };
    
    const response = await diaryApi.createDiary(requestData);

    if (!response) {
      throw new Error('API 응답이 없습니다.');
    }
    
    emit('save', response);
  } catch (error) {
    console.error('일기 저장 실패:', error);
    emit("showAlert", "일기 저장에 실패했습니다. 다시 시도해주세요.");
  } finally {
    emit('loading', false);
  }
};

onMounted(() => {
  const forestId = auth.user?.forestId;
  
  if (forestId === null || forestId === undefined) {
    console.warn('Warning: Invalid forestId on component mount:', forestId);
  }
  
  selectedDate.value = new Date();
  updateCharCount();
});
</script>

<style scoped>
.diary-screen {
  display: flex;
  flex-direction: column;
  height: 100%;
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

.diary-container {
  background: rgba(255,255,255,0.10);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 18px;
  padding: 28px;
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  width: 90%;
  box-sizing: border-box;
}

.diary-header {
  margin-bottom: 24px;
}

.diary-title {
  color: #fff;
  font-size: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.diary-icon {
  font-size: 24px;
}

.date-selector {
  position: relative;
  background: transparent;
}

.date-input {
  width: 100%;
  background: transparent;
  border: none;
  color:#3a5a40;
}

.date-button {
  background: rgba(255, 255, 255, 0.8);
  border: none;
  border-radius: 12px;
  padding: 12px 16px;
  color: #3a5a40;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.date-button::before {
  content: "🗓️";
  font-size: 18px;
}

.date-button:hover {
  background: rgba(255, 255, 255, 0.9);
}

.button-group {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.action-btn {
  background: rgba(255,255,255,0.25);
  border: none;
  border-radius: 10px;
  padding: 8px 16px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(255,255,255,0.35);
}

.diary-textarea {
  width: 100%;
  height: 300px;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 12px;
  padding: 16px;
  color: #fff;
  font-size: 16px;
  line-height: 1.6;
  resize: none;
  margin-bottom: 12px;
  box-sizing: border-box;
}

.diary-textarea::placeholder {
  color: rgba(255,255,255,0.5);
}

.diary-textarea:focus {
  outline: none;
  border-color: rgba(255,255,255,0.4);
}

.char-counter {
  color: rgba(255,255,255,0.7);
  font-size: 14px;
  text-align: right;
  margin-bottom: 12px;
}

.length-message {
  color: rgba(255,255,255,0.8);
  font-size: 12px;
  text-align: center;
  margin-bottom: 16px;
  padding: 8px;
  background: rgba(255,255,255,0.1);
  border-radius: 8px;
}

.save-btn {
  background: #3a5a40;
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 14px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
}

.save-btn:hover {
  background: #2d4632;
}

.save-btn:disabled {
  background: rgba(58, 90, 64, 0.5);
  cursor: not-allowed;
}

/* Flatpickr 커스텀 스타일 */

:global(.flatpickr-input) {
  border: none !important;
  background: transparent !important;
  cursor: pointer !important;
}

:global(.flatpickr-calendar) {
  background: rgba(255, 255, 255, 0.8) !important;
  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1) !important;
  border-radius: 20px !important;
  border: none !important;
  width: 300px !important;
  padding: 20px !important;
  margin-top: 10px !important;
}

:global(.flatpickr-calendar.arrowTop::before),
:global(.flatpickr-calendar.arrowTop::after),
:global(.flatpickr-calendar.arrowBottom::before),
:global(.flatpickr-calendar.arrowBottom::after) {
  display: none !important;
}

:global(.flatpickr-calendar.open) {
  display: inline-block !important;
  z-index: 100 !important;
}

:global(.flatpickr-innerContainer) {
  border-radius: 20px !important;
}

:global(.flatpickr-rContainer) {
  border-radius: 20px !important;
}

:global(.flatpickr-days) {
  border-radius: 20px !important;
}

:global(.dayContainer) {
  border-radius: 20px !important;
  min-width: 100% !important;
  max-width: 100% !important;
}

:global(.flatpickr-months) {
  padding-top: 16px !important;
}

:global(.flatpickr-month) {
  background: transparent !important;
  color: #3a5a40 !important;
  fill: #3a5a40 !important;
  height: 40px !important;
}

:global(.flatpickr-current-month) {
  padding-top: 0px !important;
  font-size: 16px !important;
  font-weight: 500 !important;
  color: #3a5a40 !important;
}

:global(.flatpickr-monthDropdown-months) {
  background: transparent !important;
  color: #3a5a40 !important;
  font-weight: 500 !important;
}

:global(.flatpickr-monthDropdown-month) {
  background: rgba(255, 255, 255, 0.9) !important;
  color: #3a5a40 !important;
}

:global(.flatpickr-weekdays) {
  background: transparent !important;
  padding-top: 8px !important;
}

:global(.flatpickr-weekday) {
  background: transparent !important;
  color: rgba(58, 90, 64, 0.8) !important;
  font-size: 14px !important;
  font-weight: normal !important;
}

:global(.flatpickr-day) {
  background: transparent !important;
  border-radius: 50% !important;
  color: #3a5a40 !important;
  margin: 2px !important;
  height: 36px !important;
  line-height: 36px !important;
  width: 36px !important;
  max-width: 36px !important;
}

:global(.flatpickr-day.selected) {
  background: rgba(58, 90, 64, 0.2) !important;
  border: none !important;
  color: #3a5a40 !important;
  font-weight: bold !important;
}

:global(.flatpickr-day:hover) {
  background: rgba(58, 90, 64, 0.1) !important;
}

:global(.flatpickr-day.today) {
  border: none !important;
  background: rgba(58, 90, 64, 0.15) !important;
}

:global(.flatpickr-day.prevMonthDay),
:global(.flatpickr-day.nextMonthDay) {
  color: rgba(58, 90, 64, 0.4) !important;
}

:global(.flatpickr-prev-month),
:global(.flatpickr-next-month) {
  fill: #3a5a40 !important;
  padding: 10px !important;
}

:global(.flatpickr-prev-month:hover),
:global(.flatpickr-next-month:hover) {
  opacity: 1 !important;
}

:global(.flatpickr-prev-month svg),
:global(.flatpickr-next-month svg) {
  opacity: 0.7 !important;
}

:global(.flatpickr-prev-month:hover svg),
:global(.flatpickr-next-month:hover svg) {
  opacity: 1 !important;
}
</style>