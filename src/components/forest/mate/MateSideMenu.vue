<script setup>
import { ref, computed, getCurrentInstance } from "vue";
import buttonIcon_1 from "@/icons/diarywrite_icon.png";
import buttonIcon_2 from "@/icons/diaryview_icon.png";
import buttonIcon_3 from "@/icons/forestmate_icon.png";
import buttonIcon_4 from "@/icons/invite_icon.png";
import buttonIcon_5 from "@/icons/myitemview_icon.png";
import logoutIcon from "@/icons/logout_icon.png";
import previousIcon from "@/icons/previous_icon2.png";
import { useRouter } from "vue-router";
import InviteLinkModal from "@/components/forest/mate/InviteLinkModal.vue";
import MateDiaryCalendarForWrite from "./MateDiaryCalendarForWrite.vue";
import DiaryCalendar from '@/components/forest/mate/DiaryCalendar.vue';
import DiaryDetail from '@/components/forest/mate/DiaryDetail.vue';
import MyItemView from '@/components/forest/common/MyItemView.vue';
import CategorySelector from '@/components/forest/common/CategorySelector.vue';
import LoadingAnimation from '@/components/forest/common/LoadingAnimation.vue';
import AnalyzeResult from '@/components/forest/common/AnalyzeResult.vue';
import ConfirmModal from '@/components/forest/common/ConfirmModal.vue';
import { useAuthStore } from "@/stores/auth";
import api from "@/lib/api";

// Emotion Icons
import joyIcon from '@/icons/joy_icon.png'
import sadIcon from '@/icons/sad_icon.png'
import peacefulIcon from '@/icons/peaceful_icon.png'
import annoyIcon from '@/icons/annoy_icon.png'
import anxiousIcon from '@/icons/anxious_icon.png'
import melancholyIcon from '@/icons/melancholy_icon.png'
import tiredIcon from '@/icons/tired_icon.png'
import romanceIcon from '@/icons/romance_icon.png'
import MateWriteDiary from "./MateWriteDiary.vue";
import { useAlertStore } from '@/stores/alert'

const alert = useAlertStore()

// props로 forestId를 받아야함 (우정의 숲 ID)
const props = defineProps({
  forestId: {
    type: [String, Number],
    required: true
  }
});

const { proxy } = getCurrentInstance();
const router = useRouter();
const emit = defineEmits(["openShare", "openForestList", "openWithdraw", "request-confirm"]);
const authStore = useAuthStore();
const { user } = authStore;
const forestId = computed(() => user?.forestId ?? null);

const activeView = ref('main');
const isMenuOpen = ref(true);

const selectedDiaries = ref(null);
const currentDiaryIndex = ref(0);
const categoryLoading = ref(false);
const selectedCategory = ref(null);
const showInviteModal = ref(false);
const inviteLink = ref("");
const showLogoutModal = ref(false);

const analysisResult = ref({
  emotions: [],
  summaryMessage: '',
  pieces: []
});

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

const sidebarWidth = computed(() => {
  if (!isMenuOpen.value) return 60;
  const expandedViews = [
    'diaryCalendar',
    'myItems',
    'categorySelector',
    'writeDiary',
    'analyzeResult',
    'diaryDetail',
    'diaryCalendarForWrite'
  ];
  return expandedViews.includes(activeView.value) ? 576 : 360;
});

const handleMateDiaryCalendarForWrite = () => {
  activeView.value = 'diaryCalendarForWrite';
}

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const handleShare = () => {
  emit("openShare");
};

const goBack = () => {
  router.push('/forest-detail/' + forestId.value);
};

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

const handleWithdraw = () => {
  emit("openWithdraw");
};

const openDiaryCalendar = () => {
  activeView.value = 'diaryCalendar';
};

const closeDiaryCalendar = () => {
  activeView.value = 'main';
  selectedDiaries.value = null;
};

const handleDiaryClick = (data) => {
  selectedDiaries.value = data;
  if (data.diaries && data.diaries.length > 0) {
    currentDiaryIndex.value = 0;
    activeView.value = 'diaryDetail';
  }
};

const handlePrevDiary = () => {
  if (currentDiaryIndex.value > 0) {
    currentDiaryIndex.value--;
  }
};

const handleNextDiary = () => {
  if (currentDiaryIndex.value < selectedDiaries.value.diaries.length - 1) {
    currentDiaryIndex.value++;
  }
};

const closeDiaryDetail = () => {
  activeView.value = 'diaryCalendar';
  currentDiaryIndex.value = 0;
};

const openMyItems = () => {
  activeView.value = 'myItems';
};

const closeMyItems = () => {
  activeView.value = 'main';
};

const toggleCategorySelector = () => {
  if (activeView.value === 'categorySelector') {
    activeView.value = 'main';
    selectedCategory.value = null;
  } else if (activeView.value === 'writeDiary' || activeView.value === 'analyzeResult') {
    activeView.value = 'categorySelector';
    selectedCategory.value = null;
  } else {
    activeView.value = 'categorySelector';
  }
};

const handleCategorySelect = (categoryId) => {
  selectedCategory.value = Number(categoryId);
  activeView.value = 'writeDiary';
};

const handleDiarySave = async (result) => {
  
  
  if (!result || !result.topEmotions) {
    console.error("유효하지 않은 분석 결과입니다:", result);
    alert.show("감정 분석에 실패했습니다. 다시 시도해주세요.");
    return;
  }

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

  try {
    // 분석 결과 데이터 설정
    const emotions = Object.entries(result.topEmotions).map(
      ([label, percent]) => ({
        label: emotionMapping[label] || label,
        icon: emotionIcons[emotionMapping[label] || label],
        percent,
      })
    );

    const mainEmotion =
      emotionMapping[result.mainEmotion] || result.mainEmotion;

    const analysisData = {
      emotions,
      summaryMessage: `${mainEmotion}이(가) 가장 두드러지는 하루였네요!`,
      pieces: result.emotionItems.map((item) => ({
        value: item.id.toString(),
        label: item.name,
        icon: item.imageUrl,
      })),
    };

    // 분석 결과 데이터 업데이트
    analysisResult.value = analysisData;
    
    // 분석 결과 화면으로 전환
    activeView.value = 'analyzeResult';
  } catch (error) {
    console.error("분석 결과 처리 중 오류 발생:", error);
    alert.show("분석 결과 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
  }
};

const handlePlace = (selectedPiece) => {
  
  activeView.value = 'main';
  if (proxy && proxy.emitter) {
    proxy.emitter.emit('place-item', selectedPiece);
    
  } else {
    console.error('Emitter not available');
  }
};

const handleToStorage = (piece) => {
  activeView.value = 'main';
};

const handlePlaceFromStorage = (item) => {
  
  // 아이템 배치 이벤트 발생
  if (proxy && proxy.emitter) {
    proxy.emitter.emit('place-from-storage', item);
    
  } else {
    console.error('Emitter not available');
  }
  
  // MyItemView 닫기
  activeView.value = 'main';
};
</script>

<template>
  <div class="sidebar-container">
    <button class="toggle-button" @click="toggleMenu">
      <span v-if="isMenuOpen">»</span>
      <span v-else>«</span>
    </button>
    <div
      class="side-menu"
      :class="{ open: isMenuOpen }"
      :style="{ width: sidebarWidth + 'px' }"
    >
      <div class="menu-content" v-if="isMenuOpen">
        <div v-if="activeView === 'main'">
          <div class="top-bar">
            <span class="previous-icon" @click="goBack">
              <img :src="previousIcon" class="btn-img" />
            </span>
            <span class="logout-icon" @click="logout">
              <img :src="logoutIcon" class="btn-img" />
            </span>
          </div>
          <div class="greeting">
            <div>우정의 숲에</div>
            <div>들어오신걸 환영해요!</div>
          </div>
          <div class="menu-buttons">
            <button class="menu-btn" @click="handleMateDiaryCalendarForWrite">
              <span class="icon">
                <img :src="buttonIcon_1" class="btn-img" />
              </span>
              우정일기 작성하기
            </button>
            <button class="menu-btn" @click="openDiaryCalendar">
              <span class="icon">
                <img :src="buttonIcon_2" class="btn-img" />
              </span>
              우정일기 다시보기
            </button>
            <button class="menu-btn" @click="handleShare">
              <span class="icon">
                <img :src="buttonIcon_4" class="btn-img" />
              </span>
              우정의 숲 초대하기
            </button>
            <button class="menu-btn" @click="openMyItems">
              <span class="icon">
                <img :src="buttonIcon_5" class="btn-img" />
              </span>
              우리의 조각 보기
            </button>
            <button class="menu-btn" @click="handleWithdraw">
              <span class="icon">
                <img :src="buttonIcon_3" class="btn-img" />
              </span>
              우정의 숲 탈퇴하기
            </button>
          </div>
        </div>
        <template v-else-if="activeView === 'categorySelector'">
          <div class="top-bar">
            <button class="back-button" @click="toggleCategorySelector">
              ←
            </button>
          </div>
          <CategorySelector
            @select="handleCategorySelect"
            @loading="(val) => (categoryLoading = val)"
          />
        </template>
        <template v-else-if="activeView === 'writeDiary'">
          <div class="top-bar">
            <button class="back-button" @click="toggleCategorySelector">
              ←
            </button>
          </div>
          <div class="relative-container">
            <MateWriteDiary
              :forestId="props.forestId"
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
        <template v-else-if="activeView === 'analyzeResult'">
          <AnalyzeResult
            v-bind="analysisResult"
            @place="handlePlace"
            @to-storage="handleToStorage"
          />
        </template>
        <div v-else-if="activeView === 'diaryCalendar'" class="calendar-view">
          <DiaryCalendar
            :forestId="props.forestId"
            @close="closeDiaryCalendar"
            @diary-click="handleDiaryClick"
          />
        </div>
        <div v-else-if="activeView === 'diaryDetail'" class="diary-detail-view">
          <DiaryDetail
            v-if="selectedDiaries && selectedDiaries.diaries[currentDiaryIndex]"
            :nickname="selectedDiaries.diaries[currentDiaryIndex].nickname"
            :year="selectedDiaries.year"
            :month="selectedDiaries.month"
            :day="selectedDiaries.day"
            :emotions="selectedDiaries.diaries[currentDiaryIndex].emotions || []"
            :content="selectedDiaries.diaries[currentDiaryIndex].content"
            :showPrev="currentDiaryIndex > 0"
            :showNext="currentDiaryIndex < selectedDiaries.diaries.length - 1"
            @close="closeDiaryDetail"
            @prev="handlePrevDiary"
            @next="handleNextDiary"
          />
        </div>
        <div v-else-if="activeView === 'myItems'" class="myitem-view">
          <MyItemView 
            :forestId="props.forestId" 
            @close="closeMyItems" 
            @placeFromStorage="handlePlaceFromStorage"
          />
        </div>
        <div v-else-if="activeView === 'diaryCalendarForWrite'">
          <MateDiaryCalendarForWrite 
            @close="activeView = 'main'"
            @new-diary-click="toggleCategorySelector"
          />
        </div>
      </div>
    </div>
    <InviteLinkModal
      v-if="showInviteModal"
      :inviteLink="inviteLink"
      @close="showInviteModal = false"
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
.sidebar-container {
  position: relative;
  height: 100%;
}

.side-menu {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-right: 1.5px solid rgba(255, 255, 255, 0.25);
  height: 100vh;
  padding: 0px 20px 20px 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  transition: width 0.3s ease;
  position: relative;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.toggle-button {
  width: 40px;
  height: 60px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  color: #fff;
  font-size: 32px;
  border: none;
  cursor: pointer;
  position: absolute;
  left: -40px;
  top: 50vh;
  transform: translateY(-50%);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.side-menu::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.side-menu.open {
  background: rgba(255, 255, 255, 0.15);
}

.menu-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-top: 20px;
}

.top-bar {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  margin-bottom: 32px;
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
  width: 100%;
  height: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
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

.calendar-view,
.diary-detail-view,
.myitem-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 20px;
  box-sizing: border-box;
}

.logout-icon {
  margin-left: auto;
  cursor: pointer;
}

.previous-icon:hover {
  cursor: pointer;
}
</style>
