<template>
  <div class="calendar-bg">
    <img
      :src="backIcon"
      alt="뒤로가기"
      class="back-img"
      @click="emit('close')"
    />
    <div class="calendar-title">우리의 우정 일기 기록</div>
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
            'diary-my-only': getDiaryState(date) === 'my-only',
            'diary-other-only': getDiaryState(date) === 'other-only',
            'diary-shared': getDiaryState(date) === 'shared',
            'needs-item-selection': needsItemSelection(date)
          }"
          @click="onDiaryClick(date)"
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

const auth = useAuthStore()

// props로 forestId를 받아야함 (우정의 숲 ID)
const props = defineProps({
  forestId: {
    type: [String, Number],
    required: true
  }
});

const emit = defineEmits(['close', 'diary-click'])

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

function toggleYearSelect() {
  showYearSelect.value = !showYearSelect.value
  showMonthSelect.value = false
}
function toggleMonthSelect() {
  showMonthSelect.value = !showMonthSelect.value
  showYearSelect.value = false
}
function selectYear(y) {
  year.value = y
  showYearSelect.value = false
}
function selectMonth(m) {
  month.value = m
  showMonthSelect.value = false
}

async function fetchDiaries() {

  if (!props.forestId) {
    diaryData.value = [];
    return;
  }
  
  try {
    const res = await api.get(
      `diaries/shared?forestId=${props.forestId}&year=${year.value}&month=${month.value}`
    );
    diaryData.value = res.data.map(entry => ({
        date: entry.createdAt.split('T')[0],
        userId: entry.userId,
        diaryId: entry.diaryId,
        itemSelected: entry.itemSelected
    }));
  } catch (e) {
    console.error('Failed to fetch diaries:', e);
    console.error('Error response:', e.response?.data);
    console.error('Error status:', e.response?.status);
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

const needsItemSelection = (date) => {
  const d = `${year.value}-${String(month.value).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
  const myUserId = auth.$state.user.userId;
  return diaryData.value.some(entry => entry.date === d && entry.userId === myUserId && !entry.itemSelected)
}

// 날짜 상태에 따른 툴팁 메시지 반환
function getDiaryTooltip(date) {
    const state = getDiaryState(date);
    
    switch (state) {
        case 'my-only':
            return '일기를 작성하셨어요.';
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
  fetchDiaries();
})

async function onDiaryClick(date) {
  
  const dateStr = `${year.value}-${String(month.value).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
  
  const relevantDiaries = diaryData.value.filter(entry => entry.date === dateStr);

  const diaryIds = relevantDiaries.map(entry => entry.diaryId);

  if (diaryIds.length === 0) {
    console.error(`No diaries found for ${dateStr}.`);
    return;
  }

  const diaryIdsStr = diaryIds.join(',');
  const apiUrl = `diaries/shared/detail?diaryIds=${diaryIdsStr}`;
  
  try {
    
    const res = await api.get(apiUrl);

    const currentUserId = auth.$state.user.userId;

    const sortedDiaries = res.data.sort((a, b) => {
      const isAUser = a.userId === currentUserId;
      const isBUser = b.userId === currentUserId;

      if (isAUser && !isBUser) return -1;
      else if (!isAUser && isBUser) return 1;
      else return 0;
    });
    
    emit('diary-click', {
      diaries: sortedDiaries,
      year: year.value,
      month: month.value,
      day: date
    });
  } catch (e) {
    console.error('Failed to fetch diary detail:', e);
    console.error('Error response:', e.response?.data);
    console.error('Error status:', e.response?.status);
  }
}
</script>

<style scoped>
.calendar-bg {
  width: 100%;
  height: 115%;
  min-width: 340px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  background: none;
}
.back-img {    /* 페이지 뒤로가기 버튼 */
  position: absolute;
  top: 32px;
  left: 12px;
  width: 36px;
  height: 36px;
  cursor: pointer;
  z-index: 10;
}
.calendar-title {   /* 우리의 우정 일기 기록 */
  margin-top: 90px;
  margin-bottom: 0;
  text-align: center;
  font-size: 1.9rem;
  font-weight: 600;
  color: #fff;
  letter-spacing: -1px;
}
.calendar-content-box {     /* 뒤에 흰색 배경 */
  background: rgba(255,255,255,0.4);
  border-radius: 30px;
  padding: 30px 32px 24px 20px;
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
  margin-top: 100px;
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
  z-index: 20;
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
  transition: background 0.2s, color 0.2s;
  width: 44px;
  height: 44px;
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

.calendar-day.needs-item-selection {
  position: relative;
  animation: blink 1.5s infinite;
}
@keyframes blink {
  0% { opacity: 1; }
  50% { opacity: 0.4; }
  100% { opacity: 1; }
}

.calendar-day.diary-shared:hover {
  background: #4a6a4a;
}
</style>
  