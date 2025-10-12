import { defineStore } from 'pinia';
import api from '@/lib/api';
import { jwtDecode } from 'jwt-decode';


export const useAuthStore = defineStore('auth', {
  state: () => ({  
    // 화면 전역에서 공유할 로그인 상태 저장소로 상태 정의.
    accessToken: '', // 액세스 토큰
    user: null, // 사용자 정보
    roles: [], // 사용자 역할
    isRefreshing: false, //  중복 요청 방지 플래그 추가
  }),
  getters: {
    isAuthenticated: (state) => !!(state.accessToken && state.user), // 액세스 토큰과 사용자 정보가 모두 있어야 인증됨
  },
  actions: {
    // 소셜/외부 토큰으로 로그인 상태 세팅
    // 백엔드 /auth/google 응답을 여기로 집결
    async loginWithExternalToken(accessToken, profile = {}) {
        this.accessToken = accessToken
        try {
            const p = jwtDecode(accessToken);
            this.user = {
              userId: Number(p.sub),
              email: p.email || profile.email || 'unknown',
              nickname: p.nickname || profile.nickname || '여행자',
              ...(this.user || {}),
            };
          } catch {
            // 토큰 디코드 실패 시에도 최소한 객체는 보장
            this.user = { ...(this.user || {}), ...profile };
          }

    },

    async login(credentials) {
        // 이미 갱신 중이면 대기
        if (this.isRefreshing) {
            console.log('Token refresh already in progress, waiting...');
            // 진행 중인 갱신 요청이 완료될 때까지 대기
            while (this.isRefreshing) {
            await new Promise(resolve => setTimeout(resolve, 100));
            }
            return true;
        }
        
        this.isRefreshing = true; //  갱신 시작 플래그
  

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
            
            const payload = jwtDecode(this.accessToken)

            // 서버 응답 그대로 저장
            this.$patch((state) => {
                state.user = {
                    userId: parseInt(payload.sub),
                    email: payload.email || 'unknown',
                    nickname: payload.nickname || '여행자' // JWT에서 nickname 추출 시도
                };
            });
            
            return true; // 로그인 성공
        }   
        catch (error) {
            if (error.response && error.response.status === 401) {
                console.error('잘못된 자격 증명:', error);
                throw new Error('Invalid credentials'); // 잘못된 자격 증명
            } else {
                console.error('로그인 실패:', error);
                throw new Error('Login failed'); // 기타 에러
            }

        }
        finally {
            this.isRefreshing = false; // 갱신 완료 플래그 초기화
        }
    },
    async kakaoLogin(code) {
      try {
        // 백엔드로 인가 코드 전달
        const res = await api.post('/auth/kakao/login', { code });
        const accessToken = res.data?.accessToken;
        if (!accessToken) throw new Error("토큰이 없습니다.");

        // JWT 디코딩
        const payload = jwtDecode(accessToken);

        // Pinia 상태 업데이트
        this.$patch(state => {
          state.accessToken = accessToken;
          state.user = {
            userId: parseInt(payload.sub),
            nickname: payload.nickname || '여행자',
            email: payload.email || null,
            forestId: null,
          };
        });

        // forestId 가져오기
        const { data } = await api.get('myforest');
        const forestId = data?.[0]?.id;
        if (forestId) {
          this.$patch(state => {
            state.user.forestId = forestId;
          });
        }

        return true;
      } catch (err) {
        console.error('카카오 로그인 실패:', err);
        throw err;
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
            
            // 임시: JWT 토큰 내용 확인
            const refreshToken = document.cookie.split('; ').find(row => row.startsWith('refreshToken='))?.split('=')[1];
            if (refreshToken) {
                try {
                    // const payload = JSON.parse(atob(refreshToken.split('.')[1]));
                } catch (e) {
                }
            } else {
            }
            
            const response = await api.post('auth/refresh');
            
            
            if (response.data && response.data.accessToken) {
                this.accessToken = response.data.accessToken;
            } else {
                throw new Error('No access token received from refresh');
            }

            try {
                const payload = jwtDecode(this.accessToken)
                
                // Pinia 상태를 직접 업데이트
                this.$patch((state) => {
                    state.user = {
                        userId: parseInt(payload.sub),
                        email: payload.email || 'unknown',
                        forestId: payload.forestId || null, // JWT에서 forestId 추출 시도
                        nickname: payload.nickname || '여행자' // JWT에서 nickname 추출 시도
                    };
                });
                
                // 강제로 상태 동기화
                if (!this.user || !this.user.forestId) {
                    this.user = {
                        userId: parseInt(payload.sub),
                        email: payload.email || 'unknown',
                        forestId: payload.forestId || null,
                        nickname: payload.nickname || '여행자'
                    };
                }
            } catch (e) {
                console.error('Failed to extract user info from JWT:', e);
            }
            
            // user 정보가 없거나 불완전하면 서버에서 사용자 정보를 다시 가져오기
            if (!this.user || !this.user.forestId || !this.user.nickname) {
                try {
                    const userResponse = await api.get('myforest');
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
                    }
                } catch (e) {
                    console.error('Failed to fetch user info from server:', e);
                }
            }
            
            return true;
        } catch (error) {
            console.error('Refresh token failed:', error);
            
            // 401 에러인 경우 refresh token이 만료되었거나 유효하지 않음
            if (error.response && error.response.status === 401) {
                console.log('Refresh token expired or invalid - user needs to login again');
                
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
            } catch (cookieError) {
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
