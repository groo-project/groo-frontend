<template>
    <div class="dust-container">
      <canvas id="canvas-yellow-dust"></canvas>
    </div>
  </template>
  
  <script>
  export default {
    name: "CanvasYellowDust",
    mounted() {
      this.init();
    },
    methods: {
      init() {
        this.particles = [];
        this.canvas = document.getElementById("canvas-yellow-dust");
        this.ctx = this.canvas.getContext("2d");
        this.particleCount = 1200;
  
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
  
        for (let i = 0; i < this.particleCount; i++) {
          this.particles.push(this.createParticle());
        }
  
        window.addEventListener("resize", () => {
          this.canvas.width = window.innerWidth;
          this.canvas.height = window.innerHeight;
        });
  
        this.animate();
      },
  
      createParticle() {
        return {
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          size: Math.random() * 8 + 4, // 입자 크기 증가
          speedY: Math.random() * 1.5 + 0.5, // 수직 속도 증가
          speedX: Math.random() * 1.2 - 0.6, // 수평 속도 증가
          opacity: Math.random() * 0.2 + 0.05,
          phase: Math.random() * Math.PI * 2
        };
      },
  
      animate() {
        const draw = () => {
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  
          for (let particle of this.particles) {
            particle.x += particle.speedX + Math.sin(particle.phase) * 0.3;
            particle.y += particle.speedY;
            particle.phase += 0.01;
  
            this.ctx.beginPath();
            this.ctx.fillStyle = `rgba(200, 160, 60, ${particle.opacity})`;
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
  
            if (
              particle.y > this.canvas.height ||
              particle.x < 0 ||
              particle.x > this.canvas.width
            ) {
              Object.assign(particle, this.createParticle(), { y: 0 });
            }
          }
  
          requestAnimationFrame(draw);
        };
        draw();
      }
    }
  };
  </script>
  
  <style scoped>
  .dust-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 10;
  }
  
  canvas {
    width: 100%;
    height: 100%;
    filter: blur(3px);
    background: transparent;
  }
  </style>
  