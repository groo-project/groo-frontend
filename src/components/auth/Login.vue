<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import AlertModal from "@/components/common/AlertModal.vue";

const email = ref("");
const password = ref("");
const router = useRouter();
const showAlert = ref(false);
const alertMessage = ref("");

const handleLogin = async (e) => {
  e.preventDefault();

  try {
    const response = await fetch("http://localhost:8080/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.value,
        password: password.value,
      }),
    });

    if (!response.ok) {
      alertMessage.value = "로그인 정보를 확인해 주세요!";
      showAlert.value = true;
      throw new Error("로그인 실패");
    }

    const data = await response.json();

    // 토큰 저장
    localStorage.setItem("accessToken", data.accessToken);
    // 유저 닉네임 저장
    localStorage.setItem("userNickname", data.userNickname);

    // 로그인 성공 메시지 표시
    alertMessage.value = "로그인 성공! 환영합니다.🌿";
    showAlert.value = true;

    // 알림이 표시되고 나서 페이지 이동
    setTimeout(async () => {
      const token = localStorage.getItem("accessToken");
      const authToken = `Bearer ${token}`;

      // 저장된 초대 코드가 있는지 확인
      const pendingInviteCode = localStorage.getItem("pendingInviteCode");
      if (pendingInviteCode) {
        try {
          const inviteResponse = await fetch(
            `http://localhost:8080/mate/invite/verify`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: authToken,
              },
              body: JSON.stringify({
                inviteCode: pendingInviteCode,
              }),
            }
          );

          if (inviteResponse.ok) {
            localStorage.removeItem("pendingInviteCode");
            router.push("/");
            return;
          }
        } catch (error) {
          console.error("초대 코드 검증 실패:", error);
        }
      }

      // 초대 코드가 없거나 검증 실패 시 기존 로직 실행
      const forestResponse = await fetch("http://localhost:8080/myforest", {
        method: "GET",
        headers: {
          Authorization: authToken,
        },
      });

      if (!forestResponse.ok) {
        throw new Error("숲 정보 불러오기 실패");
      }

      const forestData = await forestResponse.json();
      const myRecentforestId = forestData[0]?.id;

      if (!myRecentforestId) {
        throw new Error("숲이 존재하지 않습니다.");
      }

      localStorage.setItem("myRecentforestId", myRecentforestId);
      router.push(`/forest-detail/${myRecentforestId}`);
    }, 1000); // 알림이 보이고 1초 후에 페이지 이동

  } catch (error) {
    console.error("에러 발생:", error);
    if (!showAlert.value) {  // 이미 에러 메시지가 표시되지 않았다면
      alertMessage.value = "로그인에 실패했습니다.";
      showAlert.value = true;
    }
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

        <div class="remember-me">
          <input type="checkbox" id="remember-me" />
          <label for="remember-me">로그인 유지</label>
        </div>

        <button type="submit" class="login-button">로그인</button>
      </form>

      <div class="links">
        <a href="#" class="find-password">비밀번호 찾기</a>
        <router-link to="/signup" class="signup">회원가입</router-link>
      </div>

      <div class="social-login">
        <span>또는</span>
        <div class="social-icons">
          <img src="/kakao-icon.png" alt="Kakao" />
          <img src="/naver-icon.png" alt="Naver" />
          <img src="/google-icon.png" alt="Google" />
        </div>
      </div>
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
