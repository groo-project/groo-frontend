<template>
  <div class="calendar-bg">
    <img
      :src="backIcon"
      alt="뒤로가기"
      class="back-img"
      @click="emit('close')"
    />
    <div class="calendar-title">감정일기 작성하기</div><br>
    <div class="calendar-sub">일기 작성은 2일 전까지만 가능해요</div>
    <div class="calendar-content-box">
      <div class="calendar-controls">
        <span class="year-toggle" @click="toggleYearSelect">
          {{ year }}년
          <div v-if="showYearSelect" class="dropdown year-dropdown">
            <div v-for="y in years" :key="y" @click.stop="selectYear(y)">{{ y }}년</div>
          </div>
        </span>
        <span class="month-toggle" @click="toggleMonthSelect">
          {{ month }}월
          <div v-if="showMonthSelect" class="dropdown month-dropdown">
            <div v-for="m in months" :key="m" @click.stop="selectMonth(m)">{{ m }}월</div>
          </div>
        </span>
      </div>
      <div class="calendar-grid">
        <div class="calendar-header" v-for="day in weekDays" :key="day">{{ day }}</div>
        <div v-for="n in startBlank" :key="'blank-' + n"></div>
        <div
          v-for="date in daysInMonth"
          :key="date"
          class="calendar-day"
          :class="{
            'disabled': !isDateSelectable(date),
            'available': isDateSelectable(date),
            'diary-my-only': getDiaryState(date) === 'my-only',
            'diary-other-only': getDiaryState(date) === 'other-only',
            'diary-shared': getDiaryState(date) === 'shared'
          }"
          @click="handleDateClick(date)"
          :style="{ cursor: isDateSelectable(date) ? 'pointer' : 'not-allowed' }"
          :title="getDiaryTooltip(date)"
        >
          {{ date }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import backIcon from '@/icons/back.png'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/auth'  
import { useDiaryWriteStore } from '@/stores/diaryWrite'
import { useAlertStore } from '@/stores/alert'
import { useMateForestStore } from '@/stores/mateForest'

const alert = useAlertStore()

const auth = useAuthStore()
const mateforest = useMateForestStore();
const diaryWriteStore = useDiaryWriteStore();
const forestId = mateforest.currentMateForestId || '';

const emit = defineEmits(['close', 'new-diary-click'])

const today = new Date()
const year = ref(today.getFullYear())
const month = ref(today.getMonth() + 1)
const diaryData = ref([])

const weekDays = ['일', '월', '화', '수', '목', '금', '토']
const years = Array.from({length: today.getFullYear() - 2020 + 1}, (_, i) => 2020 + i)
const months = Array.from({length: 12}, (_, i) => i + 1)

const showYearSelect = ref(false)
const showMonthSelect = ref(false)

const daysInMonth = computed(() => new Date(year.value, month.value, 0).getDate())
const startBlank = computed(() => new Date(year.value, month.value - 1, 1).getDay())

// 날짜가 선택 가능한지 확인 (오늘부터 2일 전까지)
const isDateSelectable = (date) => {
  const currentDate = new Date(year.value, month.value - 1, date)
  const todayDate = new Date()
  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(todayDate.getDate() - 2)
  
  // 시간을 00:00:00으로 설정하여 날짜만 비교
  currentDate.setHours(0, 0, 0, 0)
  todayDate.setHours(0, 0, 0, 0)
  threeDaysAgo.setHours(0, 0, 0, 0)
  
  return currentDate >= threeDaysAgo && currentDate <= todayDate
}

const handleDateClick = (date) => {
  // 선택 불가능한 날짜는 클릭 무시
  if (!isDateSelectable(date)) {
    return
  }
  
  // 일기가 있는 날을 클릭한 경우
  if (hasMyDiary(date)) {
    onExistingDiaryClick(date)
  } 
  // 일기가 없는 날을 클릭한 경우
  else {
    onNewDiaryClick(date)
  }
}

// 이미 일기가 작성된 날을 클릭했을 때 실행되는 함수
const onExistingDiaryClick = async (date) => {
  alert.show("해당 날짜에 이미 일기가 작성되었어요!")

  // 배포 시 제거
  onNewDiaryClick(date);
}

// 일기가 없는 날을 클릭했을 때 실행되는 함수
const onNewDiaryClick = (date) => {
  const dateStr = `${year.value}-${String(month.value).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
  
  // 새 일기 작성용 emit
  diaryWriteStore.setWriteDiaryDate(dateStr)
  emit('new-diary-click');
}

const toggleYearSelect = () => {
  showYearSelect.value = !showYearSelect.value
  showMonthSelect.value = false
}
const toggleMonthSelect = () => {
  showMonthSelect.value = !showMonthSelect.value
  showYearSelect.value = false
}
const selectYear = (y) => {
  year.value = y
  showYearSelect.value = false
}
const selectMonth = (m) => {
  month.value = m
  showMonthSelect.value = false
}

const fetchDiaries = async () => {
  const currentForestId = forestId || mateforest.currentMateForestId;
  
  if (!currentForestId) {
    console.error('Forest ID not available');
    diaryData.value = [];
    return;
  }
  
  try {
    const res = await api.get(
      `diaries/shared?forestId=${currentForestId}&year=${year.value}&month=${month.value}`);
    diaryData.value = res.data.map(entry => ({
        date: entry.createdAt.split('T')[0],
        userId: entry.userId
    }));

  } catch (e) {
    console.error('Failed to fetch diaries:', e);
    console.error('Error response:', e.response?.data);
  }
}

const hasMyDiary = (date) => {
    const d = `${year.value}-${String(month.value).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    const myUserId = auth.$state.user.userId;
    return diaryData.value.some(entry => entry.date === d && entry.userId === myUserId);
}

const hasOtherDiary = (date) => {
    const d = `${year.value}-${String(month.value).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    const myUserId = auth.$state.user.userId;
    return diaryData.value.some(entry => entry.date === d && entry.userId !== myUserId);
}

// 세 가지 상태를 구분하는 로직
const getDiaryState = (date) => {
    const isMyDiary = hasMyDiary(date);
    const isOtherDiary = hasOtherDiary(date);
    
    if (!isMyDiary && !isOtherDiary) {
        return 'none'; // 일기 없음
    } else if (isMyDiary && isOtherDiary) {
        return 'shared'; // 내 일기 + 상대 일기 모두 있음 (가장 강조)
    } else if (isMyDiary) {
        return 'my-only'; // 내 일기만 있음 (기존 스타일)
    } else { // if (isOtherDiary)
        return 'other-only'; // 상대 일기만 있음 (다른 스타일)
    }
}

// 날짜 상태에 따른 툴팁 메시지 반환
function getDiaryTooltip(date) {
    if (!isDateSelectable(date)) {
        const todayDate = new Date();
        const currentDate = new Date(year.value, month.value - 1, date);
        currentDate.setHours(0, 0, 0, 0);

        if (currentDate > todayDate) {
            return '미래의 일기는 작성할 수 없어요.';
        } else {
            return '일기는 2일 전까지만 작성 가능해요.';
        }
    }
    
    const state = getDiaryState(date);
    
    switch (state) {
        case 'none':
            return '일기를 작성할 수 있어요!';
        case 'my-only':
            return '이미 일기를 작성하셨어요.';
        case 'other-only':
            return '메이트가 일기를 작성했네요.';
        case 'shared':
            return '메이트도 일기를 작성했어요!';
        default:
            return '';
    }
}

watch([year, month], fetchDiaries)
onMounted(() => {
    fetchDiaries()
})
</script>

<style scoped>
.calendar-bg {
  width: 100%;
  height: 100%;
  min-width: 340px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  background: none;
}
.back-img {
  position: absolute;
  top: 32px;
  left: 12px;
  width: 36px;
  height: 36px;
  cursor: pointer;
  z-index: 10;
}
.calendar-title {
  margin-top: 0px;
  margin-bottom: 0;
  text-align: center;
  font-size: 1.9rem;
  font-weight: 600;
  color: #fff;
  letter-spacing: -1px;
}
.calendar-content-box {
  background: rgba(255,255,255,0.4);
  border-radius: 30px;
  padding: 8px 32px 24px 20px;
  margin-top: 60px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.04);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.calendar-controls {
  width: 100%;
  max-width: 420px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  margin-top: 120px;
  margin-bottom: 170px;
  color: #fff;
  font-size: 1.2rem;
  font-weight: 600;
  position: relative;
  margin-left: 0;
}
.year-toggle, .month-toggle {
  cursor: pointer;
  position: relative;
  padding: 0 4px;
  left: 10px;
  bottom: 110px;
}
.dropdown {
  position: absolute;
  top: 120%;
  left: 0;
  background: #c2c2c2;
  color: #3a5a40;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  z-index: 50;
  min-width: 100px;
}
.year-dropdown div, .month-dropdown div {
  padding: 8px 16px;
  cursor: pointer;
}
.year-dropdown div:hover, .month-dropdown div:hover {
  background: #b6d6b6;
}
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 40px);
  grid-auto-rows: 40px;
  gap: 12px;
  background: none;
  margin-top: -250px;
  margin-bottom: 0;
  z-index: 1;
}
.calendar-header {
  color: #474c47;
  font-weight: 600;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
}
.calendar-day {
  background: transparent;
  color: #4a5a4a;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: 600;
  box-shadow: none;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, opacity 0.2s;
  width: 44px;
  height: 44px;
}

/* 선택 가능한 날짜 (오늘부터 3일 전까지, 일기 없음) */
.calendar-day.available {
  background: transparent;
  color: #4a5a4a;
  opacity: 1;
}

.calendar-day.available:hover {
  background: #b6d6b6;
  color: #2d3a2d;
}

.calendar-day.diary-my-only {
  background: #ffffff8f; /* 기존 has-diary 배경 */
  color: #3a5a40;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  opacity: 0.9; /* 약간 더 강조 */
  cursor: pointer;
}

.calendar-day.diary-my-only:hover {
  background: #e8f5e8;
  opacity: 1;
}

/* 상대 일기만 있는 날짜 */
.calendar-day.diary-other-only {
  /* 배경을 반투명 녹색으로 하여 나와 상대의 색상 대비 */
  background: rgba(144, 182, 144, 0.7); /* 산뜻한 연두색 계열 */
  color: #fff; /* 흰색 글자로 대비 강조 */
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  opacity: 0.9;
  cursor: pointer;
}

.calendar-day.diary-other-only:hover {
  background: rgb(144, 182, 144);
  opacity: 1;
}

/* 내 일기 + 상대 일기 모두 있는 날짜 (가장 강조) */
.calendar-day.diary-shared {
  /* 배경을 더 진하고 꽉 찬 색상으로 (예: 숲 테마에 맞는 진한 녹색 계열) */
  background: #3a5a40;
  color: #fff; /* 흰색 글자 */
  /* 테두리를 추가하여 가장 눈에 띄게 */
  border: 2px solid #b6d6b6; 
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  opacity: 1;
  cursor: pointer;
}

.calendar-day.diary-shared:hover {
  background: #4a6a4a;
}

/* 선택 불가능한 날짜 (3일 전 이전 또는 미래) */
.calendar-day.disabled {
  background: transparent;
  color: #4a5a4a;
  opacity: 0.3;
  cursor: not-allowed;
}

.calendar-day.disabled:hover {
  background: transparent;
  color: #4a5a4a;
  opacity: 0.3;
}
</style>