import axios from 'axios';

// axios 인스턴스 생성
const api = axios.create({
    baseURL: 'http://localhost:8080/api',
    withCredentials: true, // 쿠키를 포함한 요청을 허용
    // 브라우저가 **쿠키(특히 HttpOnly 쿠키)**를 자동으로 포함시켜서 요청함.
    // RefreshToken을 HttpOnly 쿠키에 저장하는 방식을 쓸 때 반드시 필요.
});

export default api;

// // 외부에서 주입받을 토큰 게터(초기엔 빈 값)
// let getToken = () => '';

// // main.js에서 호출할 함수
// export function attachTokenGetter(fn) {
//   getToken = fn;   // fn은 매번 최신 토큰을 반환하는 함수여야 함
// }

/* --- 외부에서 주입받을 훅들(초기 no-op) --- */
let getAccessToken = () => '';
let doRefresh = async () => false;
let doLogout = () => {};

/** main.js에서 스토어 준비된 뒤 호출 */
export function attachAuthHooks({ getToken, refresh, logout }) {
  if (getToken) getAccessToken = getToken;
  if (refresh) doRefresh = refresh;
  if (logout) doLogout = logout;
}


// /* 🔸 공유 리프레시 프라미스 */
// let refreshPromise = null;
// async function ensureRefreshed(auth) {
//   if (!refreshPromise) {
//     refreshPromise = auth.tryRefresh().finally(() => { refreshPromise = null; });
//   }
//   return refreshPromise;
// }
/* --- refresh 폭주 방지용 공유 프라미스 --- */
let refreshPromise = null;
function ensureRefreshOnce() {
  if (!refreshPromise) {
    refreshPromise = Promise.resolve()
      .then(() => doRefresh())
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

// 요청 인터셉터 설정
api.interceptors.request.use((config) => {
        
        const url = config.url || '';
        // refresh 요청은 인증 헤더를 포함해야 함 (기존 토큰으로 새 토큰 요청)
        const skip = /\/auth\/(login|logout)(\?|$)/.test(url);
        if (!skip) {
          const token = getAccessToken();
        if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
        }
        }
        return config;
    });

// 응답 인터셉터 설정
api.interceptors.response.use(
    // (response) => {
    //     return response; // 응답을 그대로 반환
    // },
    // async (error) => {
    //     const auth = useAuthStore();
    //     if (error.response.status === 401 && !error.config.__retry) {

    //         error.config.__retry = true;

    //         // 401 Unauthorized 에러가 발생하면 토큰 갱신 시도
    //         const success = await auth.tryRefresh();
    //         if (success) {
    //             // 토큰 갱신 성공 시 원래 요청을 다시 시도
    //             return api.request(error.config);
    //         } else {
    //             // 토큰 갱신 실패 시 로그아웃 처리
    //             auth.logout();
    //         }
    //     }
    //     return Promise.reject(error); // 에러를 그대로 전달
    // }
      (res) => res,
      async (error) => {
       const { response, config } = error || {};
      if (!response) return Promise.reject(error);

      if (response.status === 401 && !config.__retry) {
      config.__retry = true;
      const ok = await ensureRefreshOnce();
      if (ok) return api.request(config);
      doLogout();
    }
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
  // createDiary: async (diaryData) => {
  //   try {
  //     if (!forestId.value) {
  //       throw new Error('Forest ID not found');
  //     }

  //     const requestData = {
  //       forestId: Number(forestId),
  //       content: diaryData.content,
  //       categoryId: Number(categoryId),
  //       createdAt: diaryData.createdAt
  //     };

  //     console.log('API Request Data:', requestData);
      
  //     // // 최소 5초의 지연 시간을 보장
  //     // const response = await ensureMinimumDelay(
  //     //   api.post('/diaries', requestData),
  //     //   5000
  //     // );
  //     const res = await api.post('/diaries', requestData)

  //     if (!res.data) {
  //       throw new Error('API 응답 데이터가 없습니다.');
  //     }

  //     return res.data;

  //   } catch (error) {
  //     console.error('API 에러:', error);
  //     throw error;
  //   }
  // }
  async createDiary({ forestId, content, categoryId, createdAt }) {
    if (!forestId) throw new Error('Forest ID not found');

    const body = {
      forestId: Number(forestId),
      content,
      categoryId: Number(categoryId),
      createdAt,
    };

    const res = await api.post('/diaries', body); // => /api/diaries
    return res.data;
  },
}; 