<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h3>정말 탈퇴하시겠습니까?</h3>
      </div>
      <div class="modal-body">
        <p>탈퇴하시면 이 우정의 숲에서 영구적으로 나가게 됩니다.</p>
      </div>
      <div class="modal-buttons">
        <button @click="$emit('close')" class="cancel-btn">취소</button>
        <button @click="handleWithdraw" class="confirm-btn">탈퇴하기</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from "vue-router";
import { ref, computed, getCurrentInstance } from "vue";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { useAlertStore } from '@/stores/alert'

const alert = useAlertStore()

const route = useRoute();
const authStore = useAuthStore();
const { proxy } = getCurrentInstance();


const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
});

const isOpen = computed(() => props.isOpen);

const emit = defineEmits(["close"]);

const leaving = ref(false);

// 탈퇴 처리
const handleWithdraw = async () => {
  // 중복 요청 방지
  if (leaving.value) return;
  
  leaving.value = true;
  
  try {
    const mateForestId = route.params.id;
    
    if (!mateForestId) {
      throw new Error("우정의 숲 ID를 찾을 수 없습니다.");
    }

    // 탈퇴 API 호출
    await api.delete(`mate/quit?forestId=${mateForestId}`);
    
    // 성공 메시지 표시
    alert.show("우정의 숲에서 탈퇴되었습니다.")

    // 먼저 현재 사용자의 리소스 정리 (이벤트 전송 전)
    if (proxy?.emitter) {
      // SSE 연결 정리 이벤트 발생 (자신에게 먼저)
      proxy.emitter.emit('cleanup-sse-connection', {
        forestId: mateForestId,
        userId: authStore.user?.userId
      });
    }

    // 다른 사용자들에게 탈퇴 이벤트 전송 (혼자 남은 경우 제외)
    // 탈퇴 후 남은 멤버가 있는지 확인
    const remainingMembers = forestMembers.value.filter(member => 
      member.userId !== authStore.user?.userId
    );

    // 다른 사용자가 남아있는 경우에만 이벤트 전송
    if (remainingMembers.length > 0) {
      setTimeout(() => {
        if (proxy?.emitter) {
          proxy.emitter.emit('user-withdrawn', {
            forestId: mateForestId,
            userId: authStore.user?.userId,
            nickname: authStore.user?.nickname,
            timestamp: new Date().toISOString()
          });
        }
      }, 100); // 100ms 후 이벤트 전송
    } 
    
    // 강제 페이지 이동 (window.location 사용)
    // if (userForestId.value) {
    //   window.location.href = `/forest-detail/${userForestId.value}`;
    // } else {
    //   window.location.href = '/';
    // }
    
  } catch (error) {
    alert.show("탈퇴 처리 중 오류가 발생했습니다.")
  } finally {
    leaving.value = false;
    emit("close");
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
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 2rem;
  border-radius: 20px;
  width: 90%;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-header h3 {
  color: #3a5a40;
  font-size: 1.5rem;
  margin: 0 0 1rem 0;
}

.modal-body p {
  color: #666;
  margin: 1rem 0;
  line-height: 1.5;
}

.modal-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.cancel-btn,
.confirm-btn {
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.cancel-btn {
  background: #e0e0e0;
  color: #666;
}

.cancel-btn:hover {
  background: #d0d0d0;
}

.confirm-btn {
  background: #ff6b6b;
  color: white;
}

.confirm-btn:hover {
  background: #ff5252;
}
</style>
