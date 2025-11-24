<template>
    <div class="landing-bg">
      <div class="landing-content">
        <div class="intro-section">
          <h1 class="main-title">
            감정을 기록하고,<br> 
            나만의 숲을 꾸며보세요
          </h1>
          <p class="subtitle">하루의 감정을 소중히 기록하고, AI가 분석해주는 특별한 경험. 
            <br />친구와 함께 추억을 나누고, 기록의 조각으로 아름다운 숲을 만들어보세요
          </p>
        </div>
        
        <img class="island" src="@/assets/island.png" alt="섬" />
        
        <div class="features-intro">
          <h2 class="main-title">Groo의 특별한 기능들</h2>
          <p class="subtitle">감정 기록부터 숲 꾸미기까지, 모든 순간이 특별해집니다</p>
        </div>

        <div class="features-section">
          <div class="feature-card feature-card-portrait">
            <div class="feature-gif feature-gif-portrait">
              <video autoplay loop muted playsinline>
                <source src="@/assets/gifs/diary.mp4" type="video/mp4" />
              </video>
            </div>
            <!-- <div class="feature-icon">📝</div> -->
            <div class="feature-title">감정일기</div>
            <div class="feature-desc">하루의 감정을 기록하고<br />AI가 분석해드려요</div>
          </div>
          <div class="feature-card feature-card-landscape">
            <div class="feature-gif feature-gif-landscape">
              <video autoplay loop muted playsinline>
                <source src="@/assets/gifs/mate.mp4" type="video/mp4" />
              </video>
            </div>
            <!-- <div class="feature-icon">👥</div> -->
            <div class="feature-title">우정일기</div>
            <div class="feature-desc">친구와 함께 일기를 쓰고<br />추억을 공유해보세요</div>
          </div>
          <div class="feature-card feature-card-landscape">
            <div class="feature-gif feature-gif-landscape">
              <video autoplay loop muted playsinline>
                <source src="@/assets/gifs/forest.mp4" type="video/mp4" />
              </video>
            </div>
            <!-- <div class="feature-icon">🌳</div> -->
            <div class="feature-title">숲 꾸미기</div>
            <div class="feature-desc">감정일기로 얻은 조각으로<br />나만의 숲을 만들어요</div>
          </div>
        </div>

        <!-- FAQ 섹션 -->
        <div class="faq-section">
          <h2 class="faq-title">자주 묻는 질문</h2>
          <div class="faq-list">
            <div 
              v-for="(faq, index) in faqs" 
              :key="index"
              class="faq-item"
              :class="{ 'open': openFaqIndex === index }"
            >
              <div class="faq-question" @click="toggleFaq(index)">
                <span>{{ faq.question }}</span>
                <span class="faq-icon">{{ openFaqIndex === index ? '✕' : '+' }}</span>
              </div>
              <div class="faq-answer" v-if="openFaqIndex === index">
                {{ faq.answer }}
              </div>
            </div>
          </div>
        </div>

        <!-- 최종 CTA 섹션 -->
        <div class="cta-section" ref="ctaSection">
          <h2 class="cta-title">지금 바로 시작해보세요</h2>
          <p class="cta-subtitle">감정을 기록하고 나만의 숲을 만들어보세요</p>
          <button v-if="!isButtonFixed"
            class="start-btn"
            :class="{'static-btn': !isButtonFixed}"
            @click="goLogin"
          >GROO 시작하기
          </button>
        </div>
        <button v-if="isButtonFixed"
          class="start-btn"
          :class="{'fixed-btn' : isButtonFixed}"
          @click="goLogin"
        >GROO 시작하기
        </button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useMeta } from 'vue-meta';

  const isButtonFixed = ref(true); // 버튼이 고정 상태인지 여부
  const ctaSection = ref(null);    // CTA 섹션 요소를 참조할 ref
  onMounted(() => {
  if (ctaSection.value) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          // CTA 섹션이 뷰포트(브라우저 화면)에 진입하면
          // 버튼을 고정 상태(fixed)에서 해제합니다.
          isButtonFixed.value = entry.isIntersecting ? false : true;
        });
      },
      {
        rootMargin: '0px 0px -50px 0px', // CTA 섹션이 바닥에서 50px 위까지 올라왔을 때 감지
        threshold: 0.1 // 10%가 보이면 감지
      }
    );
    observer.observe(ctaSection.value);
  }
});

  const baseUrl = import.meta.env.VITE_APP_BASE_URL;

  useMeta({
    title: 'GROO | 감성 다이어리 서비스, 그루',
    
    meta: [
      {
        name: 'description',
        content: '감성 다이어리 서비스 그루에서 일상과 감정을 기록하고 숲을 꾸며보세요.',
      },
      { 
        rel: 'canonical',
        href: `${baseUrl}/landing`
      },
      { 
        property: 'og:title',
        content: '감성 다이어리 서비스 그루'
      },
      { 
        property: 'og:description', 
        content: '일상의 감정을 아름답게 기록하고 숲을 꾸며보세요.'
      },
      { 
        property: 'og:image', 
        content: `${baseUrl}/icon.png`
      },
      { 
        property: 'og:url', 
        content: `${baseUrl}/landing`
      },
      {
        property: 'og:type',
        content: 'website'
      }
    ],
  });

  const router = useRouter()
  function goLogin() {
    router.push('/login')
  }

  // FAQ 상태 관리
  const openFaqIndex = ref(null)
  
  const faqs = [
    {
      question: 'GROO는 어떤 서비스인가요?',
      answer: 'GROO는 일상의 감정을 기록하고 AI가 분석해주는 감성 다이어리 서비스입니다. 친구와 함께 일기를 쓰고, 기록한 감정으로 나만의 아름다운 숲을 꾸밀 수 있어요.'
    },
    {
      question: '친구들과 안전하게 공유할 수 있나요?',
      answer: '네, 안전하게 공유할 수 있습니다. GROO는 친구 초대를 통해서만 우정일기를 공유할 수 있으며 숲에 속해 있는 친구들만 우정일기를 볼 수 있어요.'
    },
    {
      question: '숲 꾸미기는 어떻게 되나요?',
      answer: '매일 감정을 기록할 때마다 당신의 숲에 나무와 꽃이 하나씩 추가되어 점점 자라갑니다. 다양한 감정을 기록할수록 더 풍부하고 아름다운 숲을 만들 수 있어요.'
    }
  ]

  function toggleFaq(index) {
    openFaqIndex.value = openFaqIndex.value === index ? null : index
  }
  </script>
  
  <style scoped>
  .landing-bg {
    width: 100vw;
    min-height: 100vh;
    background: url('@/assets/background.png') no-repeat center center;
    background-size: cover;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: 40px 20px 60px;
    box-sizing: border-box;
  }

  .landing-content {
    width: 100%;
    max-width: 1200px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    margin-top: 20px;
    margin-bottom: 100px;
    position: relative;
    padding-bottom: 100px;
  }

  .intro-section {
    text-align: center;
    z-index: 2;
    margin-bottom: 30px;
    position: relative;
  }

  .main-title {
    font-size: 4rem;
    font-weight: 700;
    color: #fff;
    margin: 0 0 16px 0;
    text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.3);
    letter-spacing: -1px;
  }

  .subtitle {
    font-size: 1.3rem;
    color: rgba(255, 255, 255, 0.95);
    margin: 0;
    line-height: 1.6;
    text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.2);
    font-weight: 400;
  }

  @keyframes float {
    0% { transform: translateY(0); }
    50% { transform: translateY(-30px); }
    100% { transform: translateY(0); }
  }

  .island {
    position: relative;
    width: 700px;
    max-width: 70vw;
    z-index: 1;
    margin: 20px 0 100px 0;
    animation: float 3s ease-in-out infinite;
    flex-shrink: 0;
  }
  .features-intro {
    margin-bottom: 80px;
    text-align: center;
  }

  .features-section {
    display: flex;
    gap: 32px;
    width: 100%;
    max-width: 1200px;
    justify-content: center;
    flex-wrap: wrap;
    z-index: 10;
    margin-top: 0;
    margin-bottom: 40px;
    position: relative;
  }

  .feature-card {
    background: rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: 28px 24px;
    text-align: center;
    min-width: 280px;
    flex: 1;
    max-width: 360px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    position: relative;
    z-index: 10;
  }

  .feature-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }

  .feature-gif {
    width: 100%;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 16px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.15);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  /* 세로형 비디오 (첫 번째 카드) */
  .feature-gif-portrait {
    height: 400px;
    overflow: hidden;
  }

  /* 가로형 비디오 (두 번째, 세 번째 카드) */
  .feature-gif-landscape {
    height: 400px;
  }

  .feature-gif video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* 세로형 카드 (첫 번째) */
  .feature-card-portrait {
    max-width: 360px;
    min-width: 280px;
  }

  /* 가로형 카드 (두 번째, 세 번째) */
  .feature-card-landscape {
    max-width: 420px;
    min-width: 320px;
  }

  .feature-icon {
    font-size: 2.5rem;
    margin-bottom: 8px;
    opacity: 0.8;
  }

  .feature-title {
    font-size: 1.6rem;
    font-weight: 600;
    color: #fff;
    margin-bottom: 10px;
    text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);
  }

  .feature-desc {
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.6;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.15);
  }

.start-btn {
  /* 기본 스타일: CTA 섹션 내부에 위치할 때의 스타일 */
  padding: 18px 48px;
  font-size: 1.5rem;
  font-weight: bold;
  color: #fff;
  background: rgba(180, 190, 195, 0.65);
  border: none;
  border-radius: 22px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 100;
  backdrop-filter: blur(10px);

  /* 기본 위치 설정 (Static 상태) */
  position: relative; /* CTA 섹션 내부에서 중앙 정렬을 위해 */
  margin: 32px auto 0 auto; /* 상위 요소의 text-align: center 또는 flex 정렬 이용 */
  display: block; /* margin: auto가 작동하도록 block 설정 */
  transform: none; /* fixed 상태의 transform 제거 */
}

/* 고정 상태일 때의 스타일 */
.fixed-btn {
  position: fixed; /* 👈 고정 */
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%); /* 👈 뷰포트 중앙 */
  margin: 0; /* static 상태의 margin 무시 */
}

  .start-btn:hover {
    background: rgba(220, 230, 235, 0.85);
    color: #fff;
    font-weight: bold;
  }

  /* FAQ 섹션 */
  .faq-section {
    width: 100%;
    max-width: 800px;
    margin: 80px 0;
    padding: 0 20px;
  }

  .faq-title {
    font-size: 2.5rem;
    font-weight: 700;
    color: #ffffff;
    text-align: center;
    margin-bottom: 40px;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .faq-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .faq-item {
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    overflow: hidden;
    transition: all 0.3s ease;
  }

  .faq-item:hover {
    background: rgba(255, 255, 255, 0.25);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }

  .faq-item.open {
    background: rgba(255, 255, 255, 0.3);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2);
  }

  .faq-question {
    padding: 20px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    font-size: 1.2rem;
    font-weight: 600;
    color: #ffffff;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
  }

  .faq-question:hover {
    color: #fff9e6;
  }

  .faq-icon {
    font-size: 1.5rem;
    font-weight: 300;
    color: #ffa500;
    min-width: 24px;
    text-align: center;
    transition: transform 0.3s ease;
  }

  .faq-item.open .faq-icon {
    transform: rotate(45deg);
  }

  .faq-answer {
    padding: 0 24px 20px 24px;
    font-size: 1rem;
    line-height: 1.7;
    color: rgba(255, 255, 255, 0.9);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* CTA 섹션 */
  .cta-section {
    text-align: center;
    margin: 80px 0 40px 0;
    padding: 60px 40px;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(15px);
    border-radius: 32px;
    border: 1px solid rgba(255, 255, 255, 0.25);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    width: 100%;
    max-width: 700px;
  }

  .cta-title {
    font-size: 2.8rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0 0 16px 0;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .cta-subtitle {
    font-size: 1.3rem;
    color: rgba(255, 255, 255, 0.9);
    margin: 0 0 32px 0;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  @media (max-width: 768px) {
    .landing-bg {
      padding: 30px 15px 40px;
    }

    .landing-content {
      gap: 20px;
      margin-top: 10px;
    }

    .main-title {
      font-size: 2.5rem;
    }

    .subtitle {
      font-size: 1rem;
    }

    .island {
      width: 500px;
      max-width: 85vw;
      margin: 15px 0 50px 0;
    }

    .features-section {
      gap: 20px;
      flex-direction: column;
      align-items: center;
      margin-top: 0;
      margin-bottom: 30px;
    }

    .feature-card {
      max-width: 100%;
      width: 100%;
      min-width: auto;
    }

    .start-btn {
      font-size: 1.2rem;
      padding: 16px 40px;
      bottom: 20px;
    }

    .faq-section {
      margin: 60px 0;
    }

    .faq-title {
      font-size: 2rem;
      margin-bottom: 30px;
    }

    .faq-question {
      font-size: 1.1rem;
      padding: 16px 20px;
    }

    .faq-answer {
      padding: 0 20px 16px 20px;
      font-size: 0.95rem;
    }

    .cta-section {
      margin: 60px 0 30px 0;
      padding: 40px 20px;
    }

    .cta-title {
      font-size: 2rem;
    }

    .cta-subtitle {
      font-size: 1.1rem;
    }
  }
  </style> 