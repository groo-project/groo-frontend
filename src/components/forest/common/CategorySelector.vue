<template>
  <div class="category-selector">
    <div class="top-message">
      오늘 하루는 어땠나요?<br />
      하루의 감정을 숲에 심어보세요.
    </div>

    <div class="selector-container">
      <div class="instruction-text">
        감정을 분석하기 전,<br />
        받고싶은 기록의 조각 유형을 선택해주세요
      </div>

      <div class="category-grid">
        <div
          v-for="category in categories"
          :key="category.id"
          class="category-item"
          :class="{ selected: selected === category.id }"
          @click="selectCategory(category.value)"
        >
          <div class="category-label">{{ category.label }}</div>
          <img :src="category.icon" class="category-icon" alt="category icon" />
        </div>
      </div>

      <button 
        class="write-btn" 
        @click="handleSelect"
        :disabled="!selected"
      >
        일기 작성하기
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import plantIcon from "@/icons/plant.png";
import objectIcon from "@/icons/object.png";
import etcIcon from "@/icons/etc.png";

const categories = [
  { id: 1, value: "plant", label: "식물", icon: plantIcon },
  { id: 2, value: "object", label: "사물", icon: objectIcon },
  { id: 3, value: "etc", label: "기타", icon: etcIcon },
];

const selected = ref(null);
const isLoading = ref(false);

const emit = defineEmits(['select', 'loading']);

const selectCategory = (value) => {
  const category = categories.find(cat => cat.value === value);
  if (category) {
    selected.value = category.id;
  }
};

const handleSelect = () => {
  if (selected.value) {
    emit('select', selected.value);
  }
};

watch(isLoading, (val) => {
  emit("loading", val);
});
</script>

<style scoped>
.category-selector {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px 0;
}

.top-message {
  color: #fff;
  font-size: 18px;
  margin-bottom: 40px;
  margin-left: 20px;
  line-height: 1.5;
}

.selector-container {
  background: rgba(255,255,255,0.10);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 18px;
  padding: 28px 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 auto;
  width: 90%;
  box-sizing: border-box;
}

.instruction-text {
  color: #fff;
  font-size: 18px;
  text-align: center;
  margin-bottom: 30px;
  line-height: 1.5;
}

.category-grid {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 32px;
  width: 100%;
}

.category-item {
  background: rgba(255,255,255,0.25);
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
  flex: 1;
  max-width: 100px;
}

.category-item.selected {
  border: 2px solid #3a5a40;
  background: rgba(255,255,255,0.45);
}

.category-label {
  color: #3a5a40;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 12px;
}

.category-icon {
  width: 48px;
  height: 48px;
  object-fit: contain;
}

.write-btn {
  margin-top: 8px;
  background: #3a5a40;
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 12px 28px;
  font-size: 16px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  width: 60%;
}

.write-btn:hover {
  background: #2d4632;
}

.write-btn:disabled {
  background: rgba(58, 90, 64, 0.5);
  cursor: not-allowed;
}
</style>