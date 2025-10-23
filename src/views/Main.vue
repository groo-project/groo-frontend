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
const isChangeNameModalOpen = ref(false);

const inviteLink = ref("");
const newForestName = ref("");

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

const openChangeNameModal = () => {
  isChangeNameModalOpen.value = true;
};

const closeChangeNameModal = () => {
  isChangeNameModalOpen.value = false;
  newForestName.value = "";
};

const changeForestName = async () => {
  try {
    if (!newForestName.value.trim()) {
      alert.show('숲 이름을 입력해주세요.');
      return;
    }
    
    const forestId = route.params.id;
    const response = await api.patch(`emotion-forest/${forestId}/name`, {
      name: newForestName.value.trim()
    });
    
    if (response.status === 200) {
      alert.show('숲 이름이 변경되었습니다.');
      closeChangeNameModal();
    }
  } catch (error) {
    console.error('숲 이름 변경 실패:', error);
    alert.show('숲 이름 변경에 실패했습니다.');
  }
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
        @openChangeName="openChangeNameModal"
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

    <!-- 숲 이름 변경 모달 -->
    <div v-if="isChangeNameModalOpen" class="modal-overlay" @click="closeChangeNameModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>숲 이름 변경</h3>
          <button class="close-btn" @click="closeChangeNameModal">×</button>
        </div>
        <div class="modal-body">
          <input 
            v-model="newForestName" 
            type="text" 
            class="name-input" 
            placeholder="새로운 숲 이름을 입력하세요"
            maxlength="20"
          />
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeChangeNameModal">취소</button>
          <button class="confirm-btn" @click="changeForestName">변경</button>
        </div>
      </div>
    </div>

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

/* 숲 이름 변경 모달 스타일 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 0;
  width: 400px;
  max-width: 90vw;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e5e5;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 24px;
}

.name-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e5e5e5;
  border-radius: 8px;
  font-size: 16px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.name-input:focus {
  border-color: #3a5a40;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e5e5e5;
  justify-content: flex-end;
}

.cancel-btn, .confirm-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.cancel-btn:hover {
  background: #e5e5e5;
}

.confirm-btn {
  background: #3a5a40;
  color: white;
}

.confirm-btn:hover {
  background: #2d4532;
}
</style>
