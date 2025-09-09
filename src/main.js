import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router, { installGuards } from './router'
import Vue3Lottie from 'vue3-lottie'
import { DotLottieVue } from '@lottiefiles/dotlottie-vue'
import mitt from 'mitt'
import { useAuthStore } from '@/stores/auth'
import { attachAuthHooks } from '@/lib/api'

async function init() {
  const emitter = mitt()
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)

  // ✅ Pinia 활성화 후 스토어 생성
  const auth = useAuthStore(pinia)

  // ✅ api에 스토어 함수 주입
  attachAuthHooks({
    getToken: () => auth.accessToken,   // 메모리(스토어) 토큰만 사용
    refresh: () => auth.tryRefresh(),   // RT(쿠키)로 AT 재발급
    logout: () => auth.logout(),
  })

  app.use(router)
  app.use(Vue3Lottie)
  app.component('DotLottieVue', DotLottieVue)

  app.config.globalProperties.emitter = emitter

  // 라우터 준비 후 가드 설치 및 앱 마운트
  await router.isReady()

  // 라우터가 준비된 후에 가드 설치
  installGuards(pinia)

  const firstRoute = router.currentRoute.value

  // guestOnly 라우트(/login, /signup, /landing 등)에서는 refresh 생략
  if (!firstRoute.matched.some(r => r.meta?.guestOnly)) {
    console.log('Attempting initial token refresh...')
    await auth.tryRefresh().catch(() => {})
  }

  app.mount('#app')
}

init()
