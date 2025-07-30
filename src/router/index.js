import { createRouter, createWebHistory } from "vue-router";

import Main from "../views/Main.vue";
import ViewDiary from "../components/ViewDiary.vue";
import ForestMate from "../views/ForestMate.vue";
import ForestView from "../components/ForestView.vue";
import MyItemView from "../components/MyItemView.vue";
import Guestbook from "../components/GuestBook.vue";
import Login from "@/components/Login.vue";
import Signup from "@/components/Signup.vue";
import ForestDetail from "@/views/ForestDetail.vue";
import BackgroundImage2 from "@/components/BackgroundImage2.vue";
import InviteCodeView from "../views/InviteCodeView.vue";
import LandingPage from "@/views/LandingPage.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: Main, // Main이 레이아웃 역할
      children: [
        {
          path: "background-image", // == "/"
          name: "BackgroundImage",
          component: BackgroundImage2,
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
    },
    {
      path: "/signup",
      name: "SignUp",
      component: Signup,
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
    }
  ],
});

// 라우터 가드 추가
router.beforeEach((to, _, next) => {
  const token = localStorage.getItem("accessToken");
  const forestId = localStorage.getItem("forestId");

  // 루트 경로("/")로 접근 시 토큰 여부에 따라 리다이렉트
  if (to.path === "/") {
    if (token && forestId) {
      next({ name: "ForestDetail", params: { forestId: forestId } }); // 기본 ForestDetail로 이동
    } else {
      next({ name: "LandingPage" });
      // alert("로그인이 필요합니다!"); // 로그인 필요 알림
      // next({ name: "Login" }); // 로그인 페이지로 이동
    }
  } else {
    next(); // 다른 경로는 그대로 진행
  }
});

export default router;
