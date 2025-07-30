<template>
  <div class="tooltip-wrapper">
    <div class="badge" :class="{ public: isPublic }">
      {{ isPublic ? "공개중" : "비공개" }}
    </div>
    <div class="tooltip">
      공개 범위 설정
    </div>
  </div>
</template>

<script setup>
defineProps({
  isPublic: {
    type: [Boolean, Number],
    required: true
  }
})
</script>

<style scoped>
.tooltip-wrapper {
  position: relative;
  display: inline-block;
  z-index: 1; /* 배경보다 위, 아이템보다 아래 */
}

.badge {
  background-color: #7e928e;
  color: white;
  border-radius: 16px;
  padding: 4px 12px;
  font-size: 14px;
  cursor: default;
}

.badge.public {
  background-color: #6a9c7c;
}

.tooltip {
  visibility: hidden;
  opacity: 0;
  width: max-content;
  background-color: #ffffff;
  color: #333;
  font-size: 12px;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 6px 10px;
  position: absolute;
  bottom: 120%;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  transition: opacity 0.3s ease;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  z-index: 2; /* 툴팁만 살짝 위에 */
}

.tooltip-wrapper:hover .tooltip {
  visibility: visible;
  opacity: 1;
}
</style>
