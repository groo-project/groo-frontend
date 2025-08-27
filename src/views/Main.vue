<!--Main-->
<script setup>
import { ref } from "vue";
import { useRoute } from "vue-router";
import SideMenu from "@/components/forest/emotion/SideMenu.vue";
import MateSideMenu from "@/components/forest/mate/MateSideMenu.vue";
import InviteLinkModal from "@/components/forest/mate/InviteLinkModal.vue";
import ForestListModal from "@/components/forest/common/ForestListModal.vue";
import WithdrawModal from "@/components/forest/mate/WithdrawModal.vue";
import AlertModal from "@/components/common/AlertModal.vue";

const route = useRoute();

const currentView = ref("background");
const isInviteLinkModalOpen = ref(false);
const isForestListModalOpen = ref(false);
const isWithdrawModalOpen = ref(false);
const inviteLink = ref("");
const showAlertModal = ref(false);
const alertMessage = ref('');

const changeView = (view) => {
  currentView.value = view;
};

const showAlert = (message) => {
  alertMessage.value = message;
  showAlertModal.value = true;
};

const closeAlert = () => {
  showAlertModal.value = false;
  alertMessage.value = '';
};

const openInviteLinkModal = async () => {
  try {
    const pathSegments = window.location.pathname.split("/");
    const forestId = pathSegments[pathSegments.length - 1];
    console.log("forestId:", forestId);

    if (!forestId) {
      console.error("forestId가 없습니다.");
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      console.error("토큰이 없습니다.");
      return;
    }

    const response = await fetch(
      `http://localhost:8080/mate/link?forestId=${forestId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("서버 응답 데이터:", data);

    inviteLink.value = `${data.inviteLink}`;
    isInviteLinkModalOpen.value = true;
  } catch (error) {
    console.error("초대 링크 요청 실패:", error);
  }
};

const closeInviteLinkModal = () => {
  isInviteLinkModalOpen.value = false;
};

const openForestListModal = () => {
  isForestListModalOpen.value = true;
};

const closeForestListModal = () => {
  isForestListModalOpen.value = false;
};

const openWithdrawModal = () => {
  isWithdrawModalOpen.value = true;
};

const closeWithdrawModal = () => {
  isWithdrawModalOpen.value = false;
};
</script>

<template>
  <div class="container">
    <div class="main-area">
      <router-view 
      @showAlert="showAlert"/>
    </div>
    
    <template v-if="route.path !== '/login'">
      <MateSideMenu
        v-if="route.name === 'ForestMate'"
        @openShare="openInviteLinkModal"
        @openForestList="openForestListModal"
        @openWithdraw="openWithdrawModal"
        @showAlert="showAlert"
      />
      <SideMenu
        v-else
        @change-view="changeView"
        @openForestList="openForestListModal"
        @showAlert="showAlert"
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
    
    <AlertModal
      v-if="showAlertModal"
      :message="alertMessage"
      @close="closeAlert"
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
