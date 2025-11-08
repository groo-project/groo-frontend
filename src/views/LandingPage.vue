<template>
    <div class="landing-bg">
      <img class="island" src="@/assets/island.png" alt="섬" />
      <button class="start-btn" @click="goLogin">GROO 시작하기</button>
    </div>
  </template>
  
  <script setup>
  import { useRouter } from 'vue-router'
  import { useMeta } from 'vue-meta';

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
  </script>
  
  <style scoped>
  .landing-bg {
    width: 100vw;
    height: 100vh;
    background: url('@/assets/background.png') no-repeat center center;
    background-size: cover;
    position: relative;
    overflow: hidden;
  }
  @keyframes float {
    0% { transform: translate(-50%, -50%) translateY(0); }
    50% { transform: translate(-50%, -50%) translateY(-30px); }
    100% { transform: translate(-50%, -50%) translateY(0); }
  }
  .island {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 900px;
    max-width: 90vw;
    transform: translate(-50%, -50%);
    animation: float 3s ease-in-out infinite;
  }
  .start-btn {
    position: absolute;
    left: 50%;
    bottom: 60px;
    transform: translateX(-50%);
    padding: 18px 48px;
    font-size: 1.5rem;
    font-weight: bold;
    color: #fff;
    background: rgba(180, 190, 195, 0.65);
    border: none;
    border-radius: 22px;
    box-shadow: none;
    cursor: pointer;
    transition: background 0.2s, color 0.2s, font-weight 0.2s, transform 0.2s;
    z-index: 2;
  }
  .start-btn:hover {
    background: rgba(220, 230, 235, 0.85);
    color: #fff;
    font-weight: bold;
    transform: translateX(-50%) scale(1.03);
  }
  </style> 