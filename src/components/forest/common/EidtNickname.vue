<template>
  <div class="forest-name-bubble">
    <input
      type="text"
      v-model="newNickname"
      ref="nameInput"
      @keyup.enter="handleSubmit"
    />
    <div class="button-group">
      <button class="edit-btn" @click="handleSubmit">수정하기</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import api from "@/lib/api";

const auth = useAuthStore();

const props = defineProps({
  currentName: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["nicknameUpdated", "showAlert"]);

const newNickname = ref(props.currentName);
const nameInput = ref(null);

// 컴포넌트가 뜨면 input에 자동 포커스
onMounted(() => {
  nameInput.value?.focus();
});

const handleSubmit = async () => {
  if (!newNickname.value.trim() || newNickname.value === props.currentName) {
    emit("showAlert", "닉네임이 그대로에요!")
    return;
  }

  try {

    const response = await api.patch(`/user/nickname`, {
      nickname: newNickname.value,
    });

    if (response.status >= 200 && response.status < 300) {
      emit("nicknameUpdated", newNickname.value);

      auth.user.nickname = newNickname.value;

      emit("showAlert", "닉네임 변경이 완료되었습니다!")
    } else {
      emit("showAlert", "닉네임 변경에 실패했습니다! 잠시 후 다시 시도해 주세요.")
      throw new Error(`숲 이름 수정 실패: ${response.status}`);
    }
  } catch (error) {
    newNickname.value = props.currentName; // 실패 시 원래 이름 복원
    if (error.response.data.code == "U003") {
      emit("showAlert", error.response.data.message);
    } else {
      emit("showAlert", "닉네임 변경에 실패했습니다! 잠시 후 다시 시도해 주세요.")
    }
  }
};
</script>

<style scoped>
.forest-name-bubble {
  top: 100%;
  background: rgba(240, 248, 240, 0.95);
  padding: 20px;
  border-radius: 12px;
  min-width: 220px;
  max-width: 220px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  text-align: center;
  margin-top: 12px;
}

.forest-name-bubble::after {
  content: "";
  position: absolute;
  top: -8px;         /* 위쪽으로 배치 */
  left: 5px;         /* 좌측에서 20px 떨어진 위치 */
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 10px solid rgba(240, 248, 240, 0.95);
}

input {
  width: 80%;
  padding: 10px 10px;
  border: none;
  border-radius: 4px;
  font-size: 20px;
  font-weight: 500;
  background: rgba(11, 87, 138, 0.33);
  color: #fff;
  text-align: center;
}

input:focus {
  outline: none;
  background: rgba(11, 87, 138, 0.45);
}

.edit-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 400;
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
}
</style>
