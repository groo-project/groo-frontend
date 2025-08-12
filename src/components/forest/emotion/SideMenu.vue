<script setup>
import { ref, computed, onMounted, watch, getCurrentInstance } from "vue";
import axios from 'axios'
import MyDiaryCalendar from '@/components/forest/emotion/MyDiaryCalendar.vue';
import MyDiaryDetail from '@/components/forest/emotion/MyDiaryDetail.vue';

// Icons
import buttonIcon_1 from '@/icons/diarywrite_icon.png'
import buttonIcon_2 from '@/icons/diaryview_icon.png'
import buttonIcon_3 from '@/icons/forestmate_icon.png'
import buttonIcon_4 from '@/icons/forestview_icon.png'
import buttonIcon_5 from '@/icons/myitemview_icon.png'
import buttonIcon_6 from '@/icons/mailbox_icon.png'
import logoutIcon from '@/icons/logout_icon.png'

// Emotion Icons
import joyIcon from '@/icons/joy_icon.png'
import sadIcon from '@/icons/sad_icon.png'
import peacefulIcon from '@/icons/peaceful_icon.png'
import annoyIcon from '@/icons/annoy_icon.png'
import anxiousIcon from '@/icons/anxious_icon.png'
import melancholyIcon from '@/icons/melancholy_icon.png'
import tiredIcon from '@/icons/tired_icon.png'
import romanceIcon from '@/icons/romance_icon.png'

// Components
import CategorySelector from '@/components/forest/common/CategorySelector.vue'
import AnalyzeResult from '@/components/forest/common/AnalyzeResult.vue'
import WriteDiary from '@/components/forest/common/WriteDiary.vue'
import WriteGuestbook from '@/components/forest/common/guestbook/WriteGuestbook.vue'
import LoadingAnimation from '@/components/forest/common/LoadingAnimation.vue'
import GuestbookList from '@/components/forest/common/guestbook/GuestbookList.vue'
import { useRouter, useRoute } from 'vue-router'
import ConfirmModal from '@/components/forest/common/ConfirmModal.vue'
import GuestBookDetail from '@/components/forest/common/guestbook/GuestBookDetail.vue'
import ForestListModal from "@/components/forest/common/ForestListModal.vue";
import MyItemView from '@/components/forest/common/MyItemView.vue'
import AlertModal from '@/components/common/AlertModal.vue'

const { proxy } = getCurrentInstance();

const isMenuOpen = ref(true)
const showCategorySelector = ref(false)
const showAnalyzeResult = ref(false)
const showWriteDiary = ref(false)
const showGuestbookList = ref(false)
const showGuestbookDetail = ref(false)
const selectedGuestbookId = ref(null)
const categoryLoading = ref(false)
const selectedCategory = ref(null)
const showSaveModal = ref(false)
const pieceToSave = ref(null)
const showMyItemView = ref(false)
const showMyDiaryCalendar = ref(false)
const showMyDiaryDetail = ref(false)
const selectedDiaryData = ref(null)
const currentDiaryIndex = ref(0)
const showAlertModal = ref(false)
const alertMessage = ref('')

function openSaveModal(selectedPiece) {
  pieceToSave.value = selectedPiece
  showSaveModal.value = true
}

function closeSaveModal() {
  showSaveModal.value = false
}

const showForestListModal = ref(false)
const emit = defineEmits(["openForestList"])

const sidebarWidth = computed(() => {
  if (!isMenuOpen.value) return 60
  return showCategorySelector.value || showAnalyzeResult.value || showWriteDiary.value || showGuestbookList.value || showGuestbookDetail.value || showMyItemView.value || showMyDiaryCalendar.value || showMyDiaryDetail.value ? 576 : 360
})

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const router = useRouter();
const route = useRoute();

const currentForestId = computed(() => {
  // forest-detail/:forestId 경로에서 forestId 추출
  if (route.name === "ForestDetail") {
    return route.params.forestId;
  }
  return null;
});

// forestId를 localStorage에 저장
const updateForestId = () => {
  if (currentForestId.value) {
    localStorage.setItem("forestId", currentForestId.value);
  }
};

// 컴포넌트 마운트 시 forestId 저장
onMounted(() => {
  updateForestId();
});

// route가 변경될 때마다 forestId 업데이트
watch(
  () => route.params.forestId,
  () => {
    updateForestId();
  }
);

// 닉네임 가져오기
const nickname = localStorage.getItem("userNickname") || "여행자";

const logout = () => {
  // 로컬 스토리지 비우기
  localStorage.removeItem("accessToken");
  localStorage.removeItem("userNickname");
  localStorage.removeItem("myRecentforestId");
  router.push("/login");
};

const handleAnalyze = (category) => {
  console.log("Selected category:", category);
  // API 요청 시 카테고리 ID를 함께 전송
  setTimeout(() => {
    showAnalyzeResult.value = true;
  }, 2000);
};

const handlePlace = (selectedPiece) => {
  pieceToSave.value = selectedPiece
  showAnalyzeResult.value = false
  // 이벤트 버스를 통해 이벤트 전달
  proxy.emitter.emit('place-item', selectedPiece);
};

async function confirmSaveToStorage() {
  if (!pieceToSave.value) {
    alertMessage.value = "저장할 조각 정보가 없습니다."
    showAlertModal.value = true
    return
  }
  try {
    const accessToken = localStorage.getItem("accessToken");
    const forestId    = localStorage.getItem("forestId");
    const pieceId     = pieceToSave.value.value;
    // URL · 헤더 · 쿼리 파라미터 수정
    await axios.post(
      `http://localhost:8080/item-storage?itemId=${pieceId}&forestId=${forestId}`,
      {},  // 바디는 빈 객체
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    closeSaveModal();
    // 강제 새로고침 방식으로 이동
    window.location.href = `/forest-detail/${forestId}`;
  } catch (e) {
    console.error(e);
    alertMessage.value = "보관소 저장에 실패했습니다. 다시 시도해주세요."
    showAlertModal.value = true
  }
}

// 감정 아이콘 매핑 객체
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

const handleDiarySave = (analysisResult) => {
  console.log("Diary save result:", analysisResult);
  if (!analysisResult || !analysisResult.topEmotions) {
    console.error("유효하지 않은 분석 결과입니다:", analysisResult);
    alert("감정 분석에 실패했습니다. 다시 시도해주세요.");
    return;
  }

  showWriteDiary.value = false;

  // 감정 레이블 매핑
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

  // 분석 결과 데이터 설정
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

  // 분석 결과 데이터 업데이트
  Object.assign(dummyAnalysisResult, analysisData);
  // 분석 결과 화면으로 전환
  showAnalyzeResult.value = true;
};

const toggleCategorySelector = () => {
  if (showCategorySelector.value) {
    // 카테고리 선택 화면에서 뒤로가기: 모든 화면 닫기
    showWriteDiary.value = false;
    showCategorySelector.value = false;
    showAnalyzeResult.value = false;
    selectedCategory.value = null;
  } else {
    // 메인 메뉴에서 감정일기 작성하기 클릭: 카테고리 선택 화면 열기
    showCategorySelector.value = true;
  }
};

const handleWriteDiaryBack = () => {
  // 일기 작성 화면에서 뒤로가기: 카테고리 선택 화면으로 돌아가기
  showWriteDiary.value = false;
  showCategorySelector.value = true;
};

const handleCategorySelect = (categoryId) => {
  console.log("Selected category ID in SideMenu:", categoryId);
  selectedCategory.value = Number(categoryId); // Ensure it's a number
  showCategorySelector.value = false;
  showWriteDiary.value = true;
};

const handleWriteGuestbook = () => {
  showWriteGuestbook.value = true;
  showCategorySelector.value = false;
  showAnalyzeResult.value = false;
  showWriteDiary.value = false;
};

const handleWriteGuestbookBack = () => {
  showWriteGuestbook.value = false;
};

const handleGuestbook = () => {
  showGuestbookList.value = true;
  showGuestbookDetail.value = false;
  showCategorySelector.value = false;
  showAnalyzeResult.value = false;
  showWriteDiary.value = false;
};

const handleGuestbookBack = () => {
  showGuestbookList.value = false;
  showGuestbookDetail.value = false;
};

const handleGuestbookDetail = (id) => {
  console.log('Showing guestbook detail:', id);
  selectedGuestbookId.value = id;
  showGuestbookDetail.value = true;
};

const handleGuestbookDetailBack = () => {
  showGuestbookDetail.value = false;
};

// '우정의 숲 입장하기' 화면 열기
const handleForestList = () => {
  emit("openForestList");
};

// 더미 데이터 - 실제로는 API 응답으로 받을 데이터
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

function openMyItemView() {
  showCategorySelector.value = false;
  showAnalyzeResult.value = false;
  showWriteDiary.value = false;
  showGuestbookList.value = false;
  showGuestbookDetail.value = false;
  showMyItemView.value = true;
}

function closeMyItemView() {
  showMyItemView.value = false;
}

const handleViewDiary = () => {
  showMyDiaryCalendar.value = true;
  showCategorySelector.value = false;
  showAnalyzeResult.value = false;
  showWriteDiary.value = false;
  showGuestbookList.value = false;
  showGuestbookDetail.value = false;
  showMyItemView.value = false;
};

const handleDiaryClick = (data) => {
  selectedDiaryData.value = data;
  currentDiaryIndex.value = 0;
  showMyDiaryDetail.value = true;
  showMyDiaryCalendar.value = false;
};

const handleDiaryDetailClose = () => {
  showMyDiaryDetail.value = false;
  showMyDiaryCalendar.value = true;
  selectedDiaryData.value = null;
  currentDiaryIndex.value = 0;
};

const handlePrevDiary = () => {
  if (currentDiaryIndex.value > 0) {
    currentDiaryIndex.value--;
  }
};

const handleNextDiary = () => {
  if (currentDiaryIndex.value < selectedDiaryData.value.diaries.length - 1) {
    currentDiaryIndex.value++;
  }
};

function handlePlaceFromStorage(item) {
  emit('placeFromStorage', item);
}
</script>

<template>
  <div class="side-wrapper">
    <div
      class="side-menu"
      :class="{
        open: isMenuOpen,
        'category-mode':
          showCategorySelector ||
          showAnalyzeResult ||
          showWriteDiary ||
          showGuestbookList ||
          showMyDiaryCalendar ||
          showMyDiaryDetail
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
        <template v-else-if="showMyDiaryCalendar">
          <MyDiaryCalendar
            @close="showMyDiaryCalendar = false"
            @diary-click="handleDiaryClick"
          />
        </template>
        <template v-else-if="showMyItemView">
          <MyItemView
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
            <button class="menu-btn" @click="toggleCategorySelector">
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
    <AlertModal
            :is-open="showAlertModal"
            :message="alertMessage"
            @close="showAlertModal = false"
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
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  overflow-x: hidden; /* 좌우 스크롤 방지 */
}

.side-menu::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
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

.category-selector-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
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

.loading-animation {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
