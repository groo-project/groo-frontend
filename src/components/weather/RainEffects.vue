<template>
    <canvas ref="canvas" class="rain-canvas"></canvas>
  </template>
  
  <script setup>
  import { onMounted, ref, onUnmounted } from "vue";
  
  const canvas = ref(null);
  let ctx;
  let animationId;
  let rainDrops = [];
  let splashes = [];
  
  const canvasWidth = window.innerWidth / 2;
  const canvasHeight = window.innerHeight;
  const splashLine = canvasHeight - 200;            /* 비 튀는 위치 */
  
  const initCanvas = () => {
    const canvasEl = canvas.value;
    canvasEl.width = canvasWidth;
    canvasEl.height = canvasHeight;
    ctx = canvasEl.getContext("2d");
  };
  
  const createRain = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    rainDrops = [];
    for (let i = 0; i < 90; i++) {       // 비의 양 조절
      rainDrops.push({
        x: Math.random() * width,
        y: Math.random() * height,
        length: Math.random() * 30 + 20,            /* 비 길이 조절 */
        speed: Math.random() * 4 + 4.8,             /* 비 속도 조절  */
      });
    }
  };
  
  const drawRain = () => {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  
    // 비 그리기
    ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";     /* 비 투명도 조절 */
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    rainDrops.forEach(drop => {
      const maxY = Math.min(drop.y + drop.length, splashLine);  // 💡 비가 튐 위치까지만 내려가도록
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x, maxY);
    });
    ctx.stroke();
  
    // 비 튀기는 효과
    splashes.forEach(splash => {
      ctx.beginPath();
      //ctx.arc(splash.x, canvasHeight - 2, splash.radius, 0, 2 * Math.PI);   /* 물 튈때 효과 (동그랗게) */
      ctx.ellipse(
        splash.x,              // x 좌표
        canvasHeight - 200,    // y 좌표 (거의 바닥)
        splash.radius * 1.5,   // x축 반지름: 더 넓게
        splash.radius * 0.5,   // y축 반지름: 더 얕게
        0,                     // 회전 없음
        0,                     // 시작 각도
        2 * Math.PI            // 끝 각도
      );
  
      ctx.strokeStyle = `rgba(255, 255, 255, ${splash.alpha})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    });
  };
  
  const updateRain = () => {
    rainDrops.forEach(drop => {
      drop.y += drop.speed;
  
      if (drop.y + drop.length >= splashLine) {  // 💡 비가 튐 위치 이상 내려가지 않도록
        // Add splash
        splashes.push({
          x: drop.x,
          radius: 1,
          alpha: 0.6
        });
  
        // Reset drop
        drop.y = 0;
        drop.x = Math.random() * canvasWidth;
      }
    });
  
    // Update splashes
    splashes.forEach(splash => {
      splash.radius += 1.2;
      splash.alpha -= 0.03;
    });
  
    // Remove faded splashes
    splashes = splashes.filter(splash => splash.alpha > 0);
  };
  
  const animate = () => {
    drawRain();
    updateRain();
    animationId = requestAnimationFrame(animate);
  };
  
  onMounted(() => {
    initCanvas();
    createRain();
    animate();
  });
  
  onUnmounted(() => {
    cancelAnimationFrame(animationId);
  });
  </script>
  
  <style scoped>
  .rain-canvas {
    position: absolute;
    top: 0;
    left: 0;        /* 왼쪽에 고정 */
    width: 100vw;    /* 절반만 위치 */
    height: 150vh;
    z-index: 2;
    pointer-events: none;
  }
  </style>
  