<script setup>
import { ref, computed, onMounted, watch, getCurrentInstance } from "vue";
import { useRouter, useRoute } from 'vue-router'
import MyDiaryCalendar from '@/components/forest/emotion/MyDiaryCalendar.vue';
import MyDiaryDetail from '@/components/forest/emotion/MyDiaryDetail.vue';
import { useAuthStore } from '@/stores/auth.js'
import { useAlertStore } from '@/stores/alert'
import api from '@/lib/api.js'



// Icons
import CategorySelector from '@/components/forest/common/CategorySelector.vue'
import AnalyzeResult from '@/components/forest/common/AnalyzeResult.vue'
import WriteDiary from '@/components/forest/emotion/WriteDiary.vue'
import LoadingAnimation from '@/components/forest/common/LoadingAnimation.vue'
import GuestbookList from '@/components/forest/common/guestbook/GuestbookList.vue'
import ConfirmModal from '@/components/forest/common/ConfirmModal.vue'
import GuestBookDetail from '@/components/forest/common/guestbook/GuestBookDetail.vue'
import ForestListModal from "@/components/forest/common/ForestListModal.vue";
import MyItemView from '@/components/forest/common/MyItemView.vue'
import MyInfoView from '@/components/forest/common/myInfoView.vue'
import MyDiaryCalendarForWrite from "./MyDiaryCalendarForWrite.vue";

import buttonIcon_1 from '@/icons/diarywrite_icon.png'
import buttonIcon_2 from '@/icons/diaryview_icon.png'
import buttonIcon_3 from '@/icons/forestmate_icon.png'
import buttonIcon_5 from '@/icons/myitemview_icon.png'
import buttonIcon_7 from '@/icons/user_icon.png'
import logoutIcon from '@/icons/logout_icon.png'
import joyIcon from '@/icons/joy_icon.png'
import sadIcon from '@/icons/sad_icon.png'
import peacefulIcon from '@/icons/peaceful_icon.png'
import annoyIcon from '@/icons/annoy_icon.png'
import anxiousIcon from '@/icons/anxious_icon.png'
import melancholyIcon from '@/icons/melancholy_icon.png'
import tiredIcon from '@/icons/tired_icon.png'
import romanceIcon from '@/icons/romance_icon.png'

const router = useRouter();
const route = useRoute();
const emit = defineEmits(["openForestList", "request-confirm"]);
const { proxy } = getCurrentInstance();

// 상수들
const emotionIcons = {
  즐거움: joyIcon,
  우울함: melancholyIcon,
  평온함: peacefulIcon,
  짜증: annoyIcon,
  불안함: anxiousIcon,
  슬픔: sadIcon,
  지침: tiredIcon,
  설렘: romanceIcon,
};

const dummyAnalysisResult = {
  emotions: [
    { label: "평온함", icon: peacefulIcon, percent: 50 },
    { label: "즐거움", icon: joyIcon, percent: 30 },
  ],
  summaryMessage: "평온하고 일상적인 하루에, 즐거움이 묻어나있네요!",
  pieces: [
    { value: "tree1", label: "동글 나무", icon: buttonIcon_1 },
    { value: "tree2", label: "뾰족 나무", icon: buttonIcon_2 },
    { value: "tree3", label: "나는 나무", icon: buttonIcon_3 },
  ],
};

// reactive 상태들
const isMenuOpen = ref(true)
const categoryLoading = ref(false)
const showLogoutModal = ref(false)

// MyInfoView 모달 상태 관리
const showMyInfoModal = ref(false)
const myInfoActiveTab = ref('password')
const myInfoPasswordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const myInfoNicknameForm = ref({
  newNickname: ''
})
const showMyInfoWithdrawModal = ref(false)



const viewState = ref({
  currentView: 'main',
  data: {
    selectedCategory: null,
    selectedGuestbookId: null,
    selectedDiaryData: null,
    currentDiaryIndex: 0,
    pieceToSave: null
  }
})

const modalState = ref({
  showSaveModal: false,
  showForestListModal: false,
})

// computed 속성들
const showCategorySelector = computed(() => viewState.value.currentView === 'category')
const showAnalyzeResult = computed(() => viewState.value.currentView === 'analyze')
const showWriteDiary = computed(() => viewState.value.currentView === 'writeDiary')
const showGuestbookList = computed(() => viewState.value.currentView === 'guestbookList')
const showGuestbookDetail = computed(() => viewState.value.currentView === 'guestbookDetail')
const showMyItemView = computed(() => viewState.value.currentView === 'myItemView')
const showMyInfoView = computed(() => viewState.value.currentView === 'myInfoView')
const showMyDiaryCalendar = computed(() => viewState.value.currentView === 'myDiaryCalendar')
const showMyDiaryDetail = computed(() => viewState.value.currentView === 'myDiaryDetail')
const showMyDiaryCalendarForWrite = computed(() => viewState.value.currentView === 'myDiaryCalendarForWrite')

const selectedCategory = computed(() => viewState.value.data.selectedCategory)
const selectedGuestbookId = computed(() => viewState.value.data.selectedGuestbookId)
const selectedDiaryData = computed(() => viewState.value.data.selectedDiaryData)
const currentDiaryIndex = computed(() => viewState.value.data.currentDiaryIndex)
const pieceToSave = computed(() => viewState.value.data.pieceToSave)

const showSaveModal = computed(() => modalState.value.showSaveModal)
const showForestListModal = computed(() => modalState.value.showForestListModal)

const sidebarWidth = computed(() => {
  if (!isMenuOpen.value) return 60;
  const expandedViews = ['category', 'analyze', 'writeDiary', 'guestbookList', 'guestbookDetail', 'myItemView', 'myDiaryCalendar', 'myDiaryDetail', 'myDiaryCalendarForWrite']
  return expandedViews.includes(viewState.value.currentView) ? 576 : 360
})

// 함수들
const switchView = (viewName, data = {}) => {
  viewState.value.currentView = viewName
  Object.assign(viewState.value.data, data)
}

function openSaveModal(selectedPiece) {
  viewState.value.data.pieceToSave = selectedPiece
  modalState.value.showSaveModal = true
}

function closeSaveModal() {
  modalState.value.showSaveModal = false
}

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const authStore = useAuthStore()
const alertStore = useAlertStore()
const user = computed(() => authStore.user);
const token = computed(() => authStore.accessToken || '');
const forestId = computed(() => authStore.user?.forestId || '');
const nickname = computed(() => authStore.user?.nickname || "여행자");

onMounted(() => {
});


const logout = () => {
  showLogoutModal.value = true;
};

const handleLogoutConfirm = async () => {
  try {
    // 서버에 HttpOnly 쿠키 삭제 요청
    try {
      await api.post('auth/logout');
    } catch (postError) {
      console.error('POST 로그아웃 실패:', postError);
    }
    
    // authStore 상태 초기화
    await authStore.logout();
    
    router.push("/login");

  } catch (error) {
    router.push("/login");
  }
};

const handlePlace = (selectedPiece) => {
  viewState.value.data.pieceToSave = selectedPiece
  switchView('main')
  proxy.emitter.emit('place-item', selectedPiece);
};

async function confirmSaveToStorage() {
  if (!viewState.value.data.pieceToSave) {
    alert.show("저장할 조각 정보가 없습니다.")
    return
  }
  try {
    const pieceId     = pieceToSave.value.value;
    // URL · 헤더 · 쿼리 파라미터 수정
    await api.post(
      `item-storage?itemId=${pieceId}&forestId=${forestId.value}`,
      {},  // 바디는 빈 객체
      { headers: { Authorization: `Bearer ${token.value}` } }
    );
    closeSaveModal();
    // 강제 새로고침 방식으로 이동
    window.location.href = `/forest-detail/${forestId.value}`;

  } catch (e) {
    console.error(e);
    alert.show("보관소 저장에 실패했습니다. 다시 시도해주세요.")
  }
}

const handlePlaceFromStorage = (item) => {
  emit('placeFromStorage', item);
}

const toggleCategorySelector = async () => {
  if (viewState.value.currentView === 'category') {
    switchView('main', { selectedCategory: null })
  } else {
    switchView('category')
  }
};

const handleWriteDiaryBack = () => {
  switchView('category')
};

const handleCategorySelect = (categoryId) => {
  switchView('writeDiary', { selectedCategory: Number(categoryId) })
};

const handleGuestbook = () => {
  switchView('guestbookList')
};

const handleGuestbookBack = () => {
  switchView('main')
};

const handleGuestbookDetail = (id) => {
  switchView('guestbookDetail', { selectedGuestbookId: id })
};

const handleGuestbookDetailBack = () => {
  switchView('guestbookList')
};

const handleForestList = () => {
  emit("openForestList");
};

function openMyItemView() {
  switchView('myItemView')
}

function openMyInfoView() {
  switchView('myInfoView')
}

function closeMyInfoView() {
  switchView('main')
}

// MyInfoView 모달 관련 함수들
function openMyInfoModal(tab) {
  myInfoActiveTab.value = tab
  showMyInfoModal.value = true
}

function closeMyInfoModal() {
  showMyInfoModal.value = false
  // 폼 데이터 초기화
  myInfoPasswordForm.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
  myInfoNicknameForm.value = {
    newNickname: ''
  }
}

// 비밀번호 변경 함수
async function changeMyInfoPassword() {
  if (!myInfoPasswordForm.value.currentPassword || !myInfoPasswordForm.value.newPassword || !myInfoPasswordForm.value.confirmPassword) {
    alertStore.show("모든 필드를 입력해주세요.");
    return;
  }
  if (myInfoPasswordForm.value.newPassword !== myInfoPasswordForm.value.confirmPassword) {
    alertStore.show("새 비밀번호가 일치하지 않습니다.");
    return;
  }
  if (myInfoPasswordForm.value.newPassword.length < 8) {
    alertStore.show("새 비밀번호는 8자 이상이어야 합니다.");
    return;
  }

  try {
    await api.patch('auth/password', {
      currentPassword: myInfoPasswordForm.value.currentPassword,
      newPassword: myInfoPasswordForm.value.newPassword
    }, {
      headers: { Authorization: `Bearer ${authStore.accessToken}` }
    });

    alertStore.show("비밀번호가 성공적으로 변경되었습니다.");
    closeMyInfoModal();
  } catch (error) {
    console.error('비밀번호 변경 실패:', error);
    alertStore.show("비밀번호 변경에 실패했습니다. 현재 비밀번호를 확인해주세요.");
  }
}

// 닉네임 변경 함수 (EidtNickname.vue 로직 적용)
async function changeMyInfoNickname() {
  if (!myInfoNicknameForm.value.newNickname.trim() || myInfoNicknameForm.value.newNickname === authStore.user?.nickname) {
    alertStore.show("닉네임이 그대로에요!");
    return;
  }

  try {
    const response = await api.patch('/user/nickname', {
      nickname: myInfoNicknameForm.value.newNickname,
    });

    if (response.status >= 200 && response.status < 300) {
      // authStore 업데이트
      authStore.user.nickname = myInfoNicknameForm.value.newNickname;
      
      alertStore.show("닉네임 변경이 완료되었습니다!");
      closeMyInfoModal();
    } else {
      alertStore.show("닉네임 변경에 실패했습니다! 잠시 후 다시 시도해 주세요.");
      throw new Error(`닉네임 변경 실패: ${response.status}`);
    }
  } catch (error) {
    // 실패 시 원래 닉네임으로 복원
    myInfoNicknameForm.value.newNickname = authStore.user?.nickname || "";
    
    if (error.response?.data?.code == "U003") {
      alertStore.show(error.response.data.message);
    } else {
      alertStore.show("닉네임 변경에 실패했습니다! 잠시 후 다시 시도해 주세요.");
    }
  }
}

// 탈퇴 함수
function handleMyInfoWithdraw() {
  closeMyInfoModal();
  showMyInfoWithdrawModal.value = true;
}

async function confirmMyInfoWithdraw() {
  try {
    await api.delete('auth/withdraw', {
      headers: { Authorization: `Bearer ${authStore.accessToken}` }
    });
    await authStore.logout();
    
    await router.push({ path: "/login", query: { withdrawn: "true" } });
    
  } catch (error) {
    console.error('탈퇴 실패:', error);
    alertStore.show("탈퇴에 실패했습니다. 다시 시도해주세요.");
  } finally {
    showMyInfoWithdrawModal.value = false;
  }
}

// 업데이트 확인 함수
function checkMyInfoUpdates() {
  alertStore.show("현재 최신 버전을 사용하고 있습니다.");
}


function closeMyItemView() {
  switchView('main')
}

const handleViewDiary = () => {
  switchView('myDiaryCalendar')
};

const handleMyDiaryCalendarForWrite = () => {
  switchView('myDiaryCalendarForWrite')
}

const handleDiaryClick = (data) => {
  switchView('myDiaryDetail', { 
    selectedDiaryData: data,
    currentDiaryIndex: 0
  })
};

const handleDiaryDetailClose = () => {
  switchView('myDiaryCalendar', {
    selectedDiaryData: null,
    currentDiaryIndex: 0
  })
};

const handlePrevDiary = () => {
  if (viewState.value.data.currentDiaryIndex > 0) {
    viewState.value.data.currentDiaryIndex--;
  }
};

const handleNextDiary = () => {
  if (viewState.value.data.currentDiaryIndex < viewState.value.data.selectedDiaryData.diaries.length - 1) {
    viewState.value.data.currentDiaryIndex++;
  }
};

const handleDiarySave = (analysisResult) => {
  if (!analysisResult || !analysisResult.topEmotions) {
    console.error("유효하지 않은 분석 결과입니다:", analysisResult);
    alert.show("감정 분석에 실패했습니다. 다시 시도해주세요.");
    return;
  }

  switchView('main')

  const emotionMapping = {
    불안: "불안함",
    짜증: "짜증",
    우울: "우울함",
    슬픔: "슬픔",
    지침: "지침",
    설렘: "설렘",
    즐거움: "즐거움",
    평온: "평온함",
  };

  const emotions = Object.entries(analysisResult.topEmotions).map(
    ([label, percent]) => ({
      label: emotionMapping[label] || label,
      icon: emotionIcons[emotionMapping[label] || label],
      percent,
    })
  );

  const mainEmotion =
    emotionMapping[analysisResult.mainEmotion] || analysisResult.mainEmotion;

  const analysisData = {
    emotions,
    summaryMessage: `${mainEmotion}이(가) 가장 두드러지는 하루였네요!`,
    pieces: analysisResult.emotionItems.map((item) => ({
      value: item.id.toString(),
      label: item.name,
      icon: item.imageUrl,
    })),
  };

  Object.assign(dummyAnalysisResult, analysisData);
  switchView('analyze')
};

watch(
  () => route.params.forestId,
  () => {
    updateForestId();
  }
);
</script>
<template>
  <div class="side-wrapper">
    <div
      class="side-menu"
      :class="{
        open: isMenuOpen,
        'category-mode': viewState.currentView !== 'main'
      }"
      :style="{ width: sidebarWidth + 'px' }"
    >
      <div class="menu-content" v-if="isMenuOpen">
        <template v-if="showMyDiaryDetail">
          <MyDiaryDetail
            v-if="selectedDiaryData"
            :nickname="nickname"
            :year="selectedDiaryData.year"
            :month="selectedDiaryData.month"
            :day="selectedDiaryData.day"
            :emotions="selectedDiaryData.diaries[currentDiaryIndex].emotions"
            :content="selectedDiaryData.diaries[currentDiaryIndex].content"
            :showPrev="currentDiaryIndex > 0"
            :showNext="currentDiaryIndex < selectedDiaryData.diaries.length - 1"
            @close="handleDiaryDetailClose"
            @prev="handlePrevDiary"
            @next="handleNextDiary"
          />
        </template>
        <template v-else-if="showMyDiaryCalendarForWrite">
          <MyDiaryCalendarForWrite
            @close="switchView('main')"
            @new-diary-click="toggleCategorySelector"
          />
        </template>
        <template v-else-if="showMyDiaryCalendar">
          <MyDiaryCalendar
            @close="switchView('main')"
            @diary-click="handleDiaryClick"
          />
        </template>
        <template v-else-if="showMyItemView">
          <MyItemView
            :forestId="user?.forestId"
            @close="closeMyItemView"
            @placeFromStorage="handlePlaceFromStorage"
          />
        </template>
        <template v-else-if="showMyInfoView">
          <MyInfoView
            @close="closeMyInfoView"
            @openModal="openMyInfoModal"
          />
        </template>
        <template v-else-if="showGuestbookDetail">
          <GuestBookDetail
            :id="selectedGuestbookId"
            @back="handleGuestbookDetailBack"
          />
        </template>
        <template v-else-if="showGuestbookList">
          <GuestbookList
            @back="handleGuestbookBack"
            @show-detail="handleGuestbookDetail"
          />
        </template>
        <template v-else-if="showWriteDiary">
          <div class="top-bar">
            <button class="back-button" @click="handleWriteDiaryBack">
              ←
            </button>
          </div>
          <div class="relative-container">
            <WriteDiary
              :categoryId="selectedCategory"
              @save="handleDiarySave"
              @loading="(val) => (categoryLoading = val)"
              @request-confirm="emit('request-confirm', $event)"
            />
            <div v-if="categoryLoading" class="loading-overlay">
              <LoadingAnimation />
            </div>
          </div>
        </template>
        <template v-else-if="showCategorySelector">
          <div class="top-bar">
            <button
              v-if="!categoryLoading"
              class="back-button"
              @click="toggleCategorySelector"
            >
              ←
            </button>
          </div>
          <CategorySelector
            @select="handleCategorySelect"
            @loading="(val) => (categoryLoading = val)"
          />
        </template>
        <template v-else-if="showAnalyzeResult">
          <AnalyzeResult
            v-bind="dummyAnalysisResult"
            @place="handlePlace"
            @to-storage="openSaveModal"
          />
        </template>
        <template v-else>
          <div class="top-bar">
            <span class="logout-icon" @click="logout">
              <img :src="logoutIcon" class="btn-img" />
            </span>
          </div>
          <div class="greeting">
            <div>안녕하세요 {{ nickname }}님,</div>
            <div>오늘 하루는 어떠셨나요?</div>
          </div>
          <div class="menu-buttons">
            <button class="menu-btn" @click="handleMyDiaryCalendarForWrite">
              <span class="icon">
                <img :src="buttonIcon_1" class="btn-img" />
              </span>
              감정일기 작성하기
            </button>
            <button class="menu-btn" @click="handleViewDiary">
              <span class="icon">
                <img :src="buttonIcon_2" class="btn-img" />
              </span>
              감정일기 다시보기
            </button>
            <button class="menu-btn" @click="handleForestList">
              <span class="icon">
                <img :src="buttonIcon_3" class="btn-img" />
              </span>
              우정의 숲 입장하기
            </button>
            <button class="menu-btn" @click="openMyItemView">
              <span class="icon">
                <img :src="buttonIcon_5" class="btn-img" />
              </span>
              나의 조각 보기
            </button>
            
            <!-- 추후 개발 예정 -->
            <!-- <router-link to="/forestview" class="menu-btn">
              <span class="icon">
                <img :src="buttonIcon_4" class="btn-img" />
              </span>
              다른 숲 구경가기
            </router-link>
            <button class="menu-btn" @click="handleGuestbook">
              <span class="icon">
                <img :src="buttonIcon_6" class="btn-img" />
              </span>
              방명록 확인하기
            </button> -->

            <button class="menu-btn" @click="openMyInfoView">
              <span class="icon">
                <img :src="buttonIcon_7" class="btn-img" />
              </span>
              계정 정보 보기
            </button>
            
            <ForestListModal
              v-if="showForestListModal"
              :isOpen="showForestListModal"
              @close="showForestListModal = false"
            />
          </div>
        </template>
      </div>
    </div>
    <button class="toggle-button" @click="toggleMenu">
      <span v-if="isMenuOpen">»</span>
      <span v-else>«</span>
    </button>
    <ConfirmModal
            :is-open="showSaveModal"
            title="보관소에 저장"
            message="정말로 이 조각을 보관소에 저장하시겠습니까?"
            @confirm="confirmSaveToStorage"
            @cancel="closeSaveModal"
          />
    <ConfirmModal
            :is-open="showLogoutModal"
            title="로그아웃"
            message="정말 로그아웃 하시겠습니까?"
            @confirm="handleLogoutConfirm"
            @cancel="showLogoutModal = false"
          />
    
    <!-- MyInfoView 전체 화면 모달들 -->
    
    <!-- 비밀번호 변경 모달 -->
    <div v-if="showMyInfoModal && myInfoActiveTab === 'password'" class="fullscreen-modal" @click="closeMyInfoModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>비밀번호 변경</h2>
          <button class="close-btn" @click="closeMyInfoModal">×</button>
        </div>
        <div class="form-section">
          <div class="form-group">
            <label>현재 비밀번호</label>
            <input 
              type="password" 
              v-model="myInfoPasswordForm.currentPassword"
              placeholder="현재 비밀번호를 입력하세요"
            />
          </div>
          <div class="form-group">
            <label>새 비밀번호</label>
            <input 
              type="password" 
              v-model="myInfoPasswordForm.newPassword"
              placeholder="새 비밀번호를 입력하세요"
            />
          </div>
          <div class="form-group">
            <label>새 비밀번호 확인</label>
            <input 
              type="password" 
              v-model="myInfoPasswordForm.confirmPassword"
              placeholder="새 비밀번호를 다시 입력하세요"
            />
          </div>
          <div class="modal-buttons">
            <button class="cancel-btn" @click="closeMyInfoModal">
              취소
            </button>
            <button class="submit-btn" @click="changeMyInfoPassword">
              비밀번호 변경
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 닉네임 변경 모달 -->
    <div v-if="showMyInfoModal && myInfoActiveTab === 'nickname'" class="fullscreen-modal" @click="closeMyInfoModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>닉네임 변경</h2>
          <button class="close-btn" @click="closeMyInfoModal">×</button>
        </div>
        <div class="form-section">
          <div class="form-group">
            <label>현재 닉네임</label>
            <input 
              type="text" 
              :value="nickname"
              disabled
              class="disabled-input"
            />
          </div>
          <div class="form-group">
            <label>새 닉네임</label>
            <input 
              type="text" 
              v-model="myInfoNicknameForm.newNickname"
              placeholder="새 닉네임을 입력하세요 (최대 10자)"
              maxlength="10"
            />
          </div>
          <div class="modal-buttons">
            <button class="cancel-btn" @click="closeMyInfoModal">
              취소
            </button>
            <button class="submit-btn" @click="changeMyInfoNickname">
              닉네임 변경
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 탈퇴하기 모달 -->
    <div v-if="showMyInfoModal && myInfoActiveTab === 'withdraw'" class="fullscreen-modal" @click="closeMyInfoModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>계정 탈퇴</h2>
          <button class="close-btn" @click="closeMyInfoModal">×</button>
        </div>
        <div class="form-section">
          <div class="warning-message">
            <p>⚠️ 계정을 탈퇴하면 다음 정보가 모두 삭제됩니다:</p>
            <ul>
              <li>작성한 모든 감정일기</li>
              <li>숲에 배치한 모든 조각들</li>
              <li>개인정보 및 계정 데이터</li>
            </ul>
            <p>이 작업은 되돌릴 수 없습니다.</p>
          </div>
          <div class="modal-buttons">
            <button class="cancel-btn" @click="closeMyInfoModal">
              취소
            </button>
            <button class="danger-btn" @click="handleMyInfoWithdraw">
              계정 탈퇴하기
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 업데이트 정보 모달 -->
    <div v-if="showMyInfoModal && myInfoActiveTab === 'update'" class="fullscreen-modal" @click="closeMyInfoModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>업데이트 정보</h2>
          <button class="close-btn" @click="closeMyInfoModal">×</button>
        </div>
        <div class="form-section">
          <div class="update-info">
            <div class="version-info">
              <h3>현재 버전</h3>
              <p>v1.0.0</p>
            </div>
            <div class="update-actions">
              <button class="submit-btn" @click="checkMyInfoUpdates">
                업데이트 확인
              </button>
            </div>
            <div class="update-notes">
              <h3>최근 업데이트 내용</h3>
              <ul>
                <li>감정일기 작성 기능 추가</li>
                <li>숲 조각 배치 시스템 구현</li>
                <li>사용자 계정 관리 기능 추가</li>
              </ul>
            </div>
          </div>
          <div class="modal-buttons">
            <button class="cancel-btn" @click="closeMyInfoModal">
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 탈퇴 확인 모달 -->
    <div v-if="showMyInfoWithdrawModal" class="modal-overlay" @click="showMyInfoWithdrawModal = false">
      <div class="modal-content" @click.stop>
        <h3>정말로 탈퇴하시겠습니까?</h3>
        <p>계정 탈퇴 시 모든 데이터가 영구적으로 삭제되며, 복구할 수 없습니다.</p>
        <div class="modal-buttons">
          <button class="cancel-btn" @click="showMyInfoWithdrawModal = false">
            취소
          </button>
          <button class="danger-btn" @click="confirmMyInfoWithdraw">
            탈퇴하기
          </button>
        </div>
      </div>
    </div>
    
  </div>
</template>

<style scoped>
.toggle-button {
  width: 40px;
  height: 60px;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  font-size: 32px;
  border: none;
  cursor: pointer;
  position: absolute;
  left: -40px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.side-wrapper {
  position: relative;
  height: 100vh;
  display: flex;
  align-items: stretch;
}

.side-menu {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-right: 1.5px solid rgba(255, 255, 255, 0.25);
  padding: 0px 20px 20px 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  position: relative;
  overflow-y: auto;
  height: 100vh;
  scrollbar-width: none;
  -ms-overflow-style: none;
  overflow-x: hidden;
}

.side-menu::-webkit-scrollbar {
  display: none;
}

.side-menu.category-mode {
  background: rgba(255, 255, 255, 0.15);
  border: none;
}

.menu-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.top-bar {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 20px 24px;
  margin-bottom: 12px;
}

.logout-icon {
  font-size: 28px;
  color: #fff;
  cursor: pointer;
}

.greeting {
  color: #fff;
  font-size: 22px;
  font-weight: 500;
  text-align: center;
  margin-bottom: 36px;
  line-height: 1.5;
}

.menu-buttons {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}

.menu-btn {
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

.menu-btn:hover {
  background: rgba(255, 255, 255, 0.55);
}

.icon {
  font-size: 22px;
  margin-left: 18px;
}

.btn-img {
  width: 24px;
  height: 24px;
  object-fit: contain;
  margin-right: 8px;
  vertical-align: middle;
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

.relative-container {
  position: relative;
  flex: 1;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

/* 전체 화면 모달 */
.fullscreen-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  backdrop-filter: blur(8px);
}

.fullscreen-modal .modal-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 0;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.fullscreen-modal .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32px 32px 0 32px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  margin-bottom: 32px;
}

.fullscreen-modal .modal-header h2 {
  color: #2c3e50;
  font-size: 28px;
  font-weight: 700;
  margin: 0;
}

.fullscreen-modal .close-btn {
  background: rgba(0, 0, 0, 0.1);
  border: none;
  color: #666;
  font-size: 32px;
  cursor: pointer;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.fullscreen-modal .close-btn:hover {
  background: rgba(0, 0, 0, 0.2);
  color: #333;
}

.fullscreen-modal .form-section {
  padding: 0 32px 32px 32px;
}

.fullscreen-modal .form-section h3 {
  color: #2c3e50;
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 24px;
  text-align: center;
}

.fullscreen-modal .form-group {
  margin-bottom: 16px;
}

.fullscreen-modal .form-group label {
  display: block;
  color: #2c3e50;
  font-weight: 600;
  margin-bottom: 8px;
}

.fullscreen-modal .form-group input {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.8);
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  color: #2c3e50;
  font-size: 16px;
  box-sizing: border-box;
}

.fullscreen-modal .form-group input:focus {
  outline: none;
  border-color: #3498db;
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.fullscreen-modal .form-group input::placeholder {
  color: rgba(44, 62, 80, 0.6);
}

.fullscreen-modal .disabled-input {
  background: rgba(0, 0, 0, 0.05) !important;
  color: rgba(44, 62, 80, 0.6) !important;
  cursor: not-allowed;
}

.fullscreen-modal .submit-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #3498db, #2980b9);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 8px;
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
}

.fullscreen-modal .submit-btn:hover {
  background: linear-gradient(135deg, #2980b9, #1f5f8b);
  box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
}

.fullscreen-modal .cancel-btn {
  width: 100%;
  padding: 14px;
  background: rgba(0, 0, 0, 0.1);
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 8px;
}

.fullscreen-modal .cancel-btn:hover {
  background: rgba(0, 0, 0, 0.2);
  border-color: rgba(0, 0, 0, 0.2);
}

.fullscreen-modal .danger-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 8px;
  box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);
}

.fullscreen-modal .danger-btn:hover {
  background: linear-gradient(135deg, #c0392b, #a93226);
  box-shadow: 0 6px 20px rgba(231, 76, 60, 0.4);
}

.fullscreen-modal .warning-message {
  background: rgba(255, 193, 7, 0.1);
  border: 2px solid rgba(255, 193, 7, 0.3);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.fullscreen-modal .warning-message p {
  color: #2c3e50;
  font-weight: 600;
  margin: 0 0 12px 0;
}

.fullscreen-modal .warning-message ul {
  color: #2c3e50;
  margin: 8px 0;
  padding-left: 20px;
}

.fullscreen-modal .warning-message li {
  margin-bottom: 6px;
}

.fullscreen-modal .update-info {
  text-align: center;
}

.fullscreen-modal .version-info h3 {
  color: #2c3e50;
  font-size: 18px;
  margin-bottom: 8px;
}

.fullscreen-modal .version-info p {
  color: #3498db;
  font-size: 24px;
  font-weight: 700;
}

.fullscreen-modal .update-actions {
  margin-bottom: 24px;
}

.fullscreen-modal .update-notes h3 {
  color: #2c3e50;
  font-size: 18px;
  margin-bottom: 16px;
  text-align: left;
}

.fullscreen-modal .update-notes ul {
  color: #2c3e50;
  text-align: left;
  padding-left: 20px;
}

.fullscreen-modal .update-notes li {
  margin-bottom: 8px;
  line-height: 1.6;
}

.fullscreen-modal .modal-buttons {
  display: flex;
  gap: 16px;
  margin-top: 32px;
}

/* 전체 화면 모달 */
.fullscreen-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  backdrop-filter: blur(8px);
}

.fullscreen-modal .modal-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 0;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.fullscreen-modal .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32px 32px 0 32px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  margin-bottom: 32px;
}

.fullscreen-modal .modal-header h2 {
  color: #2c3e50;
  font-size: 28px;
  font-weight: 700;
  margin: 0;
}

.fullscreen-modal .close-btn {
  background: rgba(0, 0, 0, 0.1);
  border: none;
  color: #666;
  font-size: 32px;
  cursor: pointer;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.fullscreen-modal .close-btn:hover {
  background: rgba(0, 0, 0, 0.2);
  color: #333;
}

.fullscreen-modal .form-section {
  padding: 0 32px 32px 32px;
}

.fullscreen-modal .form-section h3 {
  color: #2c3e50;
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 24px;
  text-align: center;
}

.fullscreen-modal .form-group {
  margin-bottom: 16px;
}

.fullscreen-modal .form-group label {
  display: block;
  color: #2c3e50;
  font-weight: 600;
  margin-bottom: 8px;
}

.fullscreen-modal .form-group input {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.8);
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  color: #2c3e50;
  font-size: 16px;
  box-sizing: border-box;
}

.fullscreen-modal .form-group input:focus {
  outline: none;
  border-color: #3498db;
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.fullscreen-modal .form-group input::placeholder {
  color: rgba(44, 62, 80, 0.6);
}

.fullscreen-modal .disabled-input {
  background: rgba(0, 0, 0, 0.05) !important;
  color: rgba(44, 62, 80, 0.6) !important;
  cursor: not-allowed;
}

.fullscreen-modal .submit-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #3498db, #2980b9);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 8px;
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
}

.fullscreen-modal .submit-btn:hover {
  background: linear-gradient(135deg, #2980b9, #1f5f8b);
  box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
}

.fullscreen-modal .cancel-btn {
  width: 100%;
  padding: 14px;
  background: rgba(0, 0, 0, 0.1);
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 8px;
}

.fullscreen-modal .cancel-btn:hover {
  background: rgba(0, 0, 0, 0.2);
  border-color: rgba(0, 0, 0, 0.2);
}

.fullscreen-modal .danger-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 8px;
  box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);
}

.fullscreen-modal .danger-btn:hover {
  background: linear-gradient(135deg, #c0392b, #a93226);
  box-shadow: 0 6px 20px rgba(231, 76, 60, 0.4);
}

.fullscreen-modal .warning-message {
  background: rgba(255, 193, 7, 0.1);
  border: 2px solid rgba(255, 193, 7, 0.3);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.fullscreen-modal .warning-message p {
  color: #2c3e50;
  font-weight: 600;
  margin: 0 0 12px 0;
}

.fullscreen-modal .warning-message ul {
  color: #2c3e50;
  margin: 8px 0;
  padding-left: 20px;
}

.fullscreen-modal .warning-message li {
  margin-bottom: 6px;
}

.fullscreen-modal .update-info {
  text-align: center;
}

.fullscreen-modal .version-info h3 {
  color: #2c3e50;
  font-size: 18px;
  margin-bottom: 8px;
}

.fullscreen-modal .version-info p {
  color: #3498db;
  font-size: 24px;
  font-weight: 700;
}

.fullscreen-modal .update-actions {
  margin-bottom: 24px;
}

.fullscreen-modal .update-notes h3 {
  color: #2c3e50;
  font-size: 18px;
  margin-bottom: 16px;
  text-align: left;
}

.fullscreen-modal .update-notes ul {
  color: #2c3e50;
  text-align: left;
  padding-left: 20px;
}

.fullscreen-modal .update-notes li {
  margin-bottom: 8px;
  line-height: 1.6;
}

.fullscreen-modal .modal-buttons {
  display: flex;
  gap: 16px;
  margin-top: 32px;
}

/* 탈퇴 확인 모달 */
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
  z-index: 10001;
}

.modal-overlay .modal-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-overlay .modal-content h3 {
  color: #2c3e50;
  font-size: 20px;
  margin-bottom: 16px;
}

.modal-overlay .modal-content p {
  color: #2c3e50;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 24px;
}

.modal-overlay .modal-buttons {
  display: flex;
  gap: 12px;
}

.modal-overlay .cancel-btn {
  flex: 1;
  padding: 12px;
  background: rgba(0, 0, 0, 0.1);
  border: none;
  border-radius: 8px;
  color: #2c3e50;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.modal-overlay .cancel-btn:hover {
  background: rgba(0, 0, 0, 0.2);
}

.modal-overlay .danger-btn {
  flex: 1;
  padding: 12px;
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.modal-overlay .danger-btn:hover {
  background: linear-gradient(135deg, #c0392b, #a93226);
}

/* GROO 스타일 모달 오버라이드 */
.fullscreen-modal {
  background: rgba(218, 226, 182, 0.2) !important;
  backdrop-filter: blur(8px) !important;
}

.fullscreen-modal .modal-content {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.95)) !important;
  backdrop-filter: blur(25px) !important;
  border-radius: 24px !important;
  max-width: 450px !important;
  max-height: 70vh !important;
  box-shadow: 
    0 25px 80px rgba(58, 90, 64, 0.4),
    0 10px 30px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.8) !important;
  border: 2px solid rgba(58, 90, 64, 0.1) !important;
  position: relative !important;
}

.fullscreen-modal .modal-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #3a5a40, #4a6b4f, #5a7c5f, #4a6b4f, #3a5a40);
  border-radius: 24px 24px 0 0;
  z-index: 1;
}

.fullscreen-modal .modal-header {
  padding: 28px 28px 0 28px !important;
  border-bottom: 2px solid rgba(58, 90, 64, 0.1) !important;
  margin-bottom: 28px !important;
  position: relative !important;
}

.fullscreen-modal .modal-header::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, #3a5a40, #4a6b4f);
  border-radius: 2px;
}

.fullscreen-modal .modal-header h2 {
  color: #3a5a40 !important;
  font-size: 24px !important;
  font-weight: 800 !important;
  text-shadow: 0 2px 4px rgba(58, 90, 64, 0.1) !important;
  letter-spacing: -0.5px !important;
}

.fullscreen-modal .close-btn {
  background: linear-gradient(135deg, rgba(58, 90, 64, 0.1), rgba(74, 107, 79, 0.15)) !important;
  border: 2px solid rgba(58, 90, 64, 0.2) !important;
  color: #3a5a40 !important;
  font-size: 28px !important;
  width: 44px !important;
  height: 44px !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 4px 12px rgba(58, 90, 64, 0.2) !important;
}

.fullscreen-modal .close-btn:hover {
  background: linear-gradient(135deg, rgba(58, 90, 64, 0.2), rgba(74, 107, 79, 0.25)) !important;
  border-color: rgba(58, 90, 64, 0.3) !important;
  color: #2c3e50 !important;
  transform: scale(1.05) !important;
  box-shadow: 0 6px 20px rgba(58, 90, 64, 0.3) !important;
}

.fullscreen-modal .form-section {
  padding: 0 28px 28px 28px !important;
}

.fullscreen-modal .form-group {
  margin-bottom: 18px !important;
}

.fullscreen-modal .form-group label {
  color: #3a5a40 !important;
  font-weight: 700 !important;
  margin-bottom: 8px !important;
  font-size: 14px !important;
  letter-spacing: -0.3px !important;
}

.fullscreen-modal .form-group input {
  padding: 12px 16px !important;
  background: rgba(255, 255, 255, 0.9) !important;
  border: 2px solid rgba(58, 90, 64, 0.15) !important;
  border-radius: 12px !important;
  color: #3a5a40 !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 2px 8px rgba(58, 90, 64, 0.1) !important;
}

.fullscreen-modal .form-group input:focus {
  border-color: #4a6b4f !important;
  background: rgba(255, 255, 255, 1) !important;
  box-shadow: 0 0 0 4px rgba(74, 107, 79, 0.15), 0 4px 16px rgba(58, 90, 64, 0.2) !important;
  transform: translateY(-1px) !important;
}

.fullscreen-modal .submit-btn {
  padding: 14px !important;
  background: linear-gradient(135deg, #3a5a40, #4a6b4f, #5a7c5f) !important;
  border-radius: 12px !important;
  font-size: 15px !important;
  font-weight: 700 !important;
  transition: all 0.3s ease !important;
  margin-top: 8px !important;
  box-shadow: 0 6px 20px rgba(58, 90, 64, 0.4) !important;
  letter-spacing: -0.3px !important;
  position: relative !important;
  overflow: hidden !important;
}


.fullscreen-modal .submit-btn:hover {
  background: linear-gradient(135deg, #4a6b4f, #5a7c5f, #6a8d6f) !important;
  box-shadow: 0 8px 25px rgba(58, 90, 64, 0.5) !important;
  transform: translateY(-2px) !important;
}


.fullscreen-modal .cancel-btn {
  padding: 14px !important;
  background: rgba(58, 90, 64, 0.08) !important;
  border: 2px solid rgba(58, 90, 64, 0.2) !important;
  border-radius: 12px !important;
  color: #3a5a40 !important;
  font-size: 15px !important;
  font-weight: 600 !important;
  transition: all 0.3s ease !important;
  margin-top: 8px !important;
  box-shadow: 0 2px 8px rgba(58, 90, 64, 0.1) !important;
  letter-spacing: -0.3px !important;
}

.fullscreen-modal .cancel-btn:hover {
  background: rgba(58, 90, 64, 0.15) !important;
  border-color: rgba(58, 90, 64, 0.3) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 16px rgba(58, 90, 64, 0.2) !important;
}

.fullscreen-modal .danger-btn {
  padding: 14px !important;
  background: linear-gradient(135deg, #e74c3c, #c0392b, #a93226) !important;
  border-radius: 12px !important;
  font-size: 15px !important;
  font-weight: 700 !important;
  transition: all 0.3s ease !important;
  margin-top: 8px !important;
  box-shadow: 0 6px 20px rgba(231, 76, 60, 0.4) !important;
  letter-spacing: -0.3px !important;
  position: relative !important;
  overflow: hidden !important;
}


.fullscreen-modal .danger-btn:hover {
  background: linear-gradient(135deg, #c0392b, #a93226, #922b21) !important;
  box-shadow: 0 8px 25px rgba(231, 76, 60, 0.5) !important;
  transform: translateY(-2px) !important;
}


.fullscreen-modal .warning-message {
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 235, 59, 0.05)) !important;
  border: 2px solid rgba(255, 193, 7, 0.3) !important;
  border-radius: 14px !important;
  padding: 18px !important;
  margin-bottom: 20px !important;
  position: relative !important;
  box-shadow: 0 4px 16px rgba(255, 193, 7, 0.1) !important;
}

.fullscreen-modal .warning-message::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, rgba(255, 193, 7, 0.2), rgba(255, 235, 59, 0.1));
  border-radius: 14px;
  z-index: -1;
}

.fullscreen-modal .modal-buttons {
  gap: 14px !important;
  margin-top: 28px !important;
}
</style>
