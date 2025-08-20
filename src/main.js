import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router, { installGuards } from './router'; 
import Vue3Lottie from 'vue3-lottie'
import { DotLottieVue } from '@lottiefiles/dotlottie-vue'
import mitt from 'mitt'
import { useAuthStore } from '@/stores/auth'
import { attachAuthHooks } from '@/lib/api'


const emitter = mitt()
const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// ✅ Pinia 활성화 후 스토어 생성
const auth = useAuthStore(pinia)


// Pinia가 활성화된 "뒤"에 api에 스토어 함수들을 주입
// ✅ api에 스토어 함수 주입
attachAuthHooks({
  getToken : () => auth.accessToken,   // 메모리(스토어) 토큰만 사용
  refresh  : () => auth.tryRefresh(),  // RT(쿠키)로 AT 재발급
  logout   : () => auth.logout(),
});

installGuards(pinia);   

app.use(router)
app.use(Vue3Lottie)
app.component('DotLottieVue', DotLottieVue)

app.config.globalProperties.emitter = emitter

// 부팅 1회 세션 복구(쿠키 RT → AT)
//  부팅 시 RT(HttpOnly 쿠키)로 AT 재발급 시도 후 마운트
// auth.tryRefresh()
//   .catch(() => { /* refresh 실패해도 그냥 로그인 페이지 유지 */ })
//   .finally(async () => {
//     await router.isReady()   // 선택이지만 권장
//     app.mount('#app')
//   })

await router.isReady()
const firstRoute = router.currentRoute.value

// guestOnly 라우트(/login, /signup, /landing 등)에서는 refresh 생략
if (!firstRoute.matched.some(r => r.meta?.guestOnly)) {
  console.log('Attempting initial token refresh...');

  await auth.tryRefresh().catch(() => {})
}

app.mount('#app')
