<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/lib/api.js'
import { useAlertStore } from '@/stores/alert'

const router = useRouter()

const alert = useAlertStore()

const email = ref('')
const verificationCode = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const verificationSent = ref(false) // 전송 완료 여부
const loadingVerification = ref(false) // 전송 중 로딩 상태

// 인증 번호 확인 관련 상태
const loadingVerificationCheck = ref(false)
const verificationCheckMessage = ref('')

// 비밀번호 찾기용 이메일 인증 전송
const sendVerification = async () => {
  if (!email.value) {
    alert.show('이메일을 입력해주세요.')
    return
  }

  loadingVerification.value = true
  try {
    const response = await api.post('mails/password', {
      email: email.value,
    })
    
    if (response.status >= 200 && response.status < 300) {
      verificationSent.value = true
      alert.show('인증번호가 전송되었습니다.')
    } else {
      alert.show('인증번호 전송에 실패했습니다.')
      throw new Error('전송 실패')
    }
  } catch (error) {

    
    if (error.response?.status === 404) {
      alert.show('존재하지 않는 이메일입니다. 이메일을 확인해주세요.')
    } else if (error.response?.data?.message) {
      alert.show(error.response.data.message)
    } else {
      alert.show('인증번호 전송에 실패했습니다.')
    }
  } finally {
    loadingVerification.value = false
  }
}

// 인증번호 확인
const verifyCode = async () => {
  if (!verificationCode.value) {
    alert.show('인증번호를 입력해주세요.')
    return
  }

  verificationCheckMessage.value = ''
  loadingVerificationCheck.value = true
  try {
    const response = await api.post('mails/verification', {
      email: email.value,
      authNum: verificationCode.value,
    })

    if (response.status >= 200 && response.status < 300) {
      verificationCheckMessage.value = '인증이 완료되었습니다.'
      alert.show('인증이 완료되었습니다.')
    } else {
      verificationCheckMessage.value = '인증에 실패했습니다.'
      alert.show(response.data?.message || '인증에 실패했습니다.')
      throw new Error('인증 실패')
    }
  } catch (error) {
    verificationCheckMessage.value = '인증에 실패했습니다.'
    alert.show('인증에 실패했습니다.')
  } finally {
    loadingVerificationCheck.value = false
  }
}

// 비밀번호 재설정
const handlePasswordReset = async (e) => {
  e.preventDefault()

  if (!newPassword.value || !confirmPassword.value) {
    alert.show('새 비밀번호를 입력해주세요.')
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    alert.show('비밀번호가 일치하지 않습니다.')
    return
  }

  if (!passwordValid.value) {
    alert.show('비밀번호 조건을 만족하지 않습니다.')
    return
  }

  try {
    const response = await api.post('auth/password', {
      email: email.value,
      password: newPassword.value,
    })

    if (response.status >= 200 && response.status < 300) {
      alert.show('비밀번호가 성공적으로 변경되었습니다! 🌿')
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } else {
      alert.show(response.data?.message || '비밀번호 변경에 실패했습니다.')
      throw new Error('비밀번호 변경 실패')
    }
  } catch (error) {
    alert.show('비밀번호 변경에 실패했습니다.')
  }
}

// 비밀번호 정규식: 영문, 숫자, 특수문자 포함 8~20자
const passwordValid = computed(() => {
  const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/
  return regex.test(newPassword.value)
})

// 비밀번호 확인 일치 여부
const passwordMatch = computed(() => {
  return newPassword.value && confirmPassword.value && newPassword.value === confirmPassword.value
})

// 이메일 인증 확인: 전송 완료되고 인증이 완료되었는지 체크
const emailVerified = computed(() => {
  return verificationSent.value && verificationCheckMessage.value === '인증이 완료되었습니다.'
})

// 최종 비밀번호 재설정 가능 여부
const canResetPassword = computed(() => {
  return emailVerified.value && passwordValid.value && passwordMatch.value
})
</script>

<template>
  <div class="forgot-password-container">
    <div class="forgot-password-box">
      <h2>비밀번호 재설정</h2>
      <p class="description">이메일 인증을 통해 새로운 비밀번호를 설정하세요</p>
      
      <form class="forgot-password-form" @submit.prevent="handlePasswordReset">
        <label for="email">이메일</label>
        <div class="input-group">
          <input 
            type="email" 
            id="email" 
            v-model="email" 
            placeholder="이메일을 입력해 주세요"
            :disabled="emailVerified"
          />
          <button 
            type="button" 
            class="verify-button" 
            @click="sendVerification"
            :disabled="!email || emailVerified"
          >
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
          <input 
            type="text" 
            id="verification-code" 
            v-model="verificationCode" 
            placeholder="인증 번호를 입력해 주세요"
            :disabled="emailVerified"
          />
          <button 
            type="button" 
            class="verify-button" 
            @click="verifyCode"
            :disabled="!verificationCode || emailVerified"
          >
            <span v-if="loadingVerificationCheck" class="spinner"></span>
            <span v-else>인증</span>
          </button>
        </div>
        <!-- 인증 결과 메시지 -->
        <div v-if="verificationCheckMessage" class="verification-message">
          {{ verificationCheckMessage }}
        </div>

        <template v-if="emailVerified">
          <label for="new-password">새 비밀번호</label>
          <input
            type="password"
            id="new-password"
            v-model="newPassword"
            placeholder="영문, 숫자, 특수문자 포함 8~20자"
          />
          <!-- 비밀번호 조건에 따른 메시지 표시 -->
          <div v-if="newPassword" class="password-message" :class="{'valid': passwordValid, 'invalid': !passwordValid}">
            {{ passwordValid ? '비밀번호 조건을 만족합니다.' : '영문, 숫자, 특수문자 포함 8~20자 조건을 만족해야 합니다.' }}
          </div>

          <label for="confirm-password">비밀번호 확인</label>
          <input
            type="password"
            id="confirm-password"
            v-model="confirmPassword"
            placeholder="비밀번호를 다시 입력해 주세요"
          />
          <!-- 비밀번호 일치 여부 메시지 -->
          <div v-if="confirmPassword" class="password-message" :class="{'valid': passwordMatch, 'invalid': !passwordMatch}">
            {{ passwordMatch ? '비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.' }}
          </div>

          <button type="submit" class="reset-button" :disabled="!canResetPassword">
            비밀번호 재설정
          </button>
        </template>
      </form>

      <div class="back-to-login">
        <router-link to="/login" class="back-link">로그인으로 돌아가기</router-link>
      </div>
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
.forgot-password-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;
}

.forgot-password-box {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 16px;
  padding: 40px;
  width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.forgot-password-box h2 {
  font-size: 24px;
  color: #fff;
  margin-bottom: 8px;
  line-height: 1.5;
}

.description {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 24px;
}

.forgot-password-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.forgot-password-form label {
  font-size: 14px;
  color: #fff;
  text-align: left;
}

.forgot-password-form input {
  padding: 10px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.35);
  color: #3a5a40;
  font-size: 14px;
}

.forgot-password-form input::placeholder {
  color: rgba(58, 90, 64, 0.7);
}

.forgot-password-form input:disabled {
  background: rgba(255, 255, 255, 0.2);
  color: rgba(58, 90, 64, 0.5);
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
  white-space: nowrap;
}

.verify-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.55);
}

.verify-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.reset-button {
  padding: 12px;
  background: rgba(255, 255, 255, 0.35);
  border: none;
  border-radius: 8px;
  color: #3a5a40;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 8px;
}

.reset-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.55);
}

.reset-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.back-to-login {
  margin-top: 20px;
  text-align: center;
}

.back-link {
  color: #fff;
  text-decoration: none;
  font-size: 14px;
}

.back-link:hover {
  text-decoration: underline;
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
