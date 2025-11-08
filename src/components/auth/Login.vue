<script setup>
import { ref, onMounted } from "vue";
import { useRouter , useRoute } from "vue-router";
import api from "@/lib/api"; // API 호출을 위한 axios 인스턴스
import { useAuthStore } from "@/stores/auth"; // Pinia 스토어 가져오기
import { useAlertStore } from '@/stores/alert'
import { useGoogleSignIn } from "@/composables/useGoogleSignIn";
import { useMeta } from 'vue-meta';

useMeta({
  title: 'GRRO 로그인 | 감성 다이어리 서비스 그루 시작하기',

  meta: [
    {
      name: 'description',
      content: '감성 다이어리 서비스 그루에 로그인하여 개인 숲 혹은 공유 숲을 꾸며보세요.'
    },
    {
      name: 'robots',
      content: 'noindex, follow'
    }
  ]
})

const email = ref("");
const password = ref("");
const router = useRouter();
const route = useRoute();
const auth = useAuthStore(); 
const alert = useAlertStore()
const loading = ref(false);           // 중복 제출 방지
const googleBtn = ref(null); // Google 로그인 버튼

// 탈퇴 완료 알림 체크
onMounted(() => {
  if (route.query.withdrawn === "true") {
    alert.show("계정이 성공적으로 탈퇴되었습니다.");
    
    // 알림 표시 후 URL에서 쿼리 파라미터 제거 (새로고침 시 중복 알림 방지)
    // router.replace 대신 history.replaceState 사용하여 화면 깜빡임 방지
    window.history.replaceState({}, '', '/login');
  }
});

const handleLogin = async (e) => {
  if (loading.value) return;          // 가드
  loading.value = true;
  // e.preventDefault();
  if (!password.value) return;

  try {

    // 1) Pinia 스토어 통해 로그인 (RT는 HttpOnly 쿠키, AT는 Pinia 메모리)
    await auth.login({ email: email.value, password: password.value });

    // 2) 성공 메시지
    alert.show('로그인 성공! 환영합니다.🌿')
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
      const { data } = await api.get("myforest");
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
        alert.show('접근 가능한 숲이 없습니다.')
      }
          } catch (e) {
      console.error("숲 정보 불러오기 실패:", e);
    }

    // (4) 기본 홈
    setTimeout(() => router.push({ name: "ForestMate", params: { id: forestId } }), 600);

  } catch (e) {
    console.error('로그인 에러 상세:', e);
    
    if (e.response?.status === 401) {
      alert.show('아이디 또는 비밀번호를 확인해 주세요.')
    } else if (e.response?.status === 500) {
      alert.show('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } else if (e.message === 'Network Error') {
      alert.show('서버에 연결할 수 없습니다. 서버 상태를 확인해주세요.')
    } else {
      alert.show(`로그인 실패: ${e.message || '알 수 없는 오류'}`)
    }
  }
  finally {
    // 입력 필드 초기화
    // email.value = "";
    password.value = "";
    loading.value = false; 
  }
  
};

//  구글 ID 토큰 콜백 → 백엔드로 전달 → 우리 JWT 수신
async function handleGoogleCredential(resp) {
  try {
    const { credential: idToken } = resp;           // 구글 ID 토큰(JWT)
    const { data } = await api.post("/auth/google", { idToken }); // /api/auth/google

    // 예: Pinia에 저장하고 동일한 후속 로직 재사용
    await auth.loginWithExternalToken(data.accessToken); // 네가 쓰는 메서드명에 맞게
    alert.show("구글 로그인 성공! 환영합니다.🌿");

    // 기존 네비게이션 로직 재사용
    const redirect = route.query.redirect;
    if (redirect) return router.push(redirect);

    const { data: forests } = await api.get("myforest");
    const forestId = forests?.[0]?.id;
    if (forestId) {
      auth.$patch((state) => (state.user.forestId = forestId));
      return router.push({ name: "ForestDetail", params: { forestId } });
    }
    return router.push("/");
  } catch (e) {
    console.error("Google login error:", e);
    alert.show("구글 로그인 실패. 다시 시도해 주세요.");
  }
}

// GSI 초기화 & 버튼 렌더
const { init, renderButton /* , prompt */ } = useGoogleSignIn({
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  callback: handleGoogleCredential,
});

onMounted(async () => {
  await init();
  renderButton(googleBtn.value);  // 구글 아이콘 자리에 버튼 렌더
  // prompt(); // 원탭도 쓰고 싶으면 주석 해제
});

const handleKakaoLogin = () => {
  const clientId = import.meta.env.VITE_KAKAO_REST_API_KEY;
  const redirectURI = import.meta.env.VITE_KAKAO_REDIRECT_URI;
  const apiHost = "https://kauth.kakao.com";
  const kakaoAuthUrl = `${apiHost}/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectURI}&response_type=code`;

  window.location.href = kakaoAuthUrl;
}
</script>

<template>
  <div class="login-container">
    <div class="login-box">
      <img src="/icon.png" alt="Logo" class="logo" />
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

        <button type="submit" class="login-button" :disabled="loading">{{ loading ? '로그인 중...' : '로그인' }}</button>
      </form>

      <div class="links">
        <router-link to="/forgot-password" class="find-password">비밀번호 재설정</router-link>
        <router-link to="/signup" class="signup">회원가입</router-link>
      </div>

      <div class="social-login">
        <span>또는 SNS 계정으로 로그인</span>
        <div class="social-icons">
          <div ref="googleBtn" class="google-btn"></div>

          <img src="/kakao_icon.png" alt="Kakao" class="kakao-btn"
            @click="handleKakaoLogin"
          />
        </div>
      </div>
    </div>
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
  margin-top: 15px;
}

.social-icons img.kakao-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.2s;
}

.social-icons img.kakao-btn:hover {
  filter: brightness(0.9);
}

.social-icons > .google-btn {
  width: 40px;
  height: 40px;
}

.login-button:disabled {
  background: rgba(255, 255, 255, 0.2);
  cursor: not-allowed;
}
</style>
