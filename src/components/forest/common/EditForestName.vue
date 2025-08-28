<template>
  <div class="forest-name-bubble" v-if="isEditing">
    <div class="button-group">
      <button class="edit-btn" @click="handleSubmit">확인</button>
    </div>
    <input
      type="text"
      v-model="editingName"
      ref="nameInput"
      @keyup.enter="handleSubmit"
      @keyup.esc="cancelEdit"
    />
    <div class="button-group">
      <button class="edit-btn" @click="handleSubmit">수정</button>
    </div>
  </div>
  <div class="forest-name-bubble" v-else @click="startEdit">
    <button class="edit-btn">변경하기</button>
    <span class="forest-name">{{ currentName }}</span>
  </div>
  <AlertModal
    v-if="showAlert"
    :message="alertMessage"
    @close="showAlert = false"
  />
</template>

<script setup>
import { ref, computed } from "vue";
import AlertModal from "@/components/common/AlertModal.vue";
import { useAuthStore } from "@/stores/auth";
import api from "@/lib/api";

const auth = useAuthStore();

// computed를 사용하여 반응형으로 만들기
const user = computed(() => auth.user);
const forestId = computed(() => auth.user?.forestId);

// user가 undefined인지 확인
console.log('Auth store:', auth);
console.log('Auth user:', auth.user);
console.log('Auth user value:', user.value);
console.log('Forest ID computed:', forestId.value);

const props = defineProps({
  currentName: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["update"]);

const isEditing = ref(false);
const editingName = ref(props.currentName);
const nameInput = ref(null);
const showAlert = ref(false);
const alertMessage = ref("");

const startEdit = () => {
  isEditing.value = true;
  editingName.value = props.currentName;
  setTimeout(() => {
    nameInput.value?.focus();
  }, 0);
};

const cancelEdit = () => {
  isEditing.value = false;
  editingName.value = props.currentName;
};

const handleSubmit = async () => {
  if (!editingName.value.trim() || editingName.value === props.currentName) {
    cancelEdit();
    return;
  }

  try {

    if (!forestId.value) {
      throw new Error('사용자 정보 또는 숲 ID를 찾을 수 없습니다.');
    }
    
    const currentForestId = forestId.value;
    console.log('Forest ID:', currentForestId);
    console.log('새로운 이름:', editingName.value);
    
    // API 요청 본문을 올바르게 전송
    const response = await api.patch(`emotion-forest/${currentForestId}/name`, {
      name: editingName.value
    });
    
    if (response.status >= 200 && response.status < 300) {
      console.log('숲 이름 수정 성공!');
      
      emit("update", editingName.value);
      isEditing.value = false;
    } else {
      throw new Error(`숲 이름 수정 실패: ${response.status}`);
    }
  } catch (error) {
    console.error("=== 숲 이름 수정 실패 ===");
    console.error("Error:", error);
    console.error("Error message:", error.message);
    console.error("Error response:", error.response?.data);
    console.error("==========================");
    
    alertMessage.value = "숲 이름 수정에 실패했습니다.";
    showAlert.value = true;
    cancelEdit();
  }
};
</script>

<style scoped>
.forest-name-bubble {
  position: absolute;
  bottom: 100%;
  left: 15px;
  transform: translateX(-50%);
  background: rgba(240, 248, 240, 0.95);
  opacity: 0.7;
  padding: 12px 12px 14px 12px;
  border-radius: 12px;
  min-width: 100px;
  max-width: 120px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
  margin-bottom: 10px;
  opacity: 1;
}

.forest-name-bubble::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: -10px;
  transform: translateX(-50%);
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 10px solid rgba(240, 248, 240, 0.95);
}

.forest-name-bubble::before {
  content: "";
  position: absolute;
  left: 50%;
  bottom: -108px;
  transform: translateX(-50%);
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid rgba(240, 248, 240, 0.3);
}

.forest-name {
  color: #333;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90px;
  padding: 3px 8px;
}

input {
  width: calc(100% - 16px);
  padding: 4px 6px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  background: rgba(11, 87, 138, 0.33);
  color: #fff;
  text-align: center;
}

input:focus {
  outline: none;
  background: rgba(11, 87, 138, 0.45);
}

.edit-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  background: rgba(11, 87, 138, 0.33);
  color: white;
  transition: all 0.2s ease;
}

.edit-btn:hover {
  background: rgba(11, 87, 138, 0.45);
}

.button-group {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}
</style>
