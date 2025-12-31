import axios from 'axios';

const API_BASE_URL = 'http://localhost:8081';

// axios 인스턴스 생성 (타임아웃 설정)
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30초 타임아웃
});

// 인터셉터: 요청에 사용자 ID 추가
apiClient.interceptors.request.use((config) => {
  const userId = localStorage.getItem('userId');
  if (userId) {
    config.headers['X-User-Id'] = userId;
  }
  return config;
});

// ============ 인증 API ============

export interface AuthResponse {
  userId: number | null;
  email: string;
  nickname: string;
  name: string;
  token: string;
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  nickname: string;
  userId: string;
  email: string;
  password: string;
  realName: string;
  phoneNumber: string;
  gender: string;
}

export const login = async (request: LoginRequest): Promise<AuthResponse> => {
  const response = await apiClient.post('/auth/login', request);
  if (response.data.userId) {
    localStorage.setItem('userId', response.data.userId.toString());
    localStorage.setItem('userToken', response.data.token);
    localStorage.setItem('userNickname', response.data.nickname);
  }
  return response.data;
};

export const signup = async (request: SignupRequest): Promise<AuthResponse> => {
  const response = await apiClient.post('/auth/signup', request);
  if (response.data.userId) {
    localStorage.setItem('userId', response.data.userId.toString());
    localStorage.setItem('userToken', response.data.token);
    localStorage.setItem('userNickname', response.data.nickname);
  }
  return response.data;
};

export const checkEmailDuplicate = async (email: string): Promise<boolean> => {
  const response = await apiClient.get('/auth/check-email', { params: { email } });
  return response.data.exists;
};

export const checkNicknameDuplicate = async (nickname: string): Promise<boolean> => {
  const response = await apiClient.get('/auth/check-nickname', { params: { nickname } });
  return response.data.exists;
};

export const logout = () => {
  localStorage.removeItem('userId');
  localStorage.removeItem('userToken');
  localStorage.removeItem('userNickname');
};

export const getCurrentUserId = (): number | null => {
  const userId = localStorage.getItem('userId');
  return userId ? parseInt(userId, 10) : null;
};

export const isLoggedIn = (): boolean => {
  return !!localStorage.getItem('userId');
};

// 닉네임 업데이트
export const updateNickname = async (nickname: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiClient.put('/auth/profile/nickname', { nickname });
    if (response.data.success) {
      localStorage.setItem('userNickname', nickname);
    }
    return response.data;
  } catch (error) {
    console.error('닉네임 업데이트 오류:', error);
    return { success: false, message: '닉네임 변경에 실패했습니다.' };
  }
};

// ============ User Stats API ============

export interface UserStats {
  userId: number;
  nickname: string;
  playlistCount: number;
  likedPlaylistCount: number;
  followerCount: number;
  followingCount: number;
}

export const getUserStats = async (): Promise<UserStats | null> => {
  try {
    const response = await apiClient.get('/users/me/stats');
    return response.data;
  } catch (error) {
    console.error('사용자 통계 조회 오류:', error);
    return null;
  }
};

export const toggleFollow = async (userId: number): Promise<boolean> => {
  try {
    const response = await apiClient.post(`/users/${userId}/follow`);
    return response.data.isFollowing;
  } catch (error) {
    console.error('팔로우 토글 오류:', error);
    return false;
  }
};

// ============ 플레이리스트 API ============

export interface PlaylistPost {
  id: number;
  author: {
    id?: number;
    name: string;
    avatar: string;
  };
  title: string;
  description: string;
  coverImageUrl?: string;
  coverGradient: string;
  tags: string[];
  likes: number;
  comments: Comment[];
  shares: number;
  isLiked: boolean;
  createdAt: string;
  tracks: {
    id: number;
    title: string;
    artist: string;
    duration: string;
    albumImage?: string;
  }[];
}

export interface Comment {
  id: number;
  author: string;
  content: string;
  createdAt: string;
}

export const getTrendingPlaylists = async (page: number = 0, size: number = 20): Promise<PlaylistPost[]> => {
  try {
    const response = await apiClient.get('/playlists/trending', { params: { page, size } });
    return response.data;
  } catch (error) {
    console.error('트렌딩 플레이리스트 조회 오류:', error);
    return [];
  }
};

export const searchPlaylistsInDB = async (keyword: string, page: number = 0, size: number = 20): Promise<PlaylistPost[]> => {
  try {
    const response = await apiClient.get('/playlists/search', { params: { keyword, page, size } });
    return response.data;
  } catch (error) {
    console.error('플레이리스트 검색 오류:', error);
    return [];
  }
};

export const getPlaylistById = async (id: number): Promise<PlaylistPost | null> => {
  try {
    const response = await apiClient.get(`/playlists/${id}`);
    return response.data;
  } catch (error) {
    console.error('플레이리스트 조회 오류:', error);
    return null;
  }
};

export const getUserPlaylists = async (userId: number): Promise<PlaylistPost[]> => {
  try {
    const response = await apiClient.get(`/playlists/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('사용자 플레이리스트 조회 오류:', error);
    return [];
  }
};

export const getLikedPlaylists = async (): Promise<PlaylistPost[]> => {
  try {
    const response = await apiClient.get('/playlists/liked');
    return response.data;
  } catch (error) {
    console.error('좋아요한 플레이리스트 조회 오류:', error);
    return [];
  }
};

export interface CreatePlaylistRequest {
  title: string;
  description: string;
  coverImageUrl?: string;
  isPublic: boolean;
  tags?: string[];
  tracks: { title: string; artist: string; durationSec?: number; albumImage?: string; spotifyId?: string }[];
}

export const createPlaylist = async (request: CreatePlaylistRequest): Promise<PlaylistPost | null> => {
  try {
    const response = await apiClient.post('/playlists', request);
    return response.data;
  } catch (error) {
    console.error('플레이리스트 생성 오류:', error);
    return null;
  }
};

export const togglePlaylistLike = async (playlistId: number): Promise<boolean> => {
  try {
    const response = await apiClient.post(`/playlists/${playlistId}/like`);
    return response.data.isLiked;
  } catch (error) {
    console.error('좋아요 토글 오류:', error);
    return false;
  }
};

export const incrementPlaylistView = async (playlistId: number): Promise<void> => {
  try {
    await apiClient.post(`/playlists/${playlistId}/view`);
  } catch (error) {
    console.error('조회수 증가 오류:', error);
  }
};

// ============ Comment API ============

export interface CommentResponse {
  id: number;
  author: string;
  content: string;
  createdAt: string;
  parentId?: number;
}

export const getPlaylistComments = async (playlistId: number): Promise<CommentResponse[]> => {
  try {
    const response = await apiClient.get(`/playlists/${playlistId}/comments`);
    return response.data;
  } catch (error) {
    console.error('댓글 조회 오류:', error);
    return [];
  }
};

export const createComment = async (playlistId: number, content: string): Promise<CommentResponse | null> => {
  try {
    const response = await apiClient.post(`/playlists/${playlistId}/comments`, { content });
    return response.data;
  } catch (error) {
    console.error('댓글 작성 오류:', error);
    return null;
  }
};

export const deleteComment = async (playlistId: number, commentId: number): Promise<boolean> => {
  try {
    await apiClient.delete(`/playlists/${playlistId}/comments/${commentId}`);
    return true;
  } catch (error) {
    console.error('댓글 삭제 오류:', error);
    return false;
  }
};

// ============ Spotify API (기존) ============

// Spotify 플레이리스트 인터페이스
export interface SpotifyPlaylist {
  id: string;
  name: string;
  image: string;
  owner: string;
}

// 플레이리스트 내 트랙
export interface Track {
  title: string;
  album: {
    title: string;
    image: string;
  };
  artists: string;
}

// Spotify 플레이리스트 검색
export const searchPlaylists = async (keyword: string, offset: number = 0): Promise<SpotifyPlaylist[]> => {
  try {
    const response = await apiClient.get(`/search/playlist/${encodeURIComponent(keyword)}?offset=${offset}`);
    return response.data;
  } catch (error) {
    console.error('플레이리스트 검색 오류:', error);
    return [];
  }
};

// 플레이리스트의 트랙 가져오기
export const getPlaylistTracks = async (playlistId: string): Promise<Track[]> => {
  try {
    const response = await apiClient.get(`/search/tracks/${playlistId}`, {
      timeout: 60000, // 대용량 플레이리스트를 위해 60초 타임아웃
    });
    return response.data;
  } catch (error) {
    console.error('트랙 가져오기 오류:', error);
    return [];
  }
};

// YouTube 비디오 ID 가져오기
export const getYoutubeVideoId = async (title: string, artist: string): Promise<string> => {
  try {
    // 특수문자 정리
    const cleanTitle = title.replace(/[\[\](){}'"<>]/g, ' ').trim();
    const cleanArtist = artist.replace(/[\[\](){}'"<>]/g, ' ').trim();
    
    const response = await apiClient.get(`/search/track`, {
      params: { title: cleanTitle, artist: cleanArtist },
      timeout: 15000, // 15초 타임아웃
    });
    return response.data || '';
  } catch (error) {
    console.error('YouTube 검색 오류:', error);
    return '';
  }
};

// 트랙 정보 가져오기 (앨범 이미지 등)
export interface TrackInfo {
  title: string;
  artist: string;
  album: string;
  albumImage: string;
  duration: number;
}

export const getTrackInfo = async (title: string, artist: string): Promise<TrackInfo | null> => {
  try {
    const response = await apiClient.get(`/search/track/info`, {
      params: { title, artist }
    });
    return response.data;
  } catch (error) {
    console.error('트랙 정보 검색 오류:', error);
    return null;
  }
};

// 트랙 검색 (여러 결과)
export const searchTracks = async (query: string, limit: number = 10): Promise<TrackInfo[]> => {
  try {
    const response = await apiClient.get(`/search/tracks/search`, {
      params: { query, limit }
    });
    return response.data;
  } catch (error) {
    console.error('트랙 검색 오류:', error);
    return [];
  }
};
