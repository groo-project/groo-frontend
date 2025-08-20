import { defineStore } from 'pinia';
import api from '@/lib/api';


export const useAuthStore = defineStore('auth', {
  state: () => ({  
    // 화면 전역에서 공유할 로그인 상태 저장소로 상태 정의.
    accessToken: '', // 액세스 토큰
    user: null, // 사용자 정보
    roles: [], // 사용자 역할
    isRefreshing: false, // ✅ 중복 요청 방지 플래그 추가
  }),
  getters: {
    isAuthenticated: (state) => !!state.accessToken, // 액세스 토큰이 있으면 인증됨
    forestId: (state) => state.user?.forestId || null, // 사용자의 숲 ID 반환
    // getUser: (state) => state.user, // 사용자 정보 반환
    // getRoles: (state) => state.roles, // 사용자 역할 반환
  },
  actions: {
    async login(credentials) {
        // ✅ 이미 갱신 중이면 대기
        if (this.isRefreshing) {
            console.log('Token refresh already in progress, waiting...');
            // 진행 중인 갱신 요청이 완료될 때까지 대기
            while (this.isRefreshing) {
            await new Promise(resolve => setTimeout(resolve, 100));
            }
            return true;
        }
        
        this.isRefreshing = true; // ✅ 갱신 시작 플래그
  

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
        finally {
            this.isRefreshing = false; // ✅ 갱신 완료 플래그 초기화
        }
    },
    async tryRefresh() {
        // 중복 요청 방지
        if (this.isRefreshing) {
            console.log('Token refresh already in progress, waiting...');
            // 진행 중인 갱신 요청이 완료될 때까지 대기
            while (this.isRefreshing) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return true;
        }
        
        this.isRefreshing = true;
        
        try {
            console.log('Starting token refresh...');
            
            // 임시: JWT 토큰 내용 확인
            const refreshToken = document.cookie.split('; ').find(row => row.startsWith('refreshToken='))?.split('=')[1];
            if (refreshToken) {
                try {
                    const payload = JSON.parse(atob(refreshToken.split('.')[1]));
                    console.log('JWT Payload:', payload);
                    console.log('JTI:', payload.jti);
                    console.log('User ID:', payload.sub);
                    console.log('Type:', payload.typ);
                } catch (e) {
                    console.log('JWT parsing failed:', e);
                }
            } else {
                console.log('No refreshToken cookie found');
            }
            
            const response = await api.post('/auth/refresh');
            
            console.log('Refresh response:', response);
            
            if (response.data && response.data.accessToken) {
                this.accessToken = response.data.accessToken;
                console.log('Token refreshed successfully');
            } else {
                console.error('No access token in refresh response');
                throw new Error('No access token received from refresh');
            }
            
            if (response.data.user) this.user = response.data.user;
            if (response.data.roles) this.roles = response.data.roles;
            
            return true;
        } catch (error) {
            console.error('Refresh token failed:', error);
            console.log('Error response:', error.response?.data);
            console.log('Error status:', error.response?.status);
            console.log('Error message:', error.message);
            
            // 401 에러인 경우 refresh token이 만료되었거나 유효하지 않음
            if (error.response && error.response.status === 401) {
                console.log('Refresh token expired or invalid - user needs to login again');
                console.log('Server error details:', error.response.data);
                
                // 서버에서 보낸 구체적인 에러 메시지 확인
                if (error.response.data && error.response.data.error) {
                    console.log('Server error message:', error.response.data.error);
                }
            }
            
            return false;
        } finally {
            this.isRefreshing = false;
        }
    },
    async logout() {
        try {
            // 로그아웃 처리
            this.accessToken = ''; // 액세스 토큰 초기화
            this.user = null; // 사용자 정보 초기화
            this.roles = []; // 사용자 역할 초기화
            
            // 서버에 로그아웃 요청 (쿠키에 저장된 토큰을 삭제)
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout failed:', error);
            console.log('Logout error status:', error.response?.status);
            console.log('Logout error message:', error.response?.data);
            
            // 405 에러는 서버에서 POST 메서드를 지원하지 않는 경우
            if (error.response?.status === 405) {
                console.log('Server does not support POST for logout, trying GET...');
                try {
                    await api.get('/auth/logout');
                } catch (getError) {
                    console.log('GET logout also failed:', getError.response?.status);
                }
            }
        }
    },
  },
});
