<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h2>{{ title }}</h2>
      </div>
      <div class="modal-body">
        <slot>
          <p>{{ message }}</p>
        </slot>
        <slot>
          <p>{{ subMessage }}</p>
        </slot>
      </div>
      <div class="modal-actions">
        <button class="modal-btn" @click="$emit('confirm')">확인</button>
        <button class="modal-btn secondary" @click="$emit('cancel')">취소</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isOpen: Boolean,
  title: { type: String, default: '확인' },
  message: { type: String, default: '저장하시겠습니까?' },
  subMessage: { type: String, default: null}
});
defineEmits(['confirm', 'cancel']);
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0,0,0,0.5);
  display: flex; justify-content: center; align-items: center;
  z-index: 1000;
}
.modal-content {
  background: rgba(255,255,255,0.95);
  border-radius: 20px;
  padding: 32px 28px 24px 28px;
  min-width: 320px;
  max-width: 90vw;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}
.modal-header h2 {
  color: #3a5a40;
  font-size: 1.3rem;
  margin-bottom: 18px;
}
.modal-actions {
  display: flex;
  justify-content: center;
  gap: 18px;
  margin-top: 24px;
}
.modal-btn {
  background: #3a5a40;
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 12px 32px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.modal-btn.secondary {
  background: #a5c0a7;
  color: #3a5a40;
}
.modal-btn:hover {
  background: #2d4632;
}
</style> 