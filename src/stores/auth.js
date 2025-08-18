import { defineStore } from 'pinia';
import api from '@/lib/api';


export const useAuthStore = defineStore('auth', {
  state: () => ({  
    // 화면 전역에서 공유할 로그인 상태 저장소로 상태 정의.
    accessToken: '', // 액세스 토큰
    user: null, // 사용자 정보
    roles: [], // 사용자 역할
  }),
  getters: {
    isAuthenticated: (state) => !!state.accessToken, // 액세스 토큰이 있으면 인증됨
    forestId: (state) => state.user?.forestId || null, // 사용자의 숲 ID 반환
    // getUser: (state) => state.user, // 사용자 정보 반환
    // getRoles: (state) => state.roles, // 사용자 역할 반환
  },
  actions: {
    async login(credentials) {
        try {
            // 로그인 API 호출
            const { data } = await api.post('/auth/login', {
                email: credentials.email,
                password: credentials.password,
            });

            // 로그인 성공 시 상태 업데이트
            this.accessToken = data.accessToken || ''; // 액세스 토큰 저장
            // 근데 data 안에서는 accessToken이 없을텐데
            if (!this.accessToken) {
                throw new Error('Access token not received');
            }
            this.user = data.user || null; // 사용자 정보 저장
            // this.roles = data.roles || []; // 사용자 역할 저장  

            // auth.accessToken = data.accessToken || ''; // 액세스 토큰 저장
            // auth.user = data.user || null; // 사용자 정보 저장
            // auth.roles = data.roles || []; // 사용자 역할 저장  
            // 로그인 성공 후 필요한 작업 수행
            // 예: 사용자 정보를 로컬 스토리지에 저장하거나 상태 업데이트 등
            // 예: 로컬 스토리지에 사용자 정보 저장
            return true; // 로그인 성공

        }   
        catch (error) {
            console.log("토큰",this.accessToken);
            if (error.response && error.response.status === 401) {
                console.error('잘못된 자격 증명:', error);
                throw new Error('Invalid credentials'); // 잘못된 자격 증명
            } else {
                console.error('로그인 실패:', error);
                throw new Error('Login failed'); // 기타 에러
            }
            // console.error('Login failed:', error);
            // throw error; // 에러를 상위로 전달
        }
    },
    async tryRefresh() {
        try {
            const response = await api.post('/auth/refresh');
            // .then(res => console.log('refreshed AT:', res.data.accessToken))
            // .catch(err => console.error(err));
            this.accessToken = response.data.accessToken || ''; // 새 액세스 토큰 저장
            if (response.data.user) this.user = response.data.user;
            if (response.data.roles) this.roles = response.data.roles;
            return true; // 토큰 갱신 성공
        } catch (error) {
            console.error('Refresh token failed:', error);
            this.logout(); // 토큰 갱신 실패 시 로그아웃 처리
            return false; // 토큰 갱신 실패
            // this.accessToken = '';
            // this.user = null;
            // this.roles = [];
            // return false;
        }
    },
    async logout() {
        try {
            // 로그아웃 처리
            this.accessToken = ''; // 액세스 토큰 초기화
            this.user = null; // 사용자 정보 초기화
            this.roles = []; // 사용자 역할 초기화
            // 로그아웃 API 호출
            await api.post('/auth/logout');     // 서버에 로그아웃 요청     
            // todo : 쿠키에 저장된 토큰을 삭제하는 로직이 필요할 수 있음
            // 예를 들어, HttpOnly 쿠키를 사용하는 경우 브라우저가 자동으로 삭제함.

            // 이 부분은 서버에서 토큰을 블랙리스트에 추가하거나 쿠키를 삭제하는 등의 작업을 수행할 수 있습니다.
            // 서버에도 로그아웃 알림 : RT 블랙리스트 / 쿠키 삭제 등
            // api.post('/auth/logout').catch(() => {});
        } catch (error) {
            console.error('Logout failed:', error);

        }
        
    },
  },
});
