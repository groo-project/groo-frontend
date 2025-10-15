<script setup>
import { ref, computed } from "vue";
import { useRouter } from 'vue-router'
import api from '@/lib/api.js'
import { useAuthStore } from '@/stores/auth.js'
import { useAlertStore } from '@/stores/alert'

const emit = defineEmits(["close", "openModal"]);

const router = useRouter();
const authStore = useAuthStore();
const alert = useAlertStore();

// 사용자 정보
const user = computed(() => authStore.user);
const token = computed(() => authStore.accessToken || '');
const nickname = computed(() => authStore.user?.nickname || "여행자");

// 탭 상태 관리
const activeTab = ref('password');

// 탭 변경 함수
const setActiveTab = (tab) => {
  activeTab.value = tab;
  emit('openModal', tab);
};



</script>

<template>
  <div class="my-info-view">
    <div class="top-bar">
      <button class="back-button" @click="emit('close')">
        ←
      </button>
    </div>
    
    <div class="greeting">
      <div>안녕하세요 {{ nickname }}님,</div>
      <div>계정 정보를 관리해보세요</div>
    </div>

    <!-- 탭 네비게이션 -->
    <div class="tab-navigation">
      <button 
        class="tab-btn" 
        @click="setActiveTab('password')"
      >
        <span class="icon">🔒</span>
        비밀번호 변경
      </button>
      <button 
        class="tab-btn" 
        @click="setActiveTab('nickname')"
      >
        <span class="icon">👤</span>
        닉네임 변경
      </button>
      <button 
        class="tab-btn" 
        @click="setActiveTab('withdraw')"
      >
        <span class="icon">⚠️</span>
        탈퇴하기
      </button>
      <button 
        class="tab-btn" 
        @click="setActiveTab('update')"
      >
        <span class="icon">🔄</span>
        업데이트 정보
      </button>
    </div>
  </div>
</template>

<style scoped>
.my-info-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  color: #fff;
}

.top-bar {
  width: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 20px 24px;
  margin-bottom: 12px;
}

.back-button {
  background: none;
  border: none;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  padding: 8px;
  margin-right: auto;
}

.greeting {
  color: #fff;
  font-size: 22px;
  font-weight: 500;
  text-align: center;
  margin-bottom: 36px;
  line-height: 1.5;
}

.tab-navigation {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}

.tab-btn {
  width: 260px;
  padding: 14px 0;
  background: rgba(255, 255, 255, 0.35);
  border: none;
  border-radius: 16px;
  box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.1);
  color: #3a5a40;
  font-size: 18px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 16px;
  cursor: pointer;
  transition: background 0.2s;
  text-decoration: none;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.55);
}

.icon {
  font-size: 22px;
  margin-left: 18px;
}

.tab-content {
  flex: 1;
  overflow-y: auto;
}

.tab-panel {
  width: 100%;
}

.form-section {
  padding: 0 8px;
}

.form-section h3 {
  color: #fff;
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
  text-align: center;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: #fff;
  font-size: 16px;
  box-sizing: border-box;
}

.form-group input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.form-group input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.25);
}

.disabled-input {
  background: rgba(255, 255, 255, 0.1) !important;
  color: rgba(255, 255, 255, 0.6) !important;
  cursor: not-allowed;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  background: rgba(255, 255, 255, 0.3);
  border: none;
  border-radius: 12px;
  color: #3a5a40;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 8px;
}

.submit-btn:hover {
  background: rgba(255, 255, 255, 0.4);
}

.danger-btn {
  width: 100%;
  padding: 14px;
  background: rgba(220, 53, 69, 0.8);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 8px;
}

.danger-btn:hover {
  background: rgba(220, 53, 69, 1);
}

.warning-message {
  background: rgba(255, 193, 7, 0.2);
  border: 1px solid rgba(255, 193, 7, 0.4);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.warning-message p {
  margin: 0 0 12px 0;
  font-size: 14px;
  line-height: 1.5;
}

.warning-message ul {
  margin: 8px 0;
  padding-left: 20px;
}

.warning-message li {
  margin-bottom: 4px;
  font-size: 14px;
}

.update-info {
  text-align: center;
}

.version-info {
  margin-bottom: 20px;
}

.version-info h4 {
  color: #fff;
  font-size: 16px;
  margin-bottom: 8px;

}

.version-info p {
  color: rgba(255, 255, 255, 0.8);
  font-size: 18px;
  font-weight: 600;
}

.update-actions {
  margin-bottom: 24px;
}

.update-notes {
  text-align: left;
}

.update-notes h4 {
  color: #fff;
  font-size: 16px;
  margin-bottom: 12px;
}

.update-notes ul {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  line-height: 1.6;
  padding-left: 20px;
}

.update-notes li {
  margin-bottom: 6px;
}


/* 기존 탈퇴 확인 모달 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(16px);
  border-radius: 16px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  text-align: center;
}

.modal-content h3 {
  color: #fff;
  font-size: 20px;
  margin-bottom: 16px;
}

.modal-content p {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 24px;
}

.modal-buttons {
  display: flex;
  gap: 12px;
}

.cancel-btn {
  flex: 1;
  padding: 12px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>

