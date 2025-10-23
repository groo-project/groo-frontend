<template>
  <div class="forest-info-container">
    <div class="top-bar">
      <button class="back-button" @click="$emit('close')">
        ←
      </button>
      <h2 class="title">우정의 숲 정보</h2>
    </div>
    
    <div class="forest-info-content" v-if="forestData">
      <div class="forest-header">
        <div class="stat-label">숲 이름</div>
        <div class="forest-name">{{ forestData?.name || props.forestName || '우정의 숲' }}</div>
      </div>
      
      <div class="forest-stats">
        <div class="stats-row">
          <div class="stat-item">
            <div class="stat-label">숲 멤버</div>
            <div class="stat-value member-names">
              <span v-for="(member, index) in forestData.members" :key="member.id">
                {{ member.nickname }}<span v-if="index < forestData.members.length - 1">, </span>
              </span>
              <span v-if="!forestData.members || forestData.members.length === 0">멤버 없음</span>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-label">작성된 일기</div>
            <div class="stat-value">{{ forestData.diaryCount || 0 }}개</div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-label">생성일</div>
          <div class="stat-value">{{ formatDate(forestData.createdAt) }}</div>
        </div>
      </div>
      
      
      <div class="forest-actions">
        <button class="action-btn invite-btn" @click="$emit('invite')">
          <img src="@/icons/invite_icon.png" class="btn-icon" />
          친구 초대하기
        </button>
        <button class="action-btn change-name-btn" @click="openChangeNameModal">
          <img src="@/icons/forest_edit_icon.png" class="btn-icon" />
          숲 이름 변경하기
        </button>
        <button class="action-btn withdraw-btn" @click="handleWithdraw">
          <img src="@/icons/forestmate_icon.png" class="btn-icon" />
          우정의 숲 탈퇴하기
        </button>
      </div>
    </div>
    
    <div v-else class="loading-container">
      <div class="loading-spinner"></div>
      <div class="loading-text">숲 정보를 불러오는 중...</div>
    </div>
    
    <!-- API 실패 시에도 기본 정보 표시 -->
    <div v-if="!forestData && !loading" class="forest-info-content">
      <div class="forest-header">
        <div class="forest-description">숲 이름</div>
        <div class="forest-name">{{ props.forestName || '우정의 숲' }}</div>
      </div>
      
      <div class="forest-stats">
        <div class="stats-row">
          <div class="stat-item">
            <div class="stat-label">숲 멤버</div>
            <div class="stat-value member-names">멤버 없음</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">작성된 일기</div>
            <div class="stat-value">0개</div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-label">생성일</div>
          <div class="stat-value">{{ formatDate(new Date().toISOString()) }}</div>
        </div>
      </div>
      
      <div class="forest-actions">
        <button class="action-btn invite-btn" @click="$emit('invite')">
          <img src="@/icons/invite_icon.png" class="btn-icon" />
          친구 초대하기
        </button>
        <button class="action-btn change-name-btn" @click="openChangeNameModal">
          <img src="@/icons/forest_edit_icon.png" class="btn-icon" />
          숲 이름 변경하기
        </button>
        <button class="action-btn withdraw-btn" @click="handleWithdraw">
          <img src="@/icons/forestmate_icon.png" class="btn-icon" />
          우정의 숲 탈퇴하기
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/lib/api'

const props = defineProps({
  forestId: {
    type: [String, Number],
    required: true
  },
  forestName: {
    type: String,
    default: '우정의 숲'
  }
})

const emit = defineEmits(['close', 'invite', 'openWithdraw', 'openChangeName'])

const forestData = ref(null)
const loading = ref(true)

const fetchForestInfo = async () => {
  try {
    loading.value = true
    const response = await api.get(`mate/detail/${props.forestId}`)
    const data = response.data
    console.log('API 응답 데이터:', data)
    
    // 멤버 정보를 nicknames 배열에서 members 배열로 변환
    const members = data.nicknames ? data.nicknames.map((nickname, index) => ({
      id: index + 1,
      nickname: nickname,
      profileImage: null,
      role: 'MEMBER'
    })) : []
    
    forestData.value = {
      name: data.forestName || data.name || data.forest?.name || '우정의 숲',
      description: data.description || '우정의 숲에 오신 것을 환영합니다!',
      memberCount: members.length,
      diaryCount: data.writtenDiaryCount || 0,
      createdAt: data.createdAt || new Date().toISOString(),
      members: members
    }
  } catch (error) {
    console.error('숲 정보 조회 실패:', error)
    forestData.value = {
      name: '우정의 숲',
      description: '우정의 숲에 오신 것을 환영합니다!',
      memberCount: 0,
      diaryCount: 0,
      createdAt: new Date().toISOString(),
      members: []
    }
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getRoleText = (role) => {
  const roleMap = {
    'OWNER': '숲 주인',
    'MEMBER': '멤버',
    'ADMIN': '관리자'
  }
  return roleMap[role] || role
}

const handleWithdraw = () => {
  emit('openWithdraw')
}

const openChangeNameModal = () => {
  emit('openChangeName')
}

onMounted(() => {
  fetchForestInfo()
})
</script>

<style scoped>
.forest-info-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
  box-sizing: border-box;
  overflow-y: auto;
}

.top-bar {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}

.back-button {
  background: none;
  border: none;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  padding: 8px;
  margin-right: 16px;
}

.title {
  color: #fff;
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.forest-info-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.forest-header {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  text-align: center;
}

.forest-name {
  color: #fff;
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
}

.forest-description {
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
  line-height: 1.5;
}

.forest-stats {
  display: flex;
  flex-direction: column;
  /* gap: 16px; */
  margin-bottom: 24px;
}

.stats-row {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.stat-item {
  border-radius: 12px;
  padding: 16px;
  text-align: center;
}

.stat-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  margin-bottom: 8px;
}

.stat-value {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
}

.member-names {
  font-size: 16px;
  line-height: 1.4;
  word-wrap: break-word;
}


.forest-actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  margin-top: auto;
}

.action-btn {
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

.action-btn:hover {
  background: rgba(255, 255, 255, 0.55);
}

.btn-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
  margin-left: 18px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #fff;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

.loading-text {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
