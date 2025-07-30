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
import { ref } from "vue";
import AlertModal from "./AlertModal.vue";

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
    const token = localStorage.getItem("accessToken");
    const forestId = localStorage.getItem("myRecentforestId");

    const response = await fetch(
      `http://localhost:8080/emotion-forest/${forestId}/name`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editingName.value,
        }),
      }
    );

    if (!response.ok) throw new Error("숲 이름 수정 실패");

    emit("update", editingName.value);
    isEditing.value = false;
  } catch (error) {
    console.error("숲 이름 수정 중 오류 발생:", error);
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
