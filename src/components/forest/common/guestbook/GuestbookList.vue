<!-- filepath: d:\Github\be14-4th-x1-GROO-FE\src\components\GuestBookList.vue -->
<template>
  <div class="guestbook-list">
    <div class="top-bar">
      <img :src="previousIcon" class="back-button" @click="$emit('back')" alt="back" />
      <button class="write-button" @click="showWriteForm = true">
        <img :src="editIcon" />
      </button>
    </div>
    <WriteGuestbook 
      v-if="showWriteForm"
      @back="showWriteForm = false"
      @submit="handleSubmit"
    />
    <div v-else>
      <div v-if="isLoading" class="loading">로딩 중...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <ul v-else>
        <li 
          v-for="entry in guestbookEntries" 
          :key="entry.id" 
          class="guestbook-entry"
          @click="handleEntryClick(entry.id)"
        >
          <div>
            💌 {{ formatDate(entry.createdAt) }}의 편지
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import editIcon from '@/icons/edit_icon.png'
import previousIcon from '@/icons/previous_icon2.png'
import WriteGuestbook from '@/components/forest/common/guestbook/WriteGuestbook.vue'

const emit = defineEmits(['back', 'show-detail']);

const showWriteForm = ref(false);
const guestbookEntries = ref([]); // 방명록 데이터를 저장할 배열
const isLoading = ref(true); // 로딩 상태
const error = ref(null); // 에러 메시지

const handleEntryClick = (id) => {
  console.log('Entry clicked:', id); // 디버깅용
  emit('show-detail', id);
};

const fetchGuestbookEntries = async () => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    error.value = "로그인이 필요합니다.";
    isLoading.value = false;
    return;
  }

  try {
    // forestId 필요 일단 1로 고정
    const response = await fetch("http://localhost:8080/mailbox-lists/1", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("방명록 데이터를 가져오는 데 실패했습니다.");
    }

    guestbookEntries.value = await response.json();
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
};

// 날짜 포맷 함수
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear().toString().slice(2); // 25년 형식
  const month = date.getMonth() + 1; // 월 (0부터 시작하므로 +1)
  const day = date.getDate(); // 일
  return `${year}년 ${month}월 ${day}일`;
};

const handleSubmit = (content) => {
  showWriteForm.value = false;
  fetchGuestbookEntries(); // 방명록 목록 새로고침
};

onMounted(() => {
  fetchGuestbookEntries();
});
</script>

<style scoped>
.guestbook-list {
  padding: 20px;
  color: #fff;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.back-button {
  width: 24px;
  height: 24px;
  cursor: pointer;
}

.loading,
.error {
  text-align: center;
  font-size: 18px;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.guestbook-entry {
  background: rgba(255, 255, 255, 0.15);
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60px;
  text-align: center;
  font-size: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.guestbook-entry:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.write-button {
  background: none;
  border: none;
  cursor: pointer;
}

.write-button img {
  width: 24px;
  height: 24px;
}
</style>