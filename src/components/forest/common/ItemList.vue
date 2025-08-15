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
        :class="{ 'clickable': availableCount(item) > 0 }"
        @click="handleItemClick(item)"
      >
        <img :src="item.imageUrl" :alt="item.itemName" class="item-image" />
        <div class="item-info">
          <div class="item-count">{{ availableCount(item) }}/{{ item.totalCount }}</div>
          <div class="item-name">{{ item.itemName }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, getCurrentInstance } from 'vue'
import backIcon from '@/icons/back.png'
import { useAuthStore } from '@/stores/auth'
import api from '@/lib/api'

const props = defineProps({
  categoryId: { type: Number, required: true },
  forestId: { type: [Number, String], required: true }
})

const emit = defineEmits(['close', 'placeFromStorage'])

const items = ref([])
const categoryTitles = {
  1: '식물',
  2: '사물',
  3: '기타'
}

const { proxy } = getCurrentInstance()
const authStore = useAuthStore()

const categoryTitle = computed(() => categoryTitles[props.categoryId])
const forestId = computed(() => {
  console.log('=== ForestId from Props ===');
  console.log('Props forestId:', props.forestId);
  console.log('Props forestId type:', typeof props.forestId);
  console.log('========================');
  return props.forestId;
})
const totalItems = computed(() => {
  return items.value.reduce((sum, item) => sum + item.totalCount, 0)
})

const availableCount = (item) => {
  return item.totalCount - item.placedCount
}

const handleItemClick = (item) => {
  if (availableCount(item) > 0) {
    item.placedCount = (item.placedCount || 0) + 1
    emit('placeFromStorage', item)
  }
}

const handleItemCountRestore = (restoredItem) => {
  const item = items.value.find(i => i.id === restoredItem.id)
  if (item && item.placedCount > 0) {
    item.placedCount -= 1
    console.log(`Restored item count for ${item.itemName}: ${availableCount(item)}/${item.totalCount}`)
  }
}

async function fetchItems() {
  try {
    console.log('=== Fetching Items ===');
    console.log('Category ID:', props.categoryId);
    console.log('Forest ID:', forestId.value);
    console.log('Forest ID type:', typeof forestId.value);
    console.log('Forest ID is valid:', forestId.value !== null && forestId.value !== undefined);
    console.log('========================');
    
    if (!forestId.value) {
      console.error('Forest ID not available - cannot fetch items');
      return
    }
    
    const apiUrl = `/items/${props.categoryId}/${forestId.value}`;
    console.log('API URL:', apiUrl);
    
    const response = await api.get(apiUrl)
    items.value = response.data
    
    console.log('Items fetched:', response.data)
  } catch (error) {
    console.error('Failed to fetch items:', error)
    console.error('Error response:', error.response?.data)
    console.error('Error status:', error.response?.status)
  }
}

onMounted(() => {
  console.log('=== ItemList Mounted ===');
  console.log('authStore.user:', authStore.user);
  console.log('forestId.value:', forestId.value);
  console.log('props.categoryId:', props.categoryId);
  console.log('========================');
  
  fetchItems()
  if (proxy?.emitter) {
    proxy.emitter.on('restore-item-count', handleItemCountRestore)
  }
})

onUnmounted(() => {
  if (proxy?.emitter) {
    proxy.emitter.off('restore-item-count', handleItemCountRestore)
  }
})
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
  position: relative;
}

.item-box.clickable {
  cursor: pointer;
}

.item-box.clickable:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: translateY(-5px);
}

.item-box:not(.clickable) {
  opacity: 0.6;
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

.item-box.clickable:hover .item-name,
.item-box.clickable:hover .item-count {
  color: #3a5a40;
}

.placement-indicator {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(58, 90, 64, 0.9);
  color: #fff;
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 8px;
  font-weight: 500;
}
</style>
