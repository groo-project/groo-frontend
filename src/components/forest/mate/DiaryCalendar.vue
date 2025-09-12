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
          :class="{ 'has-diary': hasDiary(date) }"
          @click="hasDiary(date) && onDiaryClick(date)"
          style="cursor: pointer"
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
import forwardIcon from '@/icons/arrow_forward.png'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const { user, accessToken } = authStore;
const token = accessToken || '';

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
const diaryDates = ref([])

const weekDays = ['일', '월', '화', '수', '목', '금', '토']
const years = Array.from({length: today.getFullYear() - 2020 + 1}, (_, i) => 2020 + i)
const months = Array.from({length: 12}, (_, i) => i + 1)

const showYearSelect = ref(false)
const showMonthSelect = ref(false)

const daysInMonth = computed(() => new Date(year.value, month.value, 0).getDate())
const startBlank = computed(() => new Date(year.value, month.value - 1, 1).getDay())

function hasDiary(date) {
  const d = `${year.value}-${String(month.value).padStart(2, '0')}-${String(date).padStart(2, '0')}`
  return diaryDates.value.includes(d)
}

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

function getUserIdFromToken() {
  if (!token) {
    return null;
  }
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    // JWT에서 userId는 sub 필드에 있습니다
    const userId = payload.sub || payload.userId;
    
    return userId;
  } catch (e) {
    console.error('Token 파싱 실패:', e);
    return null;
  }
}

async function fetchDiaries() {
  
  const userId = getUserIdFromToken();
  
  if (!userId) {
    return;
  }
  
  if (!props.forestId) {
    return;
  }
  
  try {
    const apiUrl = `/mate/diary/${props.forestId}/month?year=${year.value}&month=${month.value}`;
    
    const res = await api.get(apiUrl);
    
    if (res.data && Array.isArray(res.data)) {
      diaryDates.value = res.data.map(entry => entry.createdAt.split('T')[0]);
    } else {
      diaryDates.value = [];
    }
  } catch (e) {
    console.error('Failed to fetch diaries:', e);
    console.error('Error response:', e.response?.data);
    console.error('Error status:', e.response?.status);
    diaryDates.value = [];
  }
}

watch([year, month], fetchDiaries)

onMounted(() => {
  fetchDiaries();
})

async function onDiaryClick(date) {
  
  const dateStr = `${year.value}-${String(month.value).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
  
  try {
    const apiUrl = `/mate/diary/${props.forestId}/date?date=${dateStr}`;
    
    const res = await api.get(apiUrl);
    
    emit('diary-click', {
      diaries: res.data,
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

function getWeekday(y, m, d) {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[new Date(y, m - 1, d).getDay()];
}
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
.back-img {    /* 페이지 뒤로가기 버튼 */
  position: absolute;
  top: -10px;
  left: -10px;
  width: 32px;
  height: 32px;
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
.calendar-day.has-diary {
  background: #ffffff8f;
  color: #3a5a40;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.calendar-day:hover {
  background: #b6d6b6;
  color: #2d3a2d;
}
</style>
  