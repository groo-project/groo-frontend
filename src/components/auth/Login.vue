<script setup>
import { ref } from "vue";
import { useRouter , useRoute } from "vue-router";
import AlertModal from "@/components/common/AlertModal.vue";
import api from "@/lib/api"; // API 호출을 위한 axios 인스턴스
import { useAuthStore } from "@/stores/auth"; // Pinia 스토어 가져오기



const email = ref("");
const password = ref("");
const router = useRouter();
const route = useRoute();
const showAlert = ref(false);
const alertMessage = ref("");
const auth = useAuthStore(); 
const loading = ref(false);           // ✅ 중복 제출 방지


const handleLogin = async (e) => {
  if (loading.value) return;          // ✅ 가드
  loading.value = true;
  // e.preventDefault();

  try {

    // 1) Pinia 스토어 통해 로그인 (RT는 HttpOnly 쿠키, AT는 Pinia 메모리)
    await auth.login({ email: email.value, password: password.value });

    // 2) 성공 메시지
    alertMessage.value = "로그인 성공! 환영합니다.🌿";
    showAlert.value = true;
    // 2.5) Pinia 스토어에서 AT 가져오기
    
    // 3) 이동 우선순위
    // (1) 원래 가려던 페이지가 있으면 거기로
    const redirect = route.query.redirect;
    if (redirect) {
      setTimeout(() => router.push(redirect), 600);
      return;
    }

    // // (2) 보관된 초대코드가 있으면 검증 시도 → 성공 시 홈으로
    // const pendingInviteCode = localStorage.getItem("pendingInviteCode");
    // if (pendingInviteCode) {
    //   try {
    //     await api.post("/mate/invite/verify");
    //     // localStorage.removeItem("pendingInviteCode");
    //     setTimeout(() => router.push("/"), 600); // "/"는 BackgroundImage로 리다이렉트됨
    //     return;
    //   } catch (e) {
    //     console.error("초대 코드 검증 실패:", e);
    //     // 실패하면 아래 myforest 로직으로 계속 진행
    //   }
    // }

    // (3) 내 숲 목록에서 최근 숲으로 이동
    try {
      const { data } = await api.get("/myforest");
      const forestId = data?.[0]?.id;
    
      // 숲이 있다면 해당 숲으로 이동
      if (forestId) {
        auth.$patch(state => {
          state.user.forestId = forestId;
        })
        setTimeout(
          () => router.push({ name: "ForestDetail", params: { forestId } }),
          600
        );
        return;
      } else {
        // 예시: 홈으로 이동하거나, 안내 메시지 표시
        setTimeout(() => router.push("/"), 600);
        // 또는
        alertMessage.value = "접근 가능한 숲이 없습니다.";
        showAlert.value = true;
      }
          } catch (e) {
      console.error("숲 정보 불러오기 실패:", e);
    }

    // (4) 기본 홈
    setTimeout(() => router.push({ name: "ForestMate", params: { id: forestId } }), 600);

  } catch (e) {
    console.error('로그인 에러 상세:', e);
    
    if (e.response?.status === 401) {
      alertMessage.value = "아이디 또는 비밀번호를 확인해 주세요.";
    } else if (e.response?.status === 500) {
      alertMessage.value = "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    } else if (e.message === 'Network Error') {
      alertMessage.value = "서버에 연결할 수 없습니다. 서버 상태를 확인해주세요.";
    } else {
      alertMessage.value = `로그인 실패: ${e.message || '알 수 없는 오류'}`;
    }
    
    showAlert.value = true;
  }
  finally {
    // 입력 필드 초기화
    // email.value = "";
    password.value = "";
    loading.value = false; 
  }
  
};
</script>

<template>
  <div class="login-container">
    <div class="login-box">
      <img src="/logo-icon.png" alt="Logo" class="logo" />
      <form class="login-form" @submit.prevent="handleLogin">
        <label for="email">이메일</label>
        <input
          type="email"
          id="email"
          v-model="email"
          placeholder="이메일을 입력하세요"
        />

        <label for="password">비밀번호</label>
        <input
          type="password"
          id="password"
          v-model="password"
          placeholder="비밀번호를 입력하세요"
        />

        <!-- <div class="remember-me">
          <input type="checkbox" id="remember-me" />
          <label for="remember-me">로그인 유지</label>
        </div> -->

        <button type="submit" class="login-button">로그인</button>
      </form>

      <div class="links">
        <a href="#" class="find-password">비밀번호 찾기</a>
        <router-link to="/signup" class="signup">회원가입</router-link>
      </div>

      <!-- <div class="social-login">
        <span>또는</span>
        <div class="social-icons">
          <img src="/kakao-icon.png" alt="Kakao" />
          <img src="/naver-icon.png" alt="Naver" />
          <img src="/google-icon.png" alt="Google" />
        </div>
      </div> -->
    </div>
    <AlertModal 
      v-if="showAlert" 
      :message="alertMessage"
      @close="showAlert = false"
    />
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;
}

.login-box {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 16px;
  padding: 40px;
  width: 360px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.logo {
  width: 150px;
  height: auto;
  margin-bottom: 20px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.login-form label {
  font-size: 14px;
  color: #fff;
  text-align: left;
}

.login-form input {
  padding: 10px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.35);
  color: #3a5a40;
  font-size: 14px;
}

.login-form input::placeholder {
  color: rgba(58, 90, 64, 0.7);
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #fff;
}

.login-button {
  padding: 12px;
  background: rgba(255, 255, 255, 0.35);
  border: none;
  border-radius: 8px;
  color: #3a5a40;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}

.login-button:hover {
  background: rgba(255, 255, 255, 0.55);
}

.links {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
  font-size: 14px;
}

.links a {
  color: #fff;
  text-decoration: none;
}

.links a:hover {
  text-decoration: underline;
}

.social-login {
  margin-top: 24px;
}

.social-login span {
  font-size: 14px;
  color: #fff;
}

.social-icons {
  display: flex;
  justify-content: center;
  gap: 50px;
  margin-top: 12px;
}

.social-icons img {
  width: 40px;
  height: 40px;
  cursor: pointer;
  border-radius: 50%;
  transition: transform 0.2s;
}

.social-icons img:hover {
  transform: scale(1.1);
}
</style>
