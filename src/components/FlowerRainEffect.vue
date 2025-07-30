<template>
  <canvas ref="canvas" class="rain-canvas"></canvas>
</template>

<script setup>
import { onMounted, ref, onUnmounted } from "vue";

const canvas = ref(null);
let ctx;
let animationId;
let petals = [];

const canvasWidth = window.innerWidth / 2;
const canvasHeight = window.innerHeight;

const initCanvas = () => {
  const canvasEl = canvas.value;
  canvasEl.width = canvasWidth;
  canvasEl.height = canvasHeight;
  ctx = canvasEl.getContext("2d");
};

const createPetals = () => {
  const count = 80;
  const colors = [
    'rgba(255,182,193,0.7)', // 연한 분홍색
    'rgba(255,192,203,0.7)', // 밝은 분홍색
    'rgba(255,218,185,0.7)', // 복숭아색
    'rgba(255,228,196,0.7)', // 밝은 살구색
    'rgba(255,255,240,0.7)', // 아이보리
    'rgba(255,250,205,0.7)', // 레몬 샤워
    'rgba(255,228,225,0.7)', // 미스트 로즈
    'rgba(255,240,245,0.7)', // 라벤더 블러쉬
    'rgba(255,222,173,0.7)', // 나바호 화이트
    'rgba(255,228,181,0.7)'  // 모카신
  ];
  
  petals = Array.from({ length: count }, () => ({
    x: Math.random() * canvasWidth,
    y: Math.random() * canvasHeight,
    size: Math.random() * 8 + 4,
    speedY: Math.random() * 1.2 + 0.5,
    sway: Math.random() * 50 + 30,
    swaySpeed: Math.random() * 0.02 + 0.01,
    angle: Math.random() * Math.PI * 2,
    type: Math.floor(Math.random() * 3), // 0: 벚꽃, 1: 장미, 2: 개나리
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.02,
    color: colors[Math.floor(Math.random() * colors.length)]
  }));
};

const drawCherryBlossom = (x, y, size, rotation) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  
  // 꽃잎 5개 그리기
  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(
      size * Math.cos(angle - 0.2),
      size * Math.sin(angle - 0.2),
      size * Math.cos(angle),
      size * Math.sin(angle)
    );
    ctx.quadraticCurveTo(
      size * Math.cos(angle + 0.2),
      size * Math.sin(angle + 0.2),
      0, 0
    );
    ctx.fill();
  }
  
  // 꽃술 그리기
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 200, 0.8)';
  ctx.fill();
  
  ctx.restore();
};

const drawRose = (x, y, size, rotation) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  
  // 꽃잎 5개 그리기 (겹쳐서)
  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(
      size * 0.5 * Math.cos(angle - 0.3),
      size * 0.5 * Math.sin(angle - 0.3),
      size * Math.cos(angle - 0.1),
      size * Math.sin(angle - 0.1),
      size * Math.cos(angle),
      size * Math.sin(angle)
    );
    ctx.bezierCurveTo(
      size * Math.cos(angle + 0.1),
      size * Math.sin(angle + 0.1),
      size * 0.5 * Math.cos(angle + 0.3),
      size * 0.5 * Math.sin(angle + 0.3),
      0, 0
    );
    ctx.fill();
  }
  
  ctx.restore();
};

const drawForsythia = (x, y, size, rotation) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  
  // 4개의 꽃잎 그리기
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI * 2) / 4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(
      size * 0.7 * Math.cos(angle - 0.2),
      size * 0.7 * Math.sin(angle - 0.2),
      size * Math.cos(angle),
      size * Math.sin(angle)
    );
    ctx.quadraticCurveTo(
      size * 0.7 * Math.cos(angle + 0.2),
      size * 0.7 * Math.sin(angle + 0.2),
      0, 0
    );
    ctx.fill();
  }
  
  ctx.restore();
};

const drawPetals = () => {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  petals.forEach(petal => {
    const x = petal.x + Math.sin(petal.angle) * petal.sway;
    ctx.fillStyle = petal.color;
    
    switch(petal.type) {
      case 0:
        drawCherryBlossom(x, petal.y, petal.size, petal.rotation);
        break;
      case 1:
        drawRose(x, petal.y, petal.size, petal.rotation);
        break;
      case 2:
        drawForsythia(x, petal.y, petal.size, petal.rotation);
        break;
    }
  });
};

const updatePetals = () => {
  petals.forEach(petal => {
    petal.y += petal.speedY;
    petal.angle += petal.swaySpeed;
    petal.rotation += petal.rotationSpeed;

    if (petal.y > canvasHeight) {
      petal.y = -10;
      petal.x = Math.random() * canvasWidth;
      petal.rotation = Math.random() * Math.PI * 2;
    }
  });
};

const animate = () => {
  drawPetals();
  updatePetals();
  animationId = requestAnimationFrame(animate);
};

onMounted(() => {
  initCanvas();
  createPetals();
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
