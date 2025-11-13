<template>
    <div class="calendar-bg">
      <img
        :src="backIcon"
        alt="뒤로가기"
        class="back-img"
        @click="emit('close')"
      />
      <div class="calendar-title">나의 감정 일기 기록</div>
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
              'has-diary': getDiaryDataByDate(date) !== null,
              'needs-item-selection': getDiaryDataByDate(date)?.itemSelected === false
              }"
            @click="getDiaryDataByDate(date) && onDiaryClick(date)"
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
import api from '@/lib/api'
import { useAuthStore } from '@/stores/auth'  

const auth = useAuthStore()
const forestId = auth.user?.forestId || '';

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

const diaryDateIdMap = ref(new Map())

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
  
  // forestId가 없으면 auth에서 다시 가져오기
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

    const map = new Map();
    res.data.forEach(entry => {
      const dateKey = entry.createdAt.split('T')[0];
      map.set(dateKey, {
        diaryId: entry.diaryId,
        itemSelected: entry.itemSelected
      });
    });
    diaryDateIdMap.value = map;

  } catch (e) {
    console.error('Failed to fetch diaries:', e);
    console.error('Error response:', e.response?.data);
    diaryDates.value = [];
  }
}

watch([year, month], fetchDiaries)
onMounted(fetchDiaries)

const getDiaryDataByDate = (date) => {
  const d = `${year.value}-${String(month.value).padStart(2, '0')}-${String(date).padStart(2, '0')}`
  return diaryDateIdMap.value.get(d) || null
}

async function onDiaryClick(date) {

const diaryId = getDiaryDataByDate(date).diaryId;
  
const currentForestId = forestId || auth.user?.forestId;
  
if (!diaryId || !currentForestId) return;
  
  try {
    const res = await api.get(
      `diaries/personal/detail?diaryId=${diaryId}`);

    emit('diary-click', {
      diaries: res.data,
      year: year.value,
      month: month.value,
      day: date
    });
  } catch (e) {
    alert.show("일기 상세 정보를 불러오지 못했어요! 잠시 후 다시 시도해 주세요.");
  }
}
</script>

<style scoped>
.calendar-bg {
  width: 100%;
  height: 70%;
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
  top: 27px;
  left: 12px;
  width: 36px;
  height: 36px;
  cursor: pointer;
  z-index: 10;
}
.calendar-title {   /* 우리의 우정 일기 기록 */
  margin-top: 0px;
  margin-bottom: 0;
  text-align: center;
  font-size: 1.9rem;
  font-weight: 600;
  color: #fff;
  letter-spacing: -1px;
  top: 123px;
  position: relative;
}
.calendar-content-box {     /* 뒤에 흰색 배경 */
  background: rgba(255,255,255,0.4);
  border-radius: 30px;
  padding: 8px 32px 24px 20px;
  margin-top: 60px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.04);
  display: flex;
  flex-direction: column;
  align-items: center;
  top: 123px;
  position: relative;
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
  z-index: 1;
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
.calendar-day:hover {
  background: #b6d6b6;
  color: #2d3a2d;
}
</style>
