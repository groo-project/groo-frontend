<template>
    <template v-if="!showItemList">
      <div class="myitem-bg">
        <img
          :src="backIcon"
          alt="뒤로가기"
          class="back-img"
          @click="$emit('close')"
        />
        <div class="myitem-title">기록의 조각 보기</div>
        <div class="myitem-subtitle">기록의 조각 유형을 선택해주세요 !</div>
        
        <div class="item-grid">
          <div 
            class="item-category"
            v-for="category in categories"
            :key="category.name"
            @click="selectCategory(category.id)"
          >
            <img :src="category.icon" :alt="category.name" class="category-icon" />
            <div class="category-name">{{ category.name }}</div>
          </div>
        </div>
      </div>
    </template>
    <ItemList 
      v-else 
      :categoryId="selectedCategoryId"
      :forestId="props.forestId"
      @close="handleBackFromList"
      @placeFromStorage="handlePlaceFromStorage"
      :is-mate="props.isMate"
    />
  </template>
  
  <script setup>
  import { ref, getCurrentInstance } from 'vue'
  import backIcon from '@/icons/back.png'
  import plantIcon from '@/icons/tree.png'
  import objectIcon from '@/icons/object_icon.png'
  import etcIcon from '@/icons/bird.png'
  import ItemList from '@/components/forest/common/ItemList.vue'
  
  const props = defineProps({
    forestId: {
      type: [Number, String],
      required: true
    },
    isMate: {
      type: Boolean,
      default: false
    }
  })
  
  const emit = defineEmits(['close', 'placeFromStorage'])
  const showItemList = ref(false)
  const selectedCategoryId = ref(null)
  const { proxy } = getCurrentInstance()
  
  const categories = [
    { name: '식물', icon: plantIcon, id: 1 },
    { name: '사물', icon: objectIcon, id: 2 },
    { name: '기타', icon: etcIcon, id: 3 }
  ]
  
  function selectCategory(categoryId) {
    selectedCategoryId.value = categoryId
    showItemList.value = true
  }
  
  function handleBackFromList() {
    showItemList.value = false
    selectedCategoryId.value = null
  }

  function handlePlaceFromStorage(item) {
    proxy.emitter.emit('place-from-storage', item)
  }
  </script>
  
  <style scoped>
  .myitem-bg {
    width: 100%;
    height: 100%;
    min-width: 340px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    position: relative;
    background: none;
  }
  
  .back-img {
    position: absolute;
    top: 32px;
    left: 12px;
    width: 36px;
    height: 36px;
    cursor: pointer;
    z-index: 10;
  }
  
  .myitem-title {
    color: #fff;
    font-size: 1.9rem;
    font-weight: 600;
    margin-top: 110px;
    margin-bottom: 10px;
    text-align: center;
  }
  
  .myitem-subtitle {
    color: #fff;
    font-size: 1.1rem;
    margin-bottom: 60px;
    text-align: center;
  }
  
  .item-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    width: 100%;
    max-width: 500px;
    padding: 20px;
  }
  
  .item-category {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    aspect-ratio: 1;
  }
  
  .item-category:hover {
    background: rgba(255, 255, 255, 0.558);
    transform: translateY(-5px);
  }
  
  .category-icon {
    width: 50px;
    height: 52px;
    margin-bottom: 10px;
  }
  
  .category-name {
    color: #fff;
    font-size: 1.2rem;
    margin-top: 10px;
    font-weight: 500;
  }
  
  .item-category:hover .category-name {
    color: #3a5a40;
  }
  </style>
