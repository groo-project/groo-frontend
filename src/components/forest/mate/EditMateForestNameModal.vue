<template>
  <div v-if="isOpen" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>우정의 숲 이름 수정</h3>
        <button class="close-button" @click="$emit('close')">✕</button>
      </div>
      <div class="modal-body">
        <div class="input-section">
          <label for="forest-name" class="input-label">새로운 숲 이름</label>
          <input
            id="forest-name"
            v-model="editingName"
            type="text"
            class="forest-name-input"
            placeholder="숲 이름을 입력해주세요"
            @keyup.enter="handleSubmit"
            ref="nameInput"
          />
        </div>
        <div class="button-section">
          <button @click="$emit('close')" class="cancel-btn">취소</button>
          <button @click="handleSubmit" class="confirm-btn" :disabled="!editingName.trim() || editingName === currentName">
            수정하기
          </button>
        </div>
      </div>
    </div>
  </div>
  
  <AlertModal
    v-if="showAlert"
    :message="alertMessage"
    @close="showAlert = false"
  />
</template>

<script setup>
import { ref, watch, nextTick } from "vue";
import AlertModal from "@/components/common/AlertModal.vue";
import api from "@/lib/api";

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  currentName: {
    type: String,
    required: true,
  },
  forestId: {
    type: [String, Number],
    required: true,
  },
});

const emit = defineEmits(["close", "update"]);

const editingName = ref(props.currentName);
const nameInput = ref(null);
const showAlert = ref(false);
const alertMessage = ref("");

// 모달이 열릴 때마다 현재 이름으로 초기화
watch(() => props.isOpen, async (newValue) => {
  if (newValue) {
    editingName.value = props.currentName;
    // 다음 틱에서 input에 포커스
    await nextTick();
    nameInput.value?.focus();
  }
});

const handleSubmit = async () => {
  if (!editingName.value.trim() || editingName.value === props.currentName) {
    return;
  }

  try {
    console.log('=== 우정의 숲 이름 수정 시작 ===');
    console.log('Forest ID:', props.forestId);
    console.log('새로운 이름:', editingName.value);
    
    const response = await api.patch(`emotion-forest/${props.forestId}/name`, {
      name: editingName.value
    });
    
    if (response.status >= 200 && response.status < 300) {
      console.log('우정의 숲 이름 수정 성공!');
      
      emit("update", editingName.value);
      emit("close");
    } else {
      throw new Error(`숲 이름 수정 실패: ${response.status}`);
    }
  } catch (error) {
    console.error("=== 우정의 숲 이름 수정 실패 ===");
    console.error("Error:", error);
    console.error("Error message:", error.message);
    console.error("Error response:", error.response?.data);
    console.error("==========================");
    
    alertMessage.value = "숲 이름 수정에 실패했습니다.";
    showAlert.value = true;
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(218, 226, 182, 0.2);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease-in;
  backdrop-filter: blur(8px);
}

.modal-content {
  background: white;
  border-radius: 20px;
  padding: 0;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.4s ease-out;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 16px 24px;
  border-bottom: 1px solid #e0e0e0;
  background: #a5c0a7;
  color: white;
  border-radius: 20px 20px 0 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: rgb(58, 90, 64);
}

.close-button {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: white;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.2s;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.modal-body {
  padding: 24px;
}

.input-section {
  margin-bottom: 24px;
}

.input-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.forest-name-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.forest-name-input:focus {
  outline: none;
  border-color: #a5c0a7;
  box-shadow: 0 0 0 2px rgba(165, 192, 167, 0.3);
}

.forest-name-input::placeholder {
  color: #999;
}

.button-section {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.cancel-btn, .confirm-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.cancel-btn:hover {
  background: #e0e0e0;
}

.confirm-btn {
  background: #a5c0a7;
  color: white;
}

.confirm-btn:hover:not(:disabled) {
  background: #8fb392;
}

.confirm-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    transform: translateY(30px);
    opacity: 0;
  }
  to { 
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
