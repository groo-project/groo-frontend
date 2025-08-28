<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h2>우정의 숲 목록</h2>
        <button class="close-button" @click="$emit('close')">닫기</button>
      </div>
      <div class="forest-grid">
        <div
          v-for="forest in forests"
          :key="forest.forestId"
          class="forest-card"
          @click="handleForestClick(forest.forestId)"
        >
          <img
            :src="forest.image"
            :alt="forest.forestName"
            class="forest-image"
          />
          <div class="forest-info">
            <div class="forest-name">{{ forest.forestName }}</div>
            <div class="forest-members">
              <span class="member-icon">👥</span>
              <span class="member-count">
                {{ forest.memberCount }}명의 친구들
              </span>
            </div>
          </div>
        </div>
        <div
          class="forest-card add-forest-card"
          @click="showCreateForestModal = true"
        >
          <div class="add-forest-content">
            <div class="add-forest-text">새로운 숲 만들기</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-if="showCreateForestModal" class="modal-overlay">
    <div class="create-forest-modal">
      <div class="modal-header">
        <h2>새로운 우정의 숲 만들기</h2>
        <button class="close-button" @click="showCreateForestModal = false"
          >닫기</button
        >
      </div>
      <div class="create-forest-content">
        <div class="input-wrapper">
          <input
            v-model="newForestName"
            type="text"
            placeholder="숲 이름을 입력해주세요"
            class="forest-name-input"
            @keyup.enter="createNewForest"
          />
          <!-- <span class="input-icon">🌳</span> -->
        </div>
        <button class="create-button" @click="createNewForest">
          <span>만들기</span>
        </button>
      </div>
    </div>
  </div>

  <AlertModal
    v-if="showAlert"
    :message="alertMessage"
    :duration="2000"
    @close="showAlert = false"
  />
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import forestImage from "@/icons/forest1.png";
import AlertModal from "@/components/common/AlertModal.vue";
import api from "@/lib/api.js";
import { useAuthStore } from "@/stores/auth.js";
import { useMateForestStore } from "@/stores/mateForest";

const authStore = useAuthStore();
const mateForestStore = useMateForestStore();
const token = authStore.accessToken;

const router = useRouter();
const route = useRoute();
const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(["close", "openCreateForest"]);
const forests = ref([]);
const showCreateForestModal = ref(false);
const newForestName = ref("");
const showAlert = ref(false);
const alertMessage = ref("");

const getForestList = async () => {
  try {

    const response = await api.get(`/mate/forests`);

    
    const data = response.data;

    
    // 서버 응답 형태가 배열이라고 가정
    const list = Array.isArray(data) ? data
               : Array.isArray(data?.forests) ? data.forests
               : [];


    
    forests.value = list.map(forest => ({
      ...forest,
      image: forestImage,
      memberCount: forest.memberCount || 0
    }));



  } catch (error) {
    console.error("Error fetching forest list:", error);
    console.log("Error details:", error.response?.data);
    alertMessage.value = "숲 목록을 불러오는데 실패했습니다.";
    showAlert.value = true;
  }
};

const createNewForest = async () => {
  if (!newForestName.value.trim()) {
    alertMessage.value = "숲 이름을 입력해주세요.";
    showAlert.value = true;
    return;
  }

  try {
    console.log("Creating forest with name:", newForestName.value);
    
    const response = await api.post("/mate/forests/new", {
      forestName: newForestName.value,
    });

    console.log("API Response:", response);
    console.log("New forest created:", response.data);

    showCreateForestModal.value = false;
    newForestName.value = "";
    alertMessage.value = "새로운 숲이 생성되었습니다!";
    showAlert.value = true;

    await getForestList();
  } catch (error) {
    console.error("Error creating forest:", error);
    console.log("Error details:", error.response?.data);
    alertMessage.value = "숲 생성에 실패했습니다. 다시 시도해주세요.";
    showAlert.value = true;
  }
};

// 멤버 수 요청 함수
const requestMemberCount = (forestId) => {
  emit("getMemberCount", forestId);
};

const handleForestClick = (forestId) => {
  
  // auth.user.forestId는 개인 숲 ID이므로 덮어쓰지 않음
  // 우정의 숲 ID는 route.params.id로 전달됨
  mateForestStore.setCurrentMateForestId(forestId);
  emit("close");
  console.log("Navigating to:", `/forestmate/${forestId}`);
  router.push(`/forestmate/${forestId}`);
};

watch(
  () => props.isOpen,
  (newValue) => {
    if (newValue) {
      getForestList();
    }
  }
);

onMounted(() => {
  if (props.isOpen) {
    getForestList();
  }
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(218, 226, 182, 0.2);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: #fdfbf6;
  border-radius: 30px;
  width: 80%;
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(58, 90, 64, 0.2);
  animation: floatIn 0.5s ease-out;
  border: 3px solid #a5c0a7;
}

.modal-header {
  padding: 20px;
  background: linear-gradient(135deg, #dae2b6 0%, #a5c0a7 100%);
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 27px 27px 0 0;
}

.header-decoration {
  display: flex;
  gap: 15px;
  position: absolute;
  left: 20px;
}

.deco-item {
  font-size: 24px;
  animation: bounce 2s infinite;
}

.deco-item:nth-child(2) {
  animation-delay: 0.3s;
}

.deco-item:nth-child(3) {
  animation-delay: 0.6s;
}

.modal-header h2 {
  color: #3a5a40;
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.close-button {
  position: absolute;
  right: 20px;
  background: rgba(58, 90, 64, 0.1);
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 14px;
  color: #3a5a40;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: rgba(58, 90, 64, 0.15);
  transform: translateY(-1px);
}

.forest-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 24px;
  padding: 24px;
}

.forest-card {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(58, 90, 64, 0.1);
  transition: all 0.3s ease;
  aspect-ratio: 1;
  cursor: pointer;
  background: white;
}

.forest-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 25px rgba(58, 90, 64, 0.2);
}

.forest-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.forest-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 15px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(5px);
  border-top: 2px solid rgba(165, 192, 167, 0.3);
}

.forest-name {
  color: #3a5a40;
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 5px;
}

.forest-members {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  color: #5c8374;
}

.add-forest-card {
  border: 2px dashed #a5c0a7;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(218, 226, 182, 0.2);
  transition: all 0.3s ease;
}

.add-forest-card:hover {
  background: rgba(218, 226, 182, 0.4);
  border-style: solid;
}

.add-forest-content {
  text-align: center;
  color: #3a5a40;
}

.plus-icon {
  font-size: 40px;
  margin-bottom: 10px;
  animation: sparkle 2s infinite;
}

.add-forest-text {
  font-size: 16px;
  font-weight: 600;
}

.create-forest-modal {
  background: #fdfbf6;
  border-radius: 30px;
  width: 90%;
  max-width: 400px;
  border: 3px solid #a5c0a7;
  animation: floatIn 0.5s ease-out;
}

.create-forest-content {
  padding: 30px;
}

.input-wrapper {
  position: relative;
  margin-bottom: 20px;
}

.forest-name-input {
  width: 78%;
  padding: 15px 20px;
  padding-right: 50px;
  border: 2px solid #a5c0a7;
  border-radius: 15px;
  font-size: 16px;
  color: #3a5a40;
  background: white;
  transition: all 0.3s ease;
}

.forest-name-input:focus {
  outline: none;
  border-color: #3a5a40;
  box-shadow: 0 0 0 4px rgba(58, 90, 64, 0.1);
}

.input-icon {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 20px;
}

.create-button {
  width: 100%;
  padding: 15px;
  background: linear-gradient(135deg, #3a5a40 0%, #2c4632 100%);
  color: white;
  border: none;
  border-radius: 15px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.create-button:hover {
  transform: translateY(-2px);
  background: linear-gradient(135deg, #2c4632 0%, #1a2a1e 100%);
}

@keyframes floatIn {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

@keyframes sparkle {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.1);
  }
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 20px;
  }

  .forest-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 16px;
    padding: 16px;
  }

  .forest-name {
    font-size: 14px;
  }

  .forest-members {
    font-size: 12px;
  }
}
</style>
