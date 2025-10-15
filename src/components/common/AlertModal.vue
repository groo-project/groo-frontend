<template>
  <Transition name="toast">
    <div class="toast-message" v-if="show">
      <div class="toast-content">
        <span class="check-icon">🌳</span>
        {{ message }}
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps({
  message: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    default: 1000  
  }
});

const show = ref(true);
const emit = defineEmits(['close']);

onMounted(() => {
  setTimeout(() => {
    show.value = false;
    setTimeout(() => {
      emit('close');
    }, 700);  // 0.8초 동안 페이드아웃
  }, props.duration);
});
</script>

<style scoped>
.toast-message {
  position: fixed;
  top: 35px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #3a5a40;
  color: white;
  padding: 16px 28px;
  border-radius: 8px;
  z-index: 99999;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toast-content {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
}

/* 토스트 애니메이션 */
.toast-enter-active {
  transition: all 0.3s ease;  
}

.toast-leave-active {
  transition: all 0.3s ease-in;  
}

.toast-enter-from,
.toast-leave-to {
  transform: translate(-50%, -20px);
  opacity: 0;
}
</style> 