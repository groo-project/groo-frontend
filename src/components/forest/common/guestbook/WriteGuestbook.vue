<template>
  <div class="write-guestbook">
    <div class="top-bar">
      <button class="back-button" @click="$emit('back')">←</button>
    </div>
    <div class="title">방명록 작성</div>
    <div class="content">
      <div class="textarea-container">
        <textarea
          v-model="content"
          placeholder="방명록을 작성해주세요... (최대 500자)"
          class="guestbook-textarea"
          maxlength="500"
          @input="handleInput"
        ></textarea>
        <div class="char-count">{{ content.length }}/500</div>
      </div>
      <button class="submit-button" @click="handleSubmit" :disabled="!content.trim() || content.length > 500">작성하기</button>
    </div>
    <AlertModal
      v-if="showAlert"
      :message="alertMessage"
      @close="showAlert = false"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import AlertModal from '@/components/common/AlertModal.vue'

const route = useRoute()
const currentPath = route.path

const content = ref('')
const showAlert = ref(false)
const alertMessage = ref('')
const emit = defineEmits(['back', 'submit'])

const handleInput = (e) => {
  if (content.value.length > 500) {
    content.value = content.value.slice(0, 500)
  }
}

const handleSubmit = async () => {
  if (content.value.trim() && content.value.length <= 500) {
    try {
      const response = await fetch('http://localhost:8080/emotion-forest/mailbox', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          forestId: parseInt(currentPath.split('/')[2]),
          content: content.value
        })
      });

      if (!response.ok) {
        throw new Error('방명록 작성에 실패했습니다.');
      }

      alertMessage.value = '방명록이 작성되었습니다!';
      showAlert.value = true;
      emit('submit', content.value);
      content.value = '';
    } catch (error) {
      console.error('Error:', error);
      alertMessage.value = '방명록 작성에 실패했습니다. 다시 시도해주세요.';
      showAlert.value = true;
    }
  }
}
</script>

<style scoped>
.write-guestbook {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.title {
  font-size: 28px;
  font-weight: bold;
  color: #fff;
  text-align: center;
  margin-bottom: 24px;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.textarea-container {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.guestbook-textarea {
  flex: 1;
  padding: 16px;
  border: none;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.35);
  color: #3a5a40;
  font-size: 16px;
  resize: none;
  outline: none;
  max-height: 300px;
  overflow-y: auto;
}

.char-count {
  position: absolute;
  bottom: 10px;
  right: 10px;
  color: rgba(58, 90, 64, 0.8);
  font-size: 14px;
  background: rgba(255, 255, 255, 0.8);
  padding: 4px 8px;
  border-radius: 4px;
}

.guestbook-textarea::placeholder {
  color: rgba(58, 90, 64, 0.6);
}

.submit-button {
  padding: 14px 0;
  background: rgba(255, 255, 255, 0.35);
  border: none;
  border-radius: 16px;
  color: #3a5a40;
  font-size: 18px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.submit-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.55);
}

.submit-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
</style> 