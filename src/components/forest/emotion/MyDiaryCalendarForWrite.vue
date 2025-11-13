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
            'has-diary': hasDiary(date),
            'disabled': !isDateSelectable(date),
            'available': isDateSelectable(date) && !hasDiary(date)
          }"
          @click="handleDateClick(date)"
          :style="{ cursor: isDateSelectable(date) ? 'pointer' : 'not-allowed' }"
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

const alert = useAlertStore()

const auth = useAuthStore()
const diaryWriteStore = useDiaryWriteStore();
const forestId = auth.user?.forestId || '';

const emit = defineEmits(['close', 'new-diary-click'])

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

// 날짜가 선택 가능한지 확인 (오늘부터 2일 전까지)
function isDateSelectable(date) {
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

function handleDateClick(date) {
  // 선택 불가능한 날짜는 클릭 무시
  if (!isDateSelectable(date)) {
    return
  }
  
  // 일기가 있는 날을 클릭한 경우
  if (hasDiary(date)) {
    onExistingDiaryClick(date)
  } 
  // 일기가 없는 날을 클릭한 경우
  else {
    onNewDiaryClick(date)
  }
}

// 이미 일기가 작성된 날을 클릭했을 때 실행되는 함수
async function onExistingDiaryClick(date) {
  alert.show("해당 날짜에 이미 일기가 작성되었어요!")

  // 배포 시 제거
  onNewDiaryClick(date);
}

// 일기가 없는 날을 클릭했을 때 실행되는 함수
function onNewDiaryClick(date) {
  const dateStr = `${year.value}-${String(month.value).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
  
  // 새 일기 작성용 emit
  diaryWriteStore.setWriteDiaryDate(dateStr)
  emit('new-diary-click');
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

async function fetchDiaries() {
  const currentForestId = forestId || auth.user?.forestId;
  
  if (!currentForestId) {
    console.error('Forest ID not available');
    diaryDates.value = [];
    return;
  }
  
  try {
    const res = await api.get(
      `diaries/personal?forestId=${currentForestId}&year=${year.value}&month=${month.value}`);
    diaryDates.value = res.data.map(entry => entry.createdAt.split('T')[0]);
  } catch (e) {
    console.error('Failed to fetch diaries:', e);
    console.error('Error response:', e.response?.data);
    diaryDates.value = [];
  }
}

watch([year, month], fetchDiaries)
onMounted(fetchDiaries)
</script>

<style scoped>
.calendar-bg {
  width: 100%;
  height: 145%;
  min-width: 340px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  background: none;
  margin-top: 15px;
}
.back-img {
  position: absolute;
  top: 12px;
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

/* 이미 일기가 작성된 날짜 */
.calendar-day.has-diary {
  background: #ffffff8f;
  color: #3a5a40;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  opacity: 0.7;
  cursor: pointer;
}

.calendar-day.has-diary:hover {
  background: #e8f5e8;
  opacity: 0.8;
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