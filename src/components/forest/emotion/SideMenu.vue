<script setup>
import { ref, computed, onMounted, watch, getCurrentInstance } from "vue";
import { useRouter, useRoute } from 'vue-router'
import MyDiaryCalendar from '@/components/forest/emotion/MyDiaryCalendar.vue';
import MyDiaryDetail from '@/components/forest/emotion/MyDiaryDetail.vue';
import api from '@/lib/api.js'
import { useAuthStore } from '@/stores/auth.js'



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
import MyDiaryCalendarForWrite from "./MyDiaryCalendarForWrite.vue";

import buttonIcon_1 from '@/icons/diarywrite_icon.png'
import buttonIcon_2 from '@/icons/diaryview_icon.png'
import buttonIcon_3 from '@/icons/forestmate_icon.png'
import buttonIcon_5 from '@/icons/myitemview_icon.png'
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
const emit = defineEmits(["openForestList", "showAlert"]);
const { proxy } = getCurrentInstance();

const forwardShowAlert = (msg) => {
  emit("showAlert", msg);
}

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
// const selectedCategory = ref(null)
// const showSaveModal = ref(false)
// const pieceToSave = ref(null)
// const showMyItemView = ref(false)
// const showMyDiaryCalendar = ref(false)
// const showMyDiaryDetail = ref(false)
// const selectedDiaryData = ref(null)
// const currentDiaryIndex = ref(0)
// const showAlertModal = ref(false)
// const alertMessage = ref('')
const showLogoutModal = ref(false)


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

const authStore = useAuthStore();
const user = computed(() => authStore.user);
const token = computed(() => authStore.accessToken || '');
const forestId = computed(() => authStore.user?.forestId || '');
const nickname = computed(() => authStore.user?.nickname || "여행자");

const currentForestId = computed(() => {
  // forest-detail/:forestId 경로에서 forestId 추출
  if (route.name === "ForestDetail") {
    return route.params.forestId || forestId;
  }
  return null;
});


// 컴포넌트 마운트 시 nickname 상태 확인
onMounted(() => {
  // console.log('=== SideMenu Mounted ===');
  // console.log('authStore:', authStore);
  // console.log('user:', user.value);
  // console.log('닉네임:', nickname.value);
  // console.log('숲 ID:', forestId.value);
  // console.log('token:', token.value);
  // console.log('========================');
});


const logout = () => {
  showLogoutModal.value = true;
};

const handleLogoutConfirm = async () => {
  try {

    
    // 로그아웃 모달 닫기
    showLogoutModal.value = false;
    
    // 실제 로그아웃 처리
    await authStore.logout();
    
    // 로그인 페이지로 이동
    router.push("/login");
  } catch (error) {
    console.error('로그아웃 실패:', error);
    
    // 에러가 발생해도 로그인 페이지로 이동
    try {
      router.push("/login");
    } catch (routerError) {
      console.error('라우터 이동 실패:', routerError);
      // 라우터 이동이 실패하면 페이지 새로고침
      window.location.href = "/login";
    }
  }
};

const handlePlace = (selectedPiece) => {
  viewState.value.data.pieceToSave = selectedPiece
  switchView('main')
  proxy.emitter.emit('place-item', selectedPiece);
};

async function confirmSaveToStorage() {
  if (!viewState.value.data.pieceToSave) {
    emit('showAlert', "저장할 조각 정보가 없습니다.")
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
    emit('showAlert', "보관소 저장에 실패했습니다. 다시 시도해주세요.")
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
    alert("감정 분석에 실패했습니다. 다시 시도해주세요.");
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
            @showAlert="forwardShowAlert"
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
              @showAlert="forwardShowAlert"
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
</style>
