<template>
    <canvas ref="canvas" class="rain-canvas"></canvas>
  </template>
  
  <script setup>
  import { onMounted, ref, onUnmounted } from "vue";
  
  let flashAlpha = 0;
  let lightningTimer = 0;
  
  const canvas = ref(null);
  let ctx;
  let animationId;
  let rainDrops = [];
  let splashes = [];
  
  const canvasWidth = window.innerWidth / 2;
  const canvasHeight = window.innerHeight;
  const splashLine = canvasHeight - 200;
  
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
    for (let i = 0; i < 90; i++) {
      rainDrops.push({
        x: Math.random() * width,
        y: Math.random() * height,
        length: Math.random() * 30 + 20,
        speed: Math.random() * 4 + 4.8,
      });
    }
  };
  
  const drawRain = () => {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  
    // 비
    ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    rainDrops.forEach(drop => {
      const maxY = Math.min(drop.y + drop.length, splashLine);
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x, maxY);
    });
    ctx.stroke();
  
    // 튀는 물방울
    splashes.forEach(splash => {
      ctx.beginPath();
      ctx.ellipse(
        splash.x,
        canvasHeight - 200,
        splash.radius * 1.5,
        splash.radius * 0.5,
        0,
        0,
        2 * Math.PI
      );
      ctx.strokeStyle = `rgba(255, 255, 255, ${splash.alpha})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    });
  
    // 번개 효과
    if (flashAlpha > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      flashAlpha -= 0.05 + Math.random() * 0.02; // 흔들리듯 감소
    }
  };
  
  const updateRain = () => {
    rainDrops.forEach(drop => {
      drop.y += drop.speed;
  
      if (drop.y + drop.length >= splashLine) {
        splashes.push({
          x: drop.x,
          radius: 1,
          alpha: 0.6
        });
  
        drop.y = 0;
        drop.x = Math.random() * canvasWidth;
      }
    });
  
    splashes.forEach(splash => {
      splash.radius += 1.2;
      splash.alpha -= 0.03;
    });
    splashes = splashes.filter(splash => splash.alpha > 0);
  
    // 번개 타이머 및 확률
    lightningTimer++;
    if (lightningTimer > 150) {
      if (Math.random() < 0.7) {
        flashAlpha = 1; // 밝기 최대로
      }
      lightningTimer = 0;
    }
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
    left: 0;
    width: 100vw;
    height: 150vh;
    z-index: 2;
    pointer-events: none;
  }
  </style>
  