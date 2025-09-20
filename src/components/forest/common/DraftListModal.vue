<template>
  <div v-if="isVisible" class="modal-overlay" @click="closeModal">
    <div class="modal-container" @click.stop>
      <!-- 리스트 뷰 -->
      <div v-if="currentView === 'list'" class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">
            <span class="modal-icon">📝</span>
            임시저장 목록
          </h3>
          <button class="close-btn" @click="closeModal">✕</button>
        </div>
        
        <div class="draft-list-container">
          <div v-if="loading" class="loading-message">
            불러오는 중...
          </div>
          
          <div v-else-if="drafts.length === 0" class="empty-message">
            임시저장된 글이 없습니다.
          </div>
          
          <div v-else class="draft-list">
            <div 
              v-for="draft in drafts" 
              :key="draft.diaryDraftId"
              class="draft-item"
              @click="viewDraftDetail(draft)"
            >
              <div class="draft-date">{{ formatDate(draft.diaryDate) }}</div>
              <div class="draft-content">{{ truncate(draft.content, 20) }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 상세 뷰 -->
      <div v-else-if="currentView === 'detail'" class="modal-content">
        <div class="modal-header">
          <button class="back-btn" @click="backToList">← 목록으로</button>
          <button class="close-btn" @click="closeModal">✕</button>
        </div>
        
        <div class="draft-detail">
          <div class="detail-date">{{ formatDate(selectedDraft.diaryDate) }}</div>
          <div class="detail-content">{{ selectedDraft.content }}</div>
          
          <div class="detail-actions">
            <button class="action-btn delete-btn" @click="deleteDraft">
              삭제하기
            </button>
            <button class="action-btn load-btn" @click="loadDraft">
              불러오기
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import api from '@/lib/api'

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'load-draft', 'show-alert'])

const currentView = ref('list') // 'list' or 'detail'
const drafts = ref([])
const selectedDraft = ref(null)
const loading = ref(false)

const truncate = (text, length = 15) => {
  if (!text) return ''
  return text.length > length ? text.slice(0, length) + '...' : text
}

const formatDate = (dateStr) => {
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  const date = new Date(dateStr)
  const dayOfWeek = weekdays[date.getDay()]
  return `${dateStr} ${dayOfWeek}`
}

const fetchDrafts = async () => {
  loading.value = true
  try {
    const response = await api.get('diaries/drafts')
    drafts.value = response.data || []
  } catch (error) {
    console.error('임시저장 목록 불러오기 실패:', error)
    emit('show-alert', '임시저장 목록을 불러오지 못했습니다.')
    drafts.value = []
  } finally {
    loading.value = false
  }
}

const viewDraftDetail = (draft) => {
  selectedDraft.value = draft
  currentView.value = 'detail'
}

const backToList = () => {
  currentView.value = 'list'
  selectedDraft.value = null
}

const closeModal = () => {
  currentView.value = 'list'
  selectedDraft.value = null
  emit('close')
}

const deleteDraft = async () => {
  if (!selectedDraft.value) return

  emit('request-confirm', {
    title: '임시 저장 삭제',
    message: '정말 삭제하시겠습니까?',
    callback: async () => {
        try {
            await api.delete(`diaries/drafts/${selectedDraft.value.diaryDraftId}`)
            emit('show-alert', '임시저장 글이 삭제되었습니다.')
    
            // 목록에서 삭제된 항목 제거
            drafts.value = drafts.value.filter(
            draft => draft.diaryDraftId !== selectedDraft.value.diaryDraftId
            )
    
            backToList()
        } catch (error) {
            console.error('임시저장 글 삭제 실패:', error)
            emit('show-alert', '삭제에 실패했습니다. 다시 시도해주세요.')
        }
    }
  })
}

const loadDraft = () => {
  if (!selectedDraft.value) return

  emit('request-confirm', {
    title: "불러오기",
    message: "기존 작성하던 내용이 없어지고 해당 내용으로 덮어쓸게요.",
    callback: async () => {
        emit('load-draft', selectedDraft.value.content)
        emit('show-alert', '임시저장 글을 불러왔습니다.')
        closeModal()
    }
  })
}

// 모달이 열릴 때마다 목록 새로고침
watch(() => props.isVisible, (newValue) => {
  if (newValue) {
    fetchDrafts()
  }
})

onMounted(() => {
  if (props.isVisible) {
    fetchDrafts()
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-container {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 18px;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(58, 90, 64, 0.1);
}

.modal-title {
  color: #3a5a40;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.modal-icon {
  font-size: 20px;
}

.close-btn {
  background: none;
  border: none;
  color: #3a5a40;
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: rgba(58, 90, 64, 0.1);
}

.back-btn {
  background: none;
  border: none;
  color: #3a5a40;
  font-size: 14px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background-color 0.2s;
  font-weight: 500;
}

.back-btn:hover {
  background: rgba(58, 90, 64, 0.1);
}

.draft-list-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.loading-message,
.empty-message {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: rgba(58, 90, 64, 0.7);
  font-size: 16px;
}

.draft-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 20px;
}

.draft-item {
  background: rgba(58, 90, 64, 0.05);
  border: 1px solid rgba(58, 90, 64, 0.1);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.draft-item:hover {
  background: rgba(58, 90, 64, 0.1);
  border-color: rgba(58, 90, 64, 0.2);
  transform: translateY(-1px);
}

.draft-date {
  color: #3a5a40;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
}

.draft-content {
  color: rgba(58, 90, 64, 0.8);
  font-size: 16px;
  line-height: 1.5;
}

.draft-detail {
  padding: 0 24px 24px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.detail-date {
  color: #3a5a40;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(58, 90, 64, 0.1);
}

.detail-content {
  flex: 1;
  color: #3a5a40;
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 24px;
  padding: 16px;
  background: rgba(58, 90, 64, 0.05);
  border-radius: 12px;
  white-space: pre-wrap;
  overflow-y: auto;
  max-height: 300px;
}

.detail-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.delete-btn {
  background: rgba(220, 53, 69, 0.1);
  color: #dc3545;
  border: 1px solid rgba(220, 53, 69, 0.2);
}

.delete-btn:hover {
  background: rgba(220, 53, 69, 0.2);
}

.load-btn {
  background: #3a5a40;
  color: white;
}

.load-btn:hover {
  background: #2d4632;
}

/* 스크롤바 스타일링 */
.draft-list::-webkit-scrollbar,
.detail-content::-webkit-scrollbar {
  width: 6px;
}

.draft-list::-webkit-scrollbar-track,
.detail-content::-webkit-scrollbar-track {
  background: rgba(58, 90, 64, 0.1);
  border-radius: 3px;
}

.draft-list::-webkit-scrollbar-thumb,
.detail-content::-webkit-scrollbar-thumb {
  background: rgba(58, 90, 64, 0.3);
  border-radius: 3px;
}

.draft-list::-webkit-scrollbar-thumb:hover,
.detail-content::-webkit-scrollbar-thumb:hover {
  background: rgba(58, 90, 64, 0.5);
}
</style>