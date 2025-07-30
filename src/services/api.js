import axios from 'axios';

const BASE_URL = 'http://localhost:8080';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 최소 지연 시간을 보장하는 함수
const ensureMinimumDelay = async (promise, minDelay) => {
  const start = Date.now();
  const [result] = await Promise.all([
    promise,
    new Promise(resolve => setTimeout(resolve, minDelay))
  ]);
  const elapsed = Date.now() - start;
  if (elapsed < minDelay) {
    await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
  }
  return result;
};

export const diaryApi = {
  // 일기 작성 및 감정 분석 API
  createDiary: async (diaryData) => {
    try {
      const forestId = localStorage.getItem('forestId');
      if (!forestId) {
        throw new Error('Forest ID not found');
      }

      const requestData = {
        forestId: Number(forestId),
        content: diaryData.content,
        categoryId: Number(diaryData.categoryId),
        createdAt: diaryData.createdAt
      };

      console.log('API Request Data:', requestData);
      
      // 최소 5초의 지연 시간을 보장
      const response = await ensureMinimumDelay(
        api.post('/api/diaries', requestData),
        5000
      );
      
      if (!response.data) {
        throw new Error('API 응답 데이터가 없습니다.');
      }

      return response.data;
    } catch (error) {
      console.error('API 에러:', error);
      throw error;
    }
  }
}; 