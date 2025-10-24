<template>
  <div class="invite-code-container">
    <div class="floating-items"> </div>
    <div class="invite-code-box">
      <div class="forest-symbol">
        <div class="tree-container">
          <span class="tree">🌳</span>
          <div class="animals">
            <span class="animal">🦊</span>
            <span class="animal">🦌</span>
            <span class="animal">🐰</span>
          </div>
        </div>
      </div>
      <h1 class="title">우리의 숲으로<br />놀러와요!</h1>
      <p class="subtitle">✨ 친구의 초대 코드를 입력해주세요 ✨</p>
      <div class="input-container">
        <div class="input-wrapper">
          <input
            v-model="inviteCode"
            type="text"
            class="code-input"
            placeholder="초대 코드 8자리"
            maxlength="8"
          />
          <div class="input-decoration"> </div>
        </div>
      </div>
      <button @click="handleSubmit" class="submit-button">
        <span class="button-text">입장하기</span>
        <span class="button-icon">🌳</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, getCurrentInstance } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth.js";
import { storeToRefs } from "pinia";
import api from "@/lib/api.js";
import { useAlertStore } from '@/stores/alert'

const alert = useAlertStore()

const router = useRouter();
const route = useRoute();
const inviteCode = ref("");
const { proxy } = getCurrentInstance();


const auth = useAuthStore();
// 반응형으로 꺼내기
const { accessToken } = storeToRefs(auth); 
const Token = computed(() => accessToken.value ?? null);

onMounted(() => {
  // URL 파라미터에서 inviteCode를 가져와서 설정
  if (route.params.inviteCode) {
    inviteCode.value = route.params.inviteCode;
  }

  auth.tryRefresh();
});

const handleSubmit = async () => {

  if (inviteCode.value.length === 16) {

    if (!Token.value) {
      alert.show("로그인이 필요합니다. 로그인 후 다시 시도해주세요.");
      router.push("/login");
      return;
    }

    try {
      
      // 초대 코드 검증 API 호출
      const response = await api.post(`mate/accept/${inviteCode.value}`);


      if (response.status >= 200 && response.status < 300) {
        
        if (response.data && response.data.forestId) {
          const mateForestId = response.data.forestId;
          
          // 초대 수락 성공 이벤트 발생 (다른 컴포넌트에서 감지)
          if (proxy?.emitter) {
            proxy.emitter.emit('invite-accepted', {
              forestId: mateForestId,
              inviteCode: inviteCode.value,
              timestamp: new Date().toISOString()
            });
          }
          
          router.push(`/forestmate/${mateForestId}`);
        } else {
          router.push("/");
        }
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {

      
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || "";
      const statusCode = error.response?.status;

      // HTTP 상태 코드 기반으로 에러 메시지 결정
      if (statusCode === 400 || statusCode === 409) {
        // 정원이 가득 찬 경우나 이미 사용된 초대 코드의 경우
        if (errorMessage.includes("full") || errorMessage.includes("capacity")) {
          alert.show("이 우정의 숲은 정원이 가득 찼습니다. 다른 우정의 숲에 참여해주세요.");
        } else if (errorMessage.includes("이미") || errorMessage.includes("already") || errorMessage.includes("중복") || errorMessage.includes("used")) {
          alert.show("이미 이 우정의 숲에 참여하고 있습니다.");
        } else if (errorMessage.includes("만료") || errorMessage.includes("expired") || errorMessage.includes("invalid")) {
          alert.show("초대가 만료되었거나 유효하지 않은 초대 코드입니다.");
        } else {
          alert.show("초대 수락에 실패했습니다. 다시 시도해주세요.");
        }
      } else if (statusCode === 404) {
        alert.show("유효하지 않은 초대 코드입니다. 다시 확인해주세요.");
      } else if (statusCode === 410) {
        alert.show("초대가 만료되었습니다. 새로운 초대 코드를 요청해주세요.");
      } else {
        // 기본 에러 메시지
        alert.show("초대 수락에 실패했습니다. 다시 시도해주세요.");
      }
    }
  } else {
    alert.show("초대 코드 8자리를 입력해주세요.")
  }
};
</script>

<style scoped>
.invite-code-container {
  padding-top: 40px;
  width: 90%;
  height: 90%;
  min-height: 90vh;
  margin: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: "Pretendard", sans-serif;
  position: relative;
  overflow: hidden;
}

.floating-items {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.float-item {
  position: absolute;
  font-size: 24px;
  opacity: 0.5;
  animation: floating 6s ease-in-out infinite;
}

.float-item:nth-child(1) {
  top: 15%;
  left: 15%;
  animation-delay: 0s;
}
.float-item:nth-child(2) {
  top: 25%;
  right: 20%;
  animation-delay: 1s;
}
.float-item:nth-child(3) {
  bottom: 20%;
  left: 20%;
  animation-delay: 2s;
}
.float-item:nth-child(4) {
  bottom: 30%;
  right: 25%;
  animation-delay: 3s;
}
.float-item:nth-child(5) {
  top: 40%;
  left: 30%;
  animation-delay: 4s;
}
.float-item:nth-child(6) {
  bottom: 40%;
  right: 15%;
  animation-delay: 5s;
}

.invite-code-box {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 30px;
  border-radius: 25px;
  width: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 15px 40px rgba(58, 90, 64, 0.3);
  position: relative;
  overflow: hidden;
  animation: bounceIn 1s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  border: 2px solid rgba(165, 192, 167, 0.3);
}

.forest-symbol {
  position: relative;
  width: 120px;
  height: 120px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.tree-container {
  position: relative;
  animation: gentle-bounce 3s ease-in-out infinite;
}

.tree {
  font-size: 60px;
  display: block;
  margin-bottom: 8px;
  filter: drop-shadow(0 3px 6px rgba(58, 90, 64, 0.3));
}

.animals {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
}

.animal {
  font-size: 24px;
  animation: peek 3s ease-in-out infinite;
}

.animal:nth-child(2) {
  animation-delay: 0.5s;
}

.animal:nth-child(3) {
  animation-delay: 1s;
}

.grass {
  display: flex;
  gap: 10px;
  margin-top: -20px;
}

.grass span {
  font-size: 24px;
  animation: wave 2s ease-in-out infinite;
}

.grass span:nth-child(2) {
  animation-delay: 0.3s;
}

.grass span:nth-child(3) {
  animation-delay: 0.6s;
}

.title {
  font-size: 28px;
  color: #3a5a40;
  margin-bottom: 12px;
  font-weight: 700;
  text-align: center;
  line-height: 1.4;
  animation: bounceIn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) 0.3s both;
}

.subtitle {
  font-size: 15px;
  color: #5c8374;
  margin-bottom: 25px;
  text-align: center;
  animation: bounceIn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) 0.5s both;
}

.input-container {
  width: 100%;
  margin-bottom: 35px;
  padding-right: 40px;
}

.input-wrapper {
  position: relative;
  width: 100%;
}

.code-input {
  width: 100%;
  padding: 15px;
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid #a5c0a7;
  border-radius: 15px;
  font-size: 18px;
  text-align: center;
  letter-spacing: 3px;
  color: #3a5a40;
  transition: all 0.3s ease;
}

.code-input:focus {
  outline: none;
  border-color: #3a5a40;
  box-shadow: 0 0 0 4px rgba(58, 90, 64, 0.1);
  transform: translateY(-2px);
}

.code-input::placeholder {
  color: #a5c0a7;
  opacity: 0.7;
}

.input-decoration {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  animation: bounce 2s infinite;
}

.flower {
  font-size: 24px;
}

.submit-button {
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
  box-shadow: 0 3px 10px rgba(58, 90, 64, 0.3);
}

.submit-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(58, 90, 64, 0.4);
  background: linear-gradient(135deg, #2c4632 0%, #1a2a1e 100%);
}

.submit-button:active {
  transform: translateY(1px);
}

.bottom-decoration {
  margin-top: 25px;
  display: flex;
  gap: 15px;
}

.bottom-decoration span {
  font-size: 24px;
  animation: wave 2s ease-in-out infinite;
}

.bottom-decoration span:nth-child(2) {
  animation-delay: 0.3s;
}

.bottom-decoration span:nth-child(3) {
  animation-delay: 0.6s;
}

@keyframes floating {
  0%,
  100% {
    transform: translate(0, 0) rotate(0deg);
  }
  50% {
    transform: translate(10px, -20px) rotate(5deg);
  }
}

@keyframes gentle-bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes peek {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-5px) scale(1.1);
  }
}

@keyframes wave {
  0%,
  100% {
    transform: rotate(-5deg);
  }
  50% {
    transform: rotate(5deg);
  }
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.1);
  }
  80% {
    opacity: 1;
    transform: scale(0.89);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* 반응형 디자인 */
@media (max-width: 480px) {
  .invite-code-box {
    width: 90%;
    padding: 30px 20px;
  }

  .forest-symbol {
    width: 140px;
    height: 140px;
  }

  .tree {
    font-size: 70px;
  }

  .animals {
    bottom: 15px;
  }

  .animal {
    font-size: 20px;
  }

  .title {
    font-size: 28px;
  }

  .subtitle {
    font-size: 15px;
  }

  .code-input {
    font-size: 20px;
    padding: 18px;
  }

  .float-item {
    font-size: 20px;
  }

  .bottom-decoration span {
    font-size: 20px;
  }
}


</style>
