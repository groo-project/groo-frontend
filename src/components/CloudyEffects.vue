<template>
    <div class="cloudWrapper">
      <div id="cloudLayer_01" class="cloud">
        <div class="image01" :style="getImageStyle(clouds)"></div>
        <div class="image02" :style="getImageStyle(clouds)"></div>
      </div>
      <div id="cloudLayer_02" class="cloud">
        <div class="image01" :style="getImageStyle(clouds)"></div>
        <div class="image02" :style="getImageStyle(clouds)"></div>
      </div>
      <div id="cloudLayer_03" class="cloud">
        <div class="image01" :style="getImageStyle(clouds)"></div>
        <div class="image02" :style="getImageStyle(clouds)"></div>
      </div>
    </div>
  </template>
  
  <script setup>
  import clouds from '../assets/clouds.jpg';  // 흐린 구름 텍스처
  
  const getImageStyle = (image) => ({
    background: `url(${image}) center center/cover no-repeat transparent`
  });
  </script>
  
  <style scoped>
  .cloudWrapper {
    position: fixed;
    top: 0;
    left: 0;
    width: 300vw;
    height: 100vh;
    pointer-events: none;
    z-index: 900;
    filter: blur(1px) grayscale(0.1) brightness(1);
    background-color: rgba(0, 0, 0, 0.05);
  }
  
  #cloudLayer_01, #cloudLayer_02, #cloudLayer_03 {
    position: absolute;
    width: 500%;
    height: 100%;
  }
  
  #cloudLayer_01 .image01, #cloudLayer_01 .image02,
  #cloudLayer_02 .image01, #cloudLayer_02 .image02,
  #cloudLayer_03 .image01, #cloudLayer_03 .image02 {
    float: left;
    width: 50%;
    height: 150%;
    background-repeat: repeat-x;
    opacity: 0.5;
  }
  
  #cloudLayer_01 {
    animation: cloud_move 60s linear infinite, cloud_opacity_01 20s ease-in-out infinite;
  }
  #cloudLayer_02 {
    animation: cloud_move 80s linear infinite, cloud_opacity_02 30s ease-in-out infinite;
  }
  #cloudLayer_03 {
    animation: cloud_move 100s linear infinite, cloud_opacity_03 40s ease-in-out infinite;
  }
  
  @keyframes cloud_move {
    0%   { left: 0; }
    100% { left: -100%; }
  }
  
  @keyframes cloud_opacity_01 {
    0% { opacity: 0.1; }
    50% { opacity: 0.9; }
    100% { opacity: 0.5; }
  }
  @keyframes cloud_opacity_02 {
    0% { opacity: 0.5; }
    50% { opacity: 0.1; }
    100% { opacity: 0.3; }
  }
  @keyframes cloud_opacity_03 {
    0% { opacity: 0.3; }
    50% { opacity: 0.7; }
    100% { opacity: 0.1; }
  }
  
  @media (max-width: 767px) {
    #cloudLayer_01 .image01, #cloudLayer_01 .image02,
    #cloudLayer_02 .image01, #cloudLayer_02 .image02,
    #cloudLayer_03 .image01, #cloudLayer_03 .image02 {
      width: 300%;
    }
  }
  </style>
  