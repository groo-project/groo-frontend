import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router, { installGuards } from './router'
import Vue3Lottie from 'vue3-lottie'
import { DotLottieVue } from '@lottiefiles/dotlottie-vue'
import mitt from 'mitt'
import { useAuthStore } from '@/stores/auth'
import { attachAuthHooks } from '@/lib/api'
import { createMetaManager } from 'vue-meta';

async function init() {

  const emitter = mitt()
  const metaManager = createMetaManager();

  const app = createApp(App)
  const pinia = createPinia()
  

  app.use(pinia)
  app.use(metaManager)

  //가드 설치
  installGuards(pinia)

  // Pinia 활성화 후 스토어 생성
  const auth = useAuthStore(pinia)

  // api에 스토어 함수 주입 -> main.js에서 스토어 준비된 뒤 호출
  attachAuthHooks({
    getToken: () => auth.accessToken,   // 메모리(스토어) 토큰만 사용
    refresh: () => auth.tryRefresh(),   // RT(쿠키)로 AT 재발급
    logout: () => auth.logout(),
  })

  app.use(router)
  app.use(Vue3Lottie)
  app.component('DotLottieVue', DotLottieVue)

  /** 전역 이벤트 버스 등록 -> 모든 컴포넌트에서 this.emitter.emit('이벤트') 호출 가능 */
  app.config.globalProperties.emitter = emitter

  // 라우터 준비 후 가드 설치 및 앱 마운트
  await router.isReady()

 

  const firstRoute = router.currentRoute.value

  // guestOnly 라우트(/login, /signup, /forgot-password 등)에서는 refresh 생략
  // 게스트 전용이 아니거나, 토큰이 없고 랜딩이 아닐 경우 → refresh 시도
if (
  !firstRoute.matched.some(r => r.meta?.guestOnly) ||
  (!auth.accessToken && firstRoute.name !== "LandingPage")
) {
  await auth.tryRefresh().catch(() => {})
}
  

  app.mount('#app')
}

init()
