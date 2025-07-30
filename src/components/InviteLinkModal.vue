<template>
  <div v-if="isOpen" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <div class="header-decoration">
          <span class="deco-item">🌸</span>
          <span class="deco-item">🦊</span>
          <span class="deco-item">🌸</span>
        </div>
        <button class="close-button" @click="$emit('close')">닫기</button>
      </div>

      <div class="modal-body">
        <div class="title-section">
          <div class="title-box">
            <h2>우리의 숲으로<br />놀러와요!</h2>
            <!-- <div class="animal-friends">
              <span class="animal bounce-animation">🦊</span>
              <span class="animal bounce-animation-delay">🐰</span>
              <span class="animal bounce-animation">🦌</span>
            </div> -->
          </div>
        </div>

        <div class="invite-section">
          <div class="message-box">
            <span class="message-icon">💌</span>
            <p style="border-right: 80px"
              >친구에게 전달할 초대장이 준비되었어요</p
            >
          </div>

          <div class="link-box">
            <input
              type="text"
              :value="shareUrl"
              readonly
              ref="linkInput"
              class="link-input"
            />
            <button @click="copyLink" class="copy-button"> 복사하기 </button>
          </div>

          <!-- <div class="footer-message">
            <span class="heart"></span>
            <p>함께라서 더 즐거운 우리의 숲</p>
            <span class="heart"></span>
          </div> -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: true,
  },
  inviteLink: {
    type: String,
    required: true,
  },
});

defineEmits(["close"]);

const linkInput = ref(null);
const shareUrl = computed(() => {
  return `${props.inviteLink}`;
});

const copyLink = () => {
  if (linkInput.value) {
    linkInput.value.select();
    document.execCommand("copy");
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(218, 226, 182, 0.2);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: #fdfbf6;
  border-radius: 30px;
  width: 400px;
  box-shadow: 0 20px 60px rgba(58, 90, 64, 0.2);
  overflow: hidden;
  animation: floatIn 0.5s ease-out;
  border: 3px solid #a5c0a7;
}

@keyframes floatIn {
  0% {
    transform: translateY(20px) scale(0.95);
    opacity: 0;
  }
  100% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.modal-header {
  padding: 20px;
  background: linear-gradient(135deg, #dae2b6 0%, #a5c0a7 100%);
  position: relative;
  height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.header-decoration {
  display: flex;
  gap: 15px;
  font-size: 24px;
}

.deco-item {
  animation: bounce 2s infinite;
}

.deco-item:nth-child(2) {
  animation-delay: 0.3s;
}

.deco-item:nth-child(3) {
  animation-delay: 0.6s;
}

.close-button {
  position: absolute;
  right: 20px;
  background: rgba(58, 90, 64, 0.1);
  border: none;
  border-radius: 10px;
  padding: 8px 16px;
  font-size: 14px;
  color: #3a5a40;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: rgba(58, 90, 64, 0.15);
  transform: translateY(-1px);
}

.modal-body {
  padding: 30px;
}

.title-section {
  text-align: center;
  margin-bottom: 30px;
}

.title-box {
  position: relative;
  display: inline-block;
}

.title-box h2 {
  font-size: 26px;
  color: #3a5a40;
  margin: 0;
  line-height: 1.4;
  font-weight: 700;
  text-shadow: 2px 2px 4px rgba(58, 90, 64, 0.1);
}

.animal-friends {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
}

.animal {
  font-size: 28px;
}

.bounce-animation {
  animation: bounce 2s infinite;
}

.bounce-animation-delay {
  animation: bounce 2s infinite 0.3s;
}

.invite-section {
  background: white;
  border-radius: 20px;
  padding: 25px;
  box-shadow: 0 8px 20px rgba(165, 192, 167, 0.15);
}

.message-box {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  background: #f5f8f5;
  padding: 15px 15px;
  border-radius: 15px;
  white-space: nowrap;
}

.message-box p {
  margin: 0;
  font-size: 15px;
  color: #3a5a40;
  font-weight: 500;
}

.message-icon {
  font-size: 20px;
}

.link-box {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0 -25px;
  padding: 20px 25px;
  background: #f5f8f5;
}

.link-input {
  padding: 15px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  color: #2c3e50;
  background: white;
  text-align: center;
  transition: all 0.3s;
  border-right: 60px;
}

.link-input:focus {
  outline: none;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(58, 90, 64, 0.2);
}

.copy-button {
  background: linear-gradient(135deg, #a5c0a7 0%, #3a5a40 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 15px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.copy-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(58, 90, 64, 0.3);
}

.sparkle {
  font-size: 18px;
}

/* .footer-message {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 25px;
} */

.footer-message p {
  margin: 0;
  font-size: 14px;
  color: #3a5a40;
  font-weight: 500;
}

.heart {
  font-size: 16px;
  animation: pulse 1.5s infinite;
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

@keyframes floating {
  0%,
  100% {
    transform: translateY(0) rotate(-5deg);
  }
  50% {
    transform: translateY(-5px) rotate(5deg);
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

@media (max-width: 480px) {
  .modal-content {
    width: 90%;
    margin: 20px;
  }

  .title-box h2 {
    font-size: 22px;
  }

  .animal {
    font-size: 24px;
  }
}
</style>
