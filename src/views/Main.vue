<!--Main-->
<script setup>
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import SideMenu from "@/components/forest/emotion/SideMenu.vue";
import MateSideMenu from "@/components/forest/mate/MateSideMenu.vue";
import InviteLinkModal from "@/components/forest/mate/InviteLinkModal.vue";
import ForestListModal from "@/components/forest/common/ForestListModal.vue";
import WithdrawModal from "@/components/forest/mate/WithdrawModal.vue";
import api from "@/lib/api.js"; 
import ConfirmModal from "@/components/forest/common/ConfirmModal.vue";
import { useAlertStore } from '@/stores/alert'

const alert = useAlertStore()

const route = useRoute();
const router = useRouter();

const currentView = ref("background");
const isInviteLinkModalOpen = ref(false);
const isForestListModalOpen = ref(false);
const isWithdrawModalOpen = ref(false);

const inviteLink = ref("");

const changeView = (view) => {
  currentView.value = view;
};

const openInviteLinkModal = async () => {
  try {
    
    // URL에서 forestId 추출
    const forestId = route.params.id;

    const response = await api.get(`mate/link`, {
      params: {
        forestId: forestId
      }
    });
    
    if (response.status >= 200 && response.status < 300) {
      // Axios에서는 response.data를 사용
      const data = response.data;
      
      
      // 서버 응답 구조에 따라 inviteLink 설정
      if (data.inviteLink) {
        inviteLink.value = data.inviteLink;
        isInviteLinkModalOpen.value = true;
        
      } else {
        
      }
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    
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

// ConfirmModal 관련
const isConfirmOpen = ref(false);
const confirmTitle = ref('');
const confirmMessage = ref('');
const confirmSubMessage = ref('');
const confirmCallback = ref(null);

const openConfirmModal = ({ title, message, subMessage, callback }) => {
  confirmTitle.value = title;
  confirmMessage.value = message;
  confirmSubMessage.value = subMessage;
  confirmCallback.value = callback;
  isConfirmOpen.value = true;
}

const handleConfirm = async () => {
  if (confirmCallback.value) {
    await confirmCallback.value();
    confirmCallback.value = null;
  }
  isConfirmOpen.value = false;
}
</script>

<template>
  <div class="container">
    <div class="main-area">
      <router-view />
    </div>
    
    <template v-if="route.path !== '/login'">
      <MateSideMenu
        v-if="route.name === 'ForestMate'"
        :forestId="route.params.id"
        @openShare="openInviteLinkModal"
        @openForestList="openForestListModal"
        @openWithdraw="openWithdrawModal"
        @request-confirm="openConfirmModal"
      />
      <SideMenu
        v-else
        @change-view="changeView"
        @openForestList="openForestListModal"
        @request-confirm="openConfirmModal"
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

    <ConfirmModal
      :is-open="isConfirmOpen"
      :title="confirmTitle"
      :message="confirmMessage"
      :sub-message="confirmSubMessage"
      @confirm="handleConfirm"
      @cancel="isConfirmOpen = false"
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
