<script setup>
import { ref } from "vue";
import AlertModal from '@/components/common/AlertModal.vue';
import TutorialForestDetail from '@/components/tutorial/TutorialForestDetail.vue';
import TutorialSideMenu from '@/components/tutorial/TutorialSideMenu.vue';

const showAlertModal = ref(false);
const alertMessage = ref('');

const showAlert = (message) => {
  alertMessage.value = message;
  showAlertModal.value = true;
};

const closeAlert = () => {
  showAlertModal.value = false;
  alertMessage.value = '';
};
</script>
<template>
  <div class="container">
    <div class="main-area">
      <TutorialForestDetail
      @showAlert="showAlert"/>
    </div>
    <TutorialSideMenu
      @showAlert="showAlert"/>

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