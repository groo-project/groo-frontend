<template>
    <div class="fogwrapper">
      <div id="foglayer_01" class="fog">
        <div class="image01"></div>
        <div class="image02"></div>
      </div>
      <div id="foglayer_02" class="fog">
        <div class="image01"></div>
        <div class="image02"></div>
      </div>
      <div id="foglayer_03" class="fog">
        <div class="image01"></div>
        <div class="image02"></div>
      </div>
    </div>
  </template>
  
  <script setup>
  // 별도 스크립트 로직이 필요 없다면 비워 두어도 됩니다.
  </script>
  
  <style>
  html, body {
    margin: 0;
    padding: 0;
  }
  body {
    background: rgba(0, 0, 0, 1);
    overflow-x: hidden;
  }
  
  /* ---------- Fog ---------- */
  .fogwrapper {
    height: 100%;
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    pointer-events: none;
    z-index: 100;
    filter: blur(2px) grayscale(0.2) saturate(1.2) sepia(0.2);
  }
  #foglayer_01, #foglayer_02, #foglayer_03 {
    height: 100%;
    position: absolute;
    width: 200%;
  }
  #foglayer_01 .image01, #foglayer_01 .image02,
  #foglayer_02 .image01, #foglayer_02 .image02,
  #foglayer_03 .image01, #foglayer_03 .image02 {
    float: left;
    height: 100%;
    width: 50%;
    background-repeat: repeat-x;
  }
  
  /* 레이어별 애니메이션 설정 */
  #foglayer_01 {
    animation: foglayer_01_opacity 10s linear infinite,
               foglayer_moveme 15s linear infinite;
  }
  #foglayer_02, #foglayer_03 {
    animation: foglayer_02_opacity 21s linear infinite,
               foglayer_moveme 13s linear infinite;
  }
  
  /* 배경 이미지 */
  #foglayer_01 .image01,
  #foglayer_01 .image02 {
    background: url("https://raw.githubusercontent.com/danielstuart14/CSS_FOG_ANIMATION/master/fog1.png")
                center center/cover no-repeat transparent;
  }
  #foglayer_02 .image01, #foglayer_02 .image02,
  #foglayer_03 .image01, #foglayer_03 .image02 {
    background: url("https://raw.githubusercontent.com/danielstuart14/CSS_FOG_ANIMATION/master/fog2.png")
                center center/cover no-repeat transparent;
  }
  
  /* Keyframes */
  @keyframes foglayer_01_opacity {
    0%   { opacity: .4; }
    22%  { opacity: .7; }
    40%  { opacity: .5; }
    58%  { opacity: .6; }
    80%  { opacity: .4; }
    100% { opacity: .4; }
  }
  @keyframes foglayer_02_opacity {
    0%   { opacity: .5; }
    25%  { opacity: .4; }
    50%  { opacity: .6; }
    80%  { opacity: .8; }
    100% { opacity: .5; }
  }
  @keyframes foglayer_03_opacity {
    0%   { opacity: .5; }
    27%  { opacity: .5; }
    52%  { opacity: .8; }
    68%  { opacity: .6; }
    100% { opacity: .4; }
  }
  
  @keyframes foglayer_moveme {
    0%   { left: 0; }
    100% { left: -100%; }
  }
  
  /* 모바일 대응 */
  @media (max-width: 767px) {
    #foglayer_01 .image01, #foglayer_01 .image02,
    #foglayer_02 .image01, #foglayer_02 .image02,
    #foglayer_03 .image01, #foglayer_03 .image02 {
      width: 3000%;
    }
  }
  </style>