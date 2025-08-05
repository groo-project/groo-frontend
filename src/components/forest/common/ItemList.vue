<template>
  <div class="itemlist-bg">
    <img
      :src="backIcon"
      alt="뒤로가기"
      class="back-img"
      @click="$emit('close')"
    />
    <div class="itemlist-title">내가 얻은 {{ categoryTitle }} 조각</div>
    <div class="itemlist-subtitle">총 {{ totalItems }}개의 조각을 모으셨네요!</div>
    
    <div class="items-grid">
      <div 
        v-for="item in items" 
        :key="item.id"
        class="item-box"
      >
        <img :src="item.imageUrl" :alt="item.itemName" class="item-image" />
        <div class="item-info">
            <div class="item-count">{{ item.totalCount - item.placedCount }}/{{ item.totalCount }}</div>
          <div class="item-name">{{ item.itemName }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import backIcon from '@/icons/back.png'

const props = defineProps({
  categoryId: { type: Number, required: true }
})

const emit = defineEmits(['close'])

const items = ref([])
const categoryTitles = {
  1: '식물',
  2: '사물',
  3: '기타'
}

const categoryTitle = computed(() => categoryTitles[props.categoryId])
const forestId = localStorage.getItem('forestId');
const totalItems = computed(() => {
  return items.value.reduce((sum, item) => sum + item.totalCount, 0)
})

async function fetchItems() {
  try {
    const accessToken = localStorage.getItem('accessToken')
    const response = await axios.get(
      `http://localhost:8080/items/${props.categoryId}/${forestId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    )
    items.value = response.data
  } catch (error) {
    console.error('Failed to fetch items:', error)
  }
}

onMounted(fetchItems)
</script>

<style scoped>
.itemlist-bg {
  width: 100%;
  height: 100%;
  min-width: 340px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  position: relative;
  background: none;
  padding: 20px;
}

.back-img {
  position: absolute;
  top: 32px;
  left: 32px;
  width: 36px;
  height: 36px;
  cursor: pointer;
  z-index: 10;
}

.itemlist-title {
  color: #fff;
  font-size: 1.9rem;
  font-weight: 600;
  margin-top: 110px;
  margin-bottom: 10px;
  text-align: center;
}

.itemlist-subtitle {
  color: #fff;
  font-size: 1.1rem;
  margin-bottom: 40px;
  text-align: center;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  width: 100%;
  max-width: 500px;
  padding: 20px;
}

.item-box {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  aspect-ratio: 1;
}

.item-box:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: translateY(-5px);
}

.item-image {
  width: 60px;
  height: 60px;
  object-fit: contain;
  margin-bottom: 10px;
}

.item-info {
  text-align: center;
}

.item-name {
  color: #fff;
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 5px;
}

.item-count {
  color: #fff;
  font-size: 0.9rem;
  opacity: 0.8;
}

.item-box:hover .item-name,
.item-box:hover .item-count {
  color: #3a5a40;
}
</style> 