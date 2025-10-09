<script setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useAlertStore } from "@/stores/alert";

const router = useRouter();
const auth = useAuthStore();
const alert = useAlertStore();

onMounted(async () => {
  const code = new URL(window.location.href).searchParams.get("code");
  if (!code) {
    alert.show("잘못된 접근입니다.");
    router.push("/login");
    return;
  }

  try {
    await auth.kakaoLogin(code);
    alert.show("카카오 로그인 성공! 환영합니다.🌿");

    if (auth.user?.forestId) {
        router.push({ name: 'ForestDetail', params: { forestId: auth.user.forestId } });
    }
  } catch (err) {
    console.error("카카오 로그인 실패:", err);
    alert.show("카카오 로그인 실패. 다시 시도해주세요.");
    router.push("/login");
  }
});
</script>

<template>
  <div class="loading-screen">
    <p>카카오 로그인 중입니다... 🌿</p>
  </div>
</template>

<style scoped>
.loading-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  color: #3a5a40;
  font-weight: bold;
}
</style>
