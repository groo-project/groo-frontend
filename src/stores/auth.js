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
    isAuthenticated: (state) => !!(state.accessToken && state.user), // 액세스 토큰과 사용자 정보가 모두 있어야 인증됨
    // forestId getter 제거 - 각 컴포넌트에서 auth.user.forestId 직접 사용
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
            if (!this.accessToken) {
                throw new Error('Access token not received');
            }
            
            // 서버 응답 그대로 저장
            this.$patch((state) => {
                state.user = data.user || null; // 사용자 정보 저장 (forestId 포함)
                state.roles = data.roles || []; // 사용자 역할 저장
            });  

            // 로그인 성공 후 상태 확인
            console.log("=== 로그인 성공 후 상태 확인 ===");
            console.log("서버 응답 data:", data);
            console.log("서버 응답 data.user:", data.user);
            console.log("서버 응답 data.user.forestId:", data.user?.forestId);
            console.log("저장된 this.user:", this.user);
            console.log("저장된 this.user.forestId:", this.user?.forestId);
            console.log("================================");  

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
            
            if (response.data.user) {
                // Pinia 상태를 직접 업데이트
                this.$patch((state) => {
                    state.user = response.data.user;
                });
                
            } else {
                // user 정보가 없으면 JWT에서 기본 정보 추출
                console.log('=== Refresh - No User Data, Extracting from JWT ===');
                try {
                    const payload = JSON.parse(atob(this.accessToken.split('.')[1]));
                    console.log('JWT Payload:', payload);
                    
                    // Pinia 상태를 직접 업데이트
                    this.$patch((state) => {
                        state.user = {
                            userId: parseInt(payload.sub),
                            email: payload.email || 'unknown',
                            forestId: payload.forestId || null, // JWT에서 forestId 추출 시도
                            nickname: payload.nickname || '여행자' // JWT에서 nickname 추출 시도
                        };
                    });
                    
                    console.log('After $patch - user:', this.user);
                    console.log('After $patch - forestId:', this.user?.forestId);
                    console.log('After $patch - nickname:', this.user?.nickname);
                    
                    // 강제로 상태 동기화
                    if (!this.user || !this.user.forestId) {
                        console.log('Force State Sync');
                        this.user = {
                            userId: parseInt(payload.sub),
                            email: payload.email || 'unknown',
                            forestId: payload.forestId || null,
                            nickname: payload.nickname || '여행자'
                        };
                        console.log('After force sync - user:', this.user);
                    }
                } catch (e) {
                    console.error('Failed to extract user info from JWT:', e);
                }
            }
            if (response.data.roles) this.roles = response.data.roles;
            
            // user 정보가 없거나 불완전하면 서버에서 사용자 정보를 다시 가져오기
            if (!this.user || !this.user.forestId || !this.user.nickname) {
                console.log('=== Fetching User Info from Server ===');
                try {
                    const userResponse = await api.get('/myforest');
                    if (userResponse.data && userResponse.data.length > 0) {
                        const userInfo = userResponse.data[0];
                        this.$patch((state) => {
                            state.user = {
                                userId: this.user?.userId || parseInt(payload?.sub),
                                email: this.user?.email || 'unknown',
                                forestId: userInfo.id || this.user?.forestId,
                                nickname: userInfo.nickname || this.user?.nickname || '여행자'
                            };
                        });
                        console.log('User info restored from server:', this.user);
                    }
                } catch (e) {
                    console.error('Failed to fetch user info from server:', e);
                }
                console.log('========================');
            }
            
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
            
            // 에러 발생 시 상태 초기화
            this.accessToken = '';
            this.user = null;
            this.roles = [];
            
            throw error;
        } finally {
            this.isRefreshing = false;
        }
    },
    async logout() {
        try {
            console.log('=== 로그아웃 시작 ===');
            
            // 클라이언트 상태 초기화
            this.accessToken = '';
            this.user = null;
            this.roles = [];
            this.isRefreshing = false;
            
            // refreshToken 쿠키 삭제
            try {
                // 다양한 경로와 도메인으로 쿠키 삭제 시도
                document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=localhost';
                document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
                document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=localhost:5173';
                console.log('refreshToken 쿠키 삭제 완료');
            } catch (cookieError) {
                console.log('쿠키 삭제 실패 (정상):', cookieError.message);
            }
            
        } catch (error) {
            console.error('Logout failed:', error);
            // 에러가 발생해도 클라이언트 상태는 초기화
            this.accessToken = '';
            this.user = null;
            this.roles = [];
            this.isRefreshing = false;
        }
    },
  },
});
