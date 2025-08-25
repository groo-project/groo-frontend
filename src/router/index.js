import { createRouter, createWebHistory } from "vue-router";

import Main from "../views/Main.vue";
import ViewDiary from "../components/forest/common/ViewDiary.vue";
import ForestMate from "../views/ForestMate.vue";
import ForestView from "../components/forest/tour/ForestTourView.vue";
import MyItemView from "../components/forest/common/MyItemView.vue";
import Guestbook from "../components/forest/common/guestbook/GuestBook.vue";
import Login from "@/components/auth/Login.vue";
import Signup from "@/components/auth/Signup.vue";
import ForestDetail from "@/views/ForestDetail.vue";
import BackgroundImage from "@/components/BackgroundImage.vue";
import InviteCodeView from "../views/InviteCodeView.vue";
import LandingPage from "@/views/LandingPage.vue";


const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: Main, // Main이 레이아웃 역할
      meta: { requiresAuth: true }, // 인증이 필요한 페이지로 설정
      children: [
        { path: "",
          redirect: { name: "LandingPage" } },
        {
          path: "background-image", // == "/"
          name: "BackgroundImage",
          component: BackgroundImage,
        },
        {
          path: "viewdiary",
          name: "ViewDiary",
          component: ViewDiary,
        },
        {
          path: "forestmate/:id",
          name: "ForestMate",
          component: ForestMate,
        },
        {
          path: "forestview",
          name: "ForestView",
          component: ForestView,
        },
        {
          path: "myitemview",
          name: "MyItemView",
          component: MyItemView,
        },
        {
          path: "guestbook",
          name: "GuestBook",
          component: Guestbook,
        },
        {
          path: "forest-detail/:forestId",
          name: "ForestDetail",
          component: ForestDetail,
        },
      ],
    },
    {
      path: "/login", // 로그인은 레이아웃(Main) 없이 따로 보여야 함
      name: "Login",
      component: Login,
      meta: { guestOnly: true }, // 로그인하지 않은 사용자만 접근 가능
    },
    {
      path: "/signup",
      name: "SignUp",
      component: Signup,
      meta: { guestOnly: true }, // 로그인하지 않은 사용자만 접근 가능
    },
    {
      path: "/mate/invite/:inviteCode", // 초대 코드 입력 화면도 레이아웃 없이 독립적으로 표시
      name: "InviteCode",
      component: InviteCodeView,
    },
    {
      path: "/landing",
      name: "LandingPage",
      component: LandingPage,
      meta: { guestOnly: true }, // 로그인하지 않은 사용자만 접근 가능
    }
  ],
});

// 라우터 가드 추가
// router.beforeEach(async (to) => {
//   // Pinia 스토어를 가져오기 위해 createPinia()로 생성한 pinia 인스턴스를 사용
//   const auth = useAuthStore(pinia);

//   // 1) 게스트 전용 라우트: 로그인 상태면 홈으로
//   if (to.matched.some(r => r.meta.guestOnly)) {
//     if (auth.isAuthenticated) return { name: "BackgroundImage" };
//     return true;
//   }

//   // 2) 보호 라우트: 인증 필요하면 체크
//   if (to.matched.some(r => r.meta.requiresAuth)) {
//     if (auth.isAuthenticated) return true;
//     const ok = await auth.tryRefresh();                // RT 쿠키로 1회 복구 시도
//     if (ok) return true;
//     return { name: "Login", query: { redirect: to.fullPath } };
//   }


//   // 3) 공개 라우트는 통과
//   // 인증된 경우 요청한 페이지로 이동
//   return true;
// })



import { useAuthStore } from '@/stores/auth';

export function installGuards(pinia) {
  router.beforeEach(async (to) => {
    const auth = useAuthStore(pinia);   // ✅ 여기서 pinia 사용

    // 1) 게스트 전용 라우트: 로그인 상태면 홈으로
    if (to.matched.some(r => r.meta.guestOnly)) {
      if (auth.isAuthenticated) return { name: "BackgroundImage" };
      return true;
    }

    // 2) 보호 라우트: 인증 필요하면 체크
    if (to.matched.some(r => r.meta.requiresAuth)) {
      if (auth.isAuthenticated) return true;
      const ok = await auth.tryRefresh();                // RT 쿠키로 1회 복구 시도
      if (ok) return true;
      return { name: "Login", query: { redirect: to.fullPath } };
    }


    // 3) 공개 라우트는 통과
    // 인증된 경우 요청한 페이지로 이동
    return true;
  });
}


export default router;
