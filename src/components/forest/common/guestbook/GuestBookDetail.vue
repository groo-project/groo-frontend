<template>
  <div class="guestbook-detail">
    <div class="top-bar">
      <img :src="previousIcon" class="back-button" @click="$emit('back')" alt="back" />
    </div>
    
    <div v-if="isLoading" class="loading">로딩 중...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="detail-content">
      <div class="content">{{ guestbookDetail.content }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import previousIcon from '@/icons/previous_icon2.png';

const props = defineProps({
  id: {
    type: Number,
    required: true
  }
});

const emit = defineEmits(['back']);

const guestbookDetail = ref({});
const isLoading = ref(true);
const error = ref(null);

const fetchGuestbookDetail = async () => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    error.value = "로그인이 필요합니다.";
    isLoading.value = false;
    return;
  }

  try {
    const response = await fetch(`http://localhost:8080/mailbox-detail/${props.id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("방명록 상세 정보를 가져오는 데 실패했습니다.");
    }

    const data = await response.json();
    guestbookDetail.value = data[0]; // 첫 번째 항목만 사용
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchGuestbookDetail();
});
</script>

<style scoped>
.guestbook-detail {
  padding: 20px;
  color: #fff;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.top-bar {
  display: flex;
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

.detail-content {
  background: rgba(255, 255, 255, 0.15);
  padding: 30px;
  border-radius: 8px;
  margin: 0 auto;
  width: 80%;
  max-width: 600px;
  backdrop-filter: blur(10px);
}

.content {
  font-size: 20px;
  line-height: 1.6;
  white-space: pre-wrap;
  text-align: left;
  color: #fff;
  word-break: break-word;
}
</style>
