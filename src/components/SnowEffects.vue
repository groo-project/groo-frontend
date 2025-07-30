<template>
    <canvas id="canvas"></canvas>
  </template>
  
  <script>
  export default {
    name: "CanvasSnow",
    mounted() {
      this.init();
    },
    methods: {
      init() {
        this.flakes = [];
        this.canvas = document.getElementById("canvas");
        this.ctx = this.canvas.getContext("2d");
        this.flakeCount = 400;
        this.mX = -100;
        this.mY = -100;
        
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        // 눈송이 객체들 초기화
        for (let i = 0; i < this.flakeCount; i++) {
          const flake = {
            x: Math.floor(Math.random() * this.canvas.width),
            y: Math.floor(Math.random() * this.canvas.height),
            size: Math.random() * 3 + 2,
            speed: Math.random() * 1 + 0.5,
            velY: 0,
            velX: 0,
            opacity: Math.random() * 0.5 + 0.3,
            step: 0,
            stepSize: Math.random() / 30
          };
          flake.velY = flake.speed;
          this.flakes.push(flake);
        }

        this.addEventListeners();
        this.startSnowfall();
      },
  
      addEventListeners() {
        window.addEventListener("resize", () => {
          this.canvas.width = window.innerWidth;
          this.canvas.height = window.innerHeight;
        });
  
        this.canvas.addEventListener("mousemove", (e) => {
          this.mX = e.clientX;
          this.mY = e.clientY;
        });
      },
  
      startSnowfall() {
        const snow = () => {
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  
          for (let i = 0; i < this.flakeCount; i++) {
            const flake = this.flakes[i];
            const x = this.mX;
            const y = this.mY;
            const minDist = 150;
            const x2 = flake.x;
            const y2 = flake.y;
  
            const dist = Math.sqrt((x2 - x) * (x2 - x) + (y2 - y) * (y2 - y));
            const dx = x2 - x;
            const dy = y2 - y;
  
            if (dist < minDist) {
              const force = minDist / (dist * dist);
              const xcomp = (x - x2) / dist;
              const ycomp = (y - y2) / dist;
              const deltaV = force / 2;
  
              flake.velX -= deltaV * xcomp;
              flake.velY -= deltaV * ycomp;
            } else {
              flake.velX *= 0.98;
              if (flake.velY <= flake.speed) {
                flake.velY = flake.speed;
              }
              flake.velX += Math.cos(flake.step += 0.05) * flake.stepSize;
            }
  
            this.ctx.fillStyle = `rgba(255,255,255,${flake.opacity})`;
            flake.y += flake.velY;
            flake.x += flake.velX;
  
            if (flake.y >= this.canvas.height || flake.y <= 0) {
              this.reset(flake);
            }
  
            if (flake.x >= this.canvas.width || flake.x <= 0) {
              this.reset(flake);
            }
  
            this.ctx.beginPath();
            this.ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
            this.ctx.fill();
          }
          requestAnimationFrame(snow);
        };
        snow();
      },
  
      reset(flake) {
        flake.x = Math.floor(Math.random() * this.canvas.width);
        flake.y = 0;
        flake.size = Math.random() * 3 + 2;
        flake.speed = Math.random() * 1 + 0.5;
        flake.velY = flake.speed;
        flake.velX = 0;
        flake.opacity = Math.random() * 0.5 + 0.3;
      }
    }
  };
  </script>
  
  <style scoped>
  canvas {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
  }
  </style>

