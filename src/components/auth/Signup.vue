<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AlertModal from '@/components/common/AlertModal.vue'
import api from '@/lib/api.js'

const router = useRouter()

const email = ref('')
const verificationCode = ref('')
const password = ref('')
const nickname = ref('')
const verificationSent = ref(false) // 전송 완료 여부
const loadingVerification = ref(false) // 전송 중 로딩 상태

// 인증 번호 확인 관련 상태
const loadingVerificationCheck = ref(false)
const verificationCheckMessage = ref('')

// AlertModal 관련 상태
const showAlert = ref(false)
const alertMessage = ref('')
const alertType = ref('')

const showAlertModal = (message, type = 'info') => {
  alertMessage.value = message
  alertType.value = type
  showAlert.value = true
}

const sendVerification = async () => {
  loadingVerification.value = true
  try {
    const response = await api.post('/mails', {
      email: email.value,
    })
    
    if (response.status >= 200 && response.status < 300) {
      verificationSent.value = true
      showAlertModal('인증번호가 전송되었습니다.', 'success')
    } else {
      showAlertModal('인증번호 전송에 실패했습니다.', 'error')
      throw new Error('전송 실패')
    }
  } catch (error) {
    showAlertModal('인증번호 전송에 실패했습니다.', 'error')
  } finally {
    loadingVerification.value = false
  }
}

const verifyCode = async () => {
  // 초기화
  verificationCheckMessage.value = ''
  loadingVerificationCheck.value = true
  try {
    const response = await api.post('/mails/verification', {
      email: email.value,
      authNum: verificationCode.value,
    })

    if (response.status >= 200 && response.status < 300) {
      verificationCheckMessage.value = '인증이 완료되었습니다.'
      showAlertModal('인증이 완료되었습니다.', 'success')
    } else {
      verificationCheckMessage.value = '인증에 실패했습니다.'
      showAlertModal(response.data?.message || '인증에 실패했습니다.', 'error')
      throw new Error('인증 실패')
    }
  } catch (error) {
    verificationCheckMessage.value = '인증에 실패했습니다.'
    showAlertModal('인증에 실패했습니다.', 'error')
  } finally {
    loadingVerificationCheck.value = false
  }
}

const handleSignUp = async (e) => {
  e.preventDefault()

  try {
    const response = await api.post('/auth/signup', {
      email: email.value,
      password: password.value,
      nickname: nickname.value,
    })

    if (response.status >= 200 && response.status < 300) {
      showAlertModal('회원가입 성공! 환영합니다. 🌿', 'success')
      router.push('/login')
    } else {
      showAlertModal(response.data?.message || '회원가입 정보를 확인해 주세요!', 'error')
      throw new Error('회원가입 실패')
    }
  } catch (error) {
    if (error.response.data.code == 'U003') {
      showAlertModal("이미 존재하는 닉네임이에요!");
    } else {
      showAlertModal('회원가입 실패', 'error')
    }
  }
}

// 비밀번호 정규식: 영문, 숫자, 특수문자 포함 8~20자
const passwordValid = computed(() => {
  const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/
  return regex.test(password.value)
})

// 닉네임이 비어있지 않은지 확인
const nicknameValid = computed(() => {
  return nickname.value.trim().length > 0
})

// 이메일 인증 확인: 전송 완료되고 인증이 완료되었는지 체크
const emailVerified = computed(() => {
  return verificationSent.value && verificationCheckMessage.value === '인증이 완료되었습니다.'
})

// 최종 가입 가능 여부
const canSignUp = computed(() => {
  return emailVerified.value && passwordValid.value && nicknameValid.value
})
</script>

<template>
  <div class="signup-container">
    <div class="signup-box">
      <h2>GROO에 가입하여<br />나만의 숲 꾸미기</h2>
      <form class="signup-form" @submit.prevent="handleSignUp">
        <label for="email">이메일</label>
        <div class="input-group">
          <input type="email" id="email" v-model="email" placeholder="이메일을 입력해 주세요" />
          <button type="button" class="verify-button" @click="sendVerification">
            <span v-if="loadingVerification" class="spinner"></span>
            <span v-else>전송</span>
          </button>
        </div>
        <!-- 전송 성공 시 문구 표시 -->
        <div v-if="verificationSent" class="verification-message">
          인증번호가 발송되었습니다.
        </div>

        <label for="verification-code">인증 번호</label>
        <div class="input-group">
          <input type="text" id="verification-code" v-model="verificationCode" placeholder="인증 번호를 입력해 주세요" />
          <button type="button" class="verify-button" @click="verifyCode">
            <span v-if="loadingVerificationCheck" class="spinner"></span>
            <span v-else>인증</span>
          </button>
        </div>
        <!-- 인증 결과 메시지 -->
        <div v-if="verificationCheckMessage" class="verification-message">
          {{ verificationCheckMessage }}
        </div>

        <label for="password">비밀번호</label>
        <input
          type="password"
          id="password"
          v-model="password"
          placeholder="영문, 숫자, 특수문자 포함 8~20자"
        />
        <!-- 비밀번호 조건에 따른 메시지 표시 -->
        <div v-if="password" class="password-message" :class="{'valid': passwordValid, 'invalid': !passwordValid}">
          {{ passwordValid ? '비밀번호 조건을 만족합니다.' : '영문, 숫자, 특수문자 포함 8~20자 조건을 만족해야 합니다.' }}
        </div>

        <label for="nickname">닉네임</label>
        <input type="text" id="nickname" v-model="nickname" placeholder="닉네임을 입력해 주세요" />

        <button type="submit" class="signup-button" :disabled="!canSignUp">가입</button>
      </form>
    </div>
    <AlertModal
      v-if="showAlert"
      :message="alertMessage"
      :type="alertType"
      @close="showAlert = false"
    />
  </div>
</template>

<style scoped>
.signup-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;
}

.signup-box {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 16px;
  padding: 40px;
  width: 360px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.signup-box h2 {
  font-size: 20px;
  color: #fff;
  margin-bottom: 20px;
  line-height: 1.5;
}

.signup-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.signup-form label {
  font-size: 14px;
  color: #fff;
  text-align: left;
}

.signup-form input {
  padding: 10px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.35);
  color: #3a5a40;
  font-size: 14px;
}

.signup-form input::placeholder {
  color: rgba(58, 90, 64, 0.7);
}

.input-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.verify-button {
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.35);
  border: none;
  border-radius: 8px;
  color: #3a5a40;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.verify-button:hover {
  background: rgba(255, 255, 255, 0.55);
}

.verification-message {
  font-size: 14px;
  color: #000000;
  text-align: left;
}

.password-message {
  font-size: 14px;
  text-align: left;
  margin-top: 4px;
}

.password-message.valid {
  color: green;
}

.password-message.invalid {
  color: red;
}

.signup-button {
  padding: 12px;
  background: rgba(255, 255, 255, 0.35);
  border: none;
  border-radius: 8px;
  color: #3a5a40;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}

.signup-button:hover {
  background: rgba(255, 255, 255, 0.55);
}

/* 비활성화 상태 스타일 */
.signup-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

#email {
  width: 75%;
}

#verification-code {
  width: 75%;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(58, 90, 64, 0.3);
  border-top-color: #3a5a40;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>