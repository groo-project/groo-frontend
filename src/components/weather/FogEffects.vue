<template>
  <div class="fog-wrapper">
    <div id="fog-layer-01" class="fog">
      <div class="image01"></div>
      <div class="image02"></div>
    </div>
    <div id="fog-layer-02" class="fog">
      <div class="image01"></div>
      <div class="image02"></div>
    </div>
  </div>
</template>

<script setup>
// No script logic needed
</script>

<style scoped>
.fog-wrapper {
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  pointer-events: none;
  z-index: 1000;
  filter: blur(1px) brightness(0.99);
}

#fog-layer-01, #fog-layer-02 {
  height: 100%;
  position: absolute;
  width: 200%;
}

#fog-layer-01 .image01, #fog-layer-01 .image02,
#fog-layer-02 .image01, #fog-layer-02 .image02 {
  float: left;
  height: 100%;
  width: 50%;
  background: url("https://64.media.tumblr.com/224f9198d5d88a5e92e43f5ef4f7a592/139ff9bb70edd708-66/s540x810/0edbf6d586b6b4c85c5bd61569992f036c21191b.png") center center/cover no-repeat;
}

#fog-layer-01 {
  animation: fog-move-1 25s linear infinite;
  opacity: 0.4;
}

#fog-layer-02 {
  animation: fog-move-2 20s linear infinite;
  opacity: 0.3;
}

@keyframes fog-move-1 {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

@keyframes fog-move-2 {
  from {
    transform: translateX(-10%);
  }
  to {
    transform: translateX(-60%);
  }
}

@media (max-width: 767px) {
  #fog-layer-01 .image01, #fog-layer-01 .image02,
  #fog-layer-02 .image01, #fog-layer-02 .image02 {
    width: 100%;
  }
}
</style>
  