<script setup>
import { ref, computed } from "vue";
import { useRoute } from "vue-router"; // 현재 경로를 가져오기 위해 useRoute 사용
import SideMenu from "@/components/forest/emotion/SideMenu.vue";
import MateSideMenu from "@/components/forest/mate/MateSideMenu.vue";
import InviteLinkModal from "@/components/forest/mate/InviteLinkModal.vue";
import ForestListModal from "@/components/forest/common/ForestListModal.vue";
import WithdrawModal from "@/components/forest/mate/WithdrawModal.vue";
import { useAuthStore } from "@/stores/auth.js"; 
import { storeToRefs } from "pinia";
import api from "@/lib/api.js"; 

const currentView = ref("background"); // 초기 상태: BackgroundImage
const isInviteLinkModalOpen = ref(false);
const isForestListModalOpen = ref(false);
const isWithdrawModalOpen = ref(false);


const auth = useAuthStore();
// 반응형으로 꺼내기
const { accessToken, user, isAuthenticated } = storeToRefs(auth); // state/getter를 ref로
const forestId = computed(() => user.value?.forestId ?? null);
const Token = computed(() => accessToken.value ?? null);


const inviteLink = ref("");

const changeView = (view) => {
  currentView.value = view;
};

// 초대 링크 모달 열기
const openInviteLinkModal = async () => {
  try {
    console.log("=== 초대 링크 모달 열기 ===");
    console.log("Route path:", route.path);
    console.log("Route params:", route.params);
    
    // URL에서 forestId 추출
    const forestId = route.params.id;
    console.log("forestId:", forestId);
    console.log("Token:", Token.value ? '있음' : '없음');

    if (!forestId) {
      console.error("forestId가 없습니다.");
      return;
    }

    if (!Token.value) {
      console.error("토큰이 없습니다.");
      return;
    }

    const response = await api.get(`/mate/link`, {
      params: {
        forestId: forestId
      }
    });
    
    console.log("=== API 응답 ===");
    console.log("Response:", response);
    console.log("Response status:", response.status);
    console.log("Response data:", response.data);
    
    if (response.status >= 200 && response.status < 300) {
      // Axios에서는 response.data를 사용
      const data = response.data;
      console.log("서버 응답 데이터:", data);
      
      // 서버 응답 구조에 따라 inviteLink 설정
      if (data.inviteLink) {
        inviteLink.value = data.inviteLink;
        isInviteLinkModalOpen.value = true;
        console.log("초대 링크 설정 완료:", inviteLink.value);
        console.log("모달 상태:", isInviteLinkModalOpen.value);
      } else {
        console.error("초대 링크가 응답에 없습니다:", data);
      }
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error("초대 링크 요청 실패:", error);
  }
};

const closeInviteLinkModal = () => {
  isInviteLinkModalOpen.value = false;
};

// 숲 목록 모달 열기
const openForestListModal = () => {
  isForestListModalOpen.value = true;
};

const closeForestListModal = () => {
  isForestListModalOpen.value = false;
};

// 탈퇴 모달 열기
const openWithdrawModal = () => {
  isWithdrawModalOpen.value = true;
};

const closeWithdrawModal = () => {
  isWithdrawModalOpen.value = false;
};

const route = useRoute(); // 현재 경로 가져오기
</script>

<template>
  <div class="container">
    <div class="main-area">
      <router-view />
    </div>
    <!-- 로그인 페이지가 아닐 때 -->
    <template v-if="route.path !== '/login'">
      <!-- forestmate 페이지일 때는 MateSideMenu를, 그 외에는 일반 SideMenu를 보여줌 -->
      <MateSideMenu
        v-if="route.name === 'ForestMate'"
        @openShare="openInviteLinkModal"
        @openForestList="openForestListModal"
        @openWithdraw="openWithdrawModal"
      />
      <SideMenu
        v-else
        @change-view="changeView"
        @openForestList="openForestListModal"
      />
    </template>
    <InviteLinkModal
      :is-open="isInviteLinkModalOpen"
      :invite-link="inviteLink"
      @close="closeInviteLinkModal"
    />
    <ForestListModal
      v-if="isForestListModalOpen"
      :isOpen="isForestListModalOpen"
      @close="closeForestListModal"
    />
    <WithdrawModal
      v-if="isWithdrawModalOpen"
      :is-open="isWithdrawModalOpen"
      @close="closeWithdrawModal"
    />
  </div>
</template>

<style scoped>
.container {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.main-area {
  flex: 1;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: width 0.3s ease;
  background: transparent;
}
</style>
