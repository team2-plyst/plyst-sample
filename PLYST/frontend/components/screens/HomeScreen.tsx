import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Bell, User, Music2, TrendingUp, Clock, Heart, Share2, MessageCircle, Play, ChevronDown, ChevronUp, Send, Loader2, Plus, Sparkles } from "lucide-react";
import { Input } from "../ui/input";
import MusicPlayer from "../MusicPlayer";
import SearchPlaylistModal from "../SearchPlaylistModal";
import CreatePlaylistModal from "../CreatePlaylistModal";
import AIRecommendModal from "../AIRecommendModal";
import ProfileModal from "../ProfileModal";
import NotificationModal from "../NotificationModal";
import { Track, getYoutubeVideoId, getTrackInfo, getTrendingPlaylists, getLikedPlaylists, togglePlaylistLike, PlaylistPost, Comment, createPlaylist, CreatePlaylistRequest, getUserPlaylists, createComment, getPlaylistComments } from "../../services/api";

const imgBackground = "/0.jpg";

interface CurrentTrack {
  track: Track;
  videoId: string;
}

interface RecentlyPlayedTrack {
  id: string;
  title: string;
  artist: string;
  albumImage?: string;
  duration: string;
  playedAt: Date;
  isLiked: boolean;
}

// 재생 대기열 인터페이스
interface PlayQueue {
  tracks: { title: string; artist: string; albumImage?: string; duration?: string }[];
  currentIndex: number;
  originalTracks?: { title: string; artist: string; albumImage?: string; duration?: string }[]; // 셔플 전 원본
}

interface HomeScreenProps {
  onLogout: () => void;
}

// 재생 시간 포맷 함수 (초 -> 시간/분 표시)
const formatListeningTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  }
  return `${minutes}분`;
};

export default function HomeScreen({ onLogout }: HomeScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"trending" | "recent" | "liked">("trending");
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<CurrentTrack | null>(null);
  const [playQueue, setPlayQueue] = useState<PlayQueue | null>(null);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off");
  const [likedTracks, setLikedTracks] = useState<Set<string>>(() => {
    // localStorage에서 좋아요한 트랙 목록 불러오기
    const saved = localStorage.getItem("likedTracks");
    if (saved) {
      try {
        return new Set(JSON.parse(saved));
      } catch {
        return new Set();
      }
    }
    return new Set();
  });

  // 재생 시간 (초 단위) - localStorage에서 불러오기
  const [totalListeningTime, setTotalListeningTime] = useState<number>(() => {
    const saved = localStorage.getItem("totalListeningTime");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [expandedPlaylist, setExpandedPlaylist] = useState<number | null>(null);
  const [loadingTrack, setLoadingTrack] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [trackAlbumImages, setTrackAlbumImages] = useState<Record<string, string>>({});
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [isAIRecommendOpen, setIsAIRecommendOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(3); // 초기값: 읽지 않은 알림 수
  const [aiRecommendedPlaylists, setAIRecommendedPlaylists] = useState<PlaylistPost[]>([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(true);
  const [recentlyPlayed, setRecentlyPlayed] = useState<RecentlyPlayedTrack[]>(() => {
    // localStorage에서 최근 재생 기록 불러오기
    const saved = localStorage.getItem("recentlyPlayed");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((item: RecentlyPlayedTrack) => ({
          ...item,
          playedAt: new Date(item.playedAt),
        }));
      } catch {
        return [];
      }
    }
    return [];
  });
  const [playlistPosts, setPlaylistPosts] = useState<PlaylistPost[]>([]);
  const [likedPlaylists, setLikedPlaylists] = useState<PlaylistPost[]>([]);

  // 플레이리스트 데이터 불러오기
  useEffect(() => {
    const loadPlaylists = async () => {
      setIsLoadingPlaylists(true);
      try {
        const trending = await getTrendingPlaylists();
        
        // 로그인한 경우 사용자의 플레이리스트도 불러오기
        const userId = localStorage.getItem('userId');
        let userPlaylists: PlaylistPost[] = [];
        if (userId) {
          userPlaylists = await getUserPlaylists(parseInt(userId));
        }
        
        // 트렌딩 + 사용자 플레이리스트 합치기 (중복 제거)
        const allPlaylists = [...userPlaylists];
        for (const t of trending) {
          if (!allPlaylists.some(p => p.id === t.id)) {
            allPlaylists.push(t);
          }
        }
        setPlaylistPosts(allPlaylists);
        
        // 좋아요한 플레이리스트 불러오기
        try {
          const liked = await getLikedPlaylists();
          setLikedPlaylists(liked);
        } catch {
          // 로그인하지 않은 경우 무시
        }
      } catch (error) {
        console.error('플레이리스트 불러오기 오류:', error);
      } finally {
        setIsLoadingPlaylists(false);
      }
    };

    loadPlaylists();
  }, []);

  // 재생 중일 때 재생 시간 카운트 (1초마다)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (currentTrack) {
      interval = setInterval(() => {
        setTotalListeningTime(prev => {
          const newTime = prev + 1;
          localStorage.setItem("totalListeningTime", String(newTime));
          return newTime;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentTrack]);

  // 최근 재생 기록을 localStorage에 저장
  useEffect(() => {
    localStorage.setItem("recentlyPlayed", JSON.stringify(recentlyPlayed));
  }, [recentlyPlayed]);

  // 최근 재생 기록에 곡 추가
  const addToRecentlyPlayed = (track: { title: string; artist: string; albumImage?: string; duration?: string }) => {
    const newTrack: RecentlyPlayedTrack = {
      id: `${track.title}-${track.artist}-${Date.now()}`,
      title: track.title,
      artist: track.artist,
      albumImage: track.albumImage || "",
      duration: track.duration || "0:00",
      playedAt: new Date(),
      isLiked: false,
    };

    setRecentlyPlayed(prev => {
      // 같은 곡이 이미 있으면 제거 (최상단에 다시 추가하기 위해)
      const filtered = prev.filter(
        item => !(item.title === track.title && item.artist === track.artist)
      );
      // 최대 50개까지만 저장
      return [newTrack, ...filtered].slice(0, 50);
    });
  };

  const handleLikePlaylist = async (postId: number) => {
    try {
      const isLiked = await togglePlaylistLike(postId);
      setPlaylistPosts(posts =>
        posts.map(post =>
          post.id === postId
            ? { ...post, isLiked, likes: isLiked ? post.likes + 1 : post.likes - 1 }
            : post
        )
      );
      // 좋아요 목록 업데이트
      if (isLiked) {
        const likedPost = playlistPosts.find(p => p.id === postId);
        if (likedPost) {
          setLikedPlaylists(prev => [...prev, { ...likedPost, isLiked: true }]);
        }
      } else {
        setLikedPlaylists(prev => prev.filter(p => p.id !== postId));
      }
    } catch (error) {
      console.error('좋아요 처리 오류:', error);
      // 로컬에서만 처리
      setPlaylistPosts(posts =>
        posts.map(post =>
          post.id === postId
            ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
            : post
        )
      );
    }
  };

  const handleAddComment = async (postId: number) => {
    if (!newComment.trim()) return;
    
    // DB에 댓글 저장
    const savedComment = await createComment(postId, newComment);
    
    if (savedComment) {
      setPlaylistPosts(posts =>
        posts.map(post =>
          post.id === postId
            ? {
                ...post,
                comments: [
                  ...post.comments,
                  { id: savedComment.id, author: savedComment.author, content: savedComment.content, createdAt: savedComment.createdAt },
                ],
              }
            : post
        )
      );
      setNewComment("");
    } else {
      alert("댓글 작성에 실패했습니다.");
    }
  };

  const handleShare = (post: PlaylistPost) => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(`${post.title} - ${window.location.href}`);
      alert("링크가 복사되었습니다!");
    }
  };

  // 플레이리스트가 펼쳐지면 트랙들의 앨범 이미지 가져오기
  useEffect(() => {
    if (expandedPlaylist === null) return;
    
    const post = playlistPosts.find(p => p.id === expandedPlaylist);
    if (!post) return;

    const fetchAlbumImages = async () => {
      for (const track of post.tracks) {
        const trackKey = `${track.title}-${track.artist}`;
        if (trackAlbumImages[trackKey]) continue; // 이미 로드됨
        
        try {
          const info = await getTrackInfo(track.title, track.artist);
          if (info?.albumImage) {
            setTrackAlbumImages(prev => ({
              ...prev,
              [trackKey]: info.albumImage
            }));
          }
        } catch (error) {
          console.error('앨범 이미지 가져오기 오류:', error);
        }
      }
    };

    fetchAlbumImages();
  }, [expandedPlaylist, playlistPosts]);

  // 플레이리스트에서 특정 트랙 재생 (재생 대기열 설정)
  const handlePlayTrackFromPlaylist = async (
    trackIndex: number,
    playlistTracks: { title: string; artist: string; albumImage?: string; duration?: string }[]
  ) => {
    const track = playlistTracks[trackIndex];
    const trackKey = `${track.title}-${track.artist}`;
    if (loadingTrack === trackKey) return;
    
    setLoadingTrack(trackKey);
    try {
      const videoId = await getYoutubeVideoId(track.title, track.artist);
      if (videoId) {
        const trackData: Track = {
          title: track.title,
          artists: track.artist,
          album: {
            title: "플레이리스트",
            image: track.albumImage || "",
          },
        };
        setCurrentTrack({ track: trackData, videoId });
        setPlayQueue({ tracks: playlistTracks, currentIndex: trackIndex });
        
        // 최근 재생 기록에 추가
        addToRecentlyPlayed(track);
      } else {
        alert("해당 곡을 찾을 수 없습니다.");
      }
    } catch (error) {
      console.error("트랙 재생 오류:", error);
      alert("재생 중 오류가 발생했습니다.");
    } finally {
      setLoadingTrack(null);
    }
  };

  const handlePlayTrack = async (title: string, artist: string, albumImage?: string, duration?: string) => {
    const trackKey = `${title}-${artist}`;
    if (loadingTrack === trackKey) return;
    
    setLoadingTrack(trackKey);
    try {
      const videoId = await getYoutubeVideoId(title, artist);
      if (videoId) {
        const track: Track = {
          title,
          artists: artist,
          album: {
            title: "플레이리스트",
            image: albumImage || "",
          },
        };
        setCurrentTrack({ track, videoId });
        // 단일 트랙 재생 시 재생 대기열 초기화
        setPlayQueue(null);
        
        // 최근 재생 기록에 추가
        addToRecentlyPlayed({ title, artist, albumImage, duration });
      } else {
        alert("해당 곡을 찾을 수 없습니다.");
      }
    } catch (error) {
      console.error("트랙 재생 오류:", error);
      alert("재생 중 오류가 발생했습니다.");
    } finally {
      setLoadingTrack(null);
    }
  };

  // 이전 트랙 재생
  const handlePreviousTrack = async () => {
    if (!playQueue || playQueue.currentIndex <= 0) return;
    const newIndex = playQueue.currentIndex - 1;
    await handlePlayTrackFromPlaylist(newIndex, playQueue.tracks);
  };

  // 다음 트랙 재생
  const handleNextTrack = async () => {
    if (!playQueue || playQueue.currentIndex >= playQueue.tracks.length - 1) return;
    const newIndex = playQueue.currentIndex + 1;
    await handlePlayTrackFromPlaylist(newIndex, playQueue.tracks);
  };

  // 트랙 종료 시 호출 (다음 곡 자동 재생)
  const handleTrackEnd = async () => {
    if (!playQueue) return;
    
    const isLastTrack = playQueue.currentIndex >= playQueue.tracks.length - 1;
    
    if (isLastTrack) {
      // 마지막 곡일 때
      if (repeatMode === "all") {
        // 전체 반복: 첫 곡으로 돌아가기
        await handlePlayTrackFromPlaylist(0, playQueue.tracks);
      }
      // repeatMode가 "off"면 아무것도 하지 않음 (곡 종료)
    } else {
      // 다음 곡이 있으면 자동 재생
      await handleNextTrack();
    }
  };

  // 셔플 토글
  const handleShuffleToggle = () => {
    if (!playQueue) {
      setIsShuffle(!isShuffle);
      return;
    }

    if (!isShuffle) {
      // 셔플 ON: 현재 트랙을 제외한 나머지를 섞고 현재 트랙을 맨 앞에 배치
      const currentTrackData = playQueue.tracks[playQueue.currentIndex];
      const otherTracks = playQueue.tracks.filter((_, i) => i !== playQueue.currentIndex);
      
      // Fisher-Yates 셔플
      for (let i = otherTracks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [otherTracks[i], otherTracks[j]] = [otherTracks[j], otherTracks[i]];
      }
      
      const shuffledTracks = [currentTrackData, ...otherTracks];
      setPlayQueue({
        tracks: shuffledTracks,
        currentIndex: 0,
        originalTracks: playQueue.originalTracks || playQueue.tracks,
      });
    } else {
      // 셔플 OFF: 원본 순서로 복원
      if (playQueue.originalTracks) {
        const currentTrackData = playQueue.tracks[playQueue.currentIndex];
        const originalIndex = playQueue.originalTracks.findIndex(
          t => t.title === currentTrackData.title && t.artist === currentTrackData.artist
        );
        setPlayQueue({
          tracks: playQueue.originalTracks,
          currentIndex: originalIndex >= 0 ? originalIndex : 0,
          originalTracks: undefined,
        });
      }
    }
    setIsShuffle(!isShuffle);
  };

  // 반복 모드 토글
  const handleRepeatToggle = () => {
    if (repeatMode === "off") setRepeatMode("all");
    else if (repeatMode === "all") setRepeatMode("one");
    else setRepeatMode("off");
  };

  // 좋아요 토글
  const handleLikeToggle = () => {
    if (!currentTrack) return;
    const trackKey = `${currentTrack.track.title}-${currentTrack.track.artists}`;
    
    setLikedTracks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(trackKey)) {
        newSet.delete(trackKey);
      } else {
        newSet.add(trackKey);
      }
      // localStorage에 저장
      localStorage.setItem("likedTracks", JSON.stringify([...newSet]));
      return newSet;
    });
  };

  // 현재 트랙이 좋아요 상태인지 확인
  const isCurrentTrackLiked = currentTrack 
    ? likedTracks.has(`${currentTrack.track.title}-${currentTrack.track.artists}`)
    : false;

  return (
    <div className="h-screen w-full aurora-bg flex flex-col overflow-hidden">
      {/* Stars overlay */}
      <div className="stars" />
      
      {/* Top Header - Aurora Glass */}
      <header className="relative z-10 flex items-center justify-between p-4 backdrop-blur-xl bg-black/30 border-b border-emerald-500/10">
        {/* Left: Logo/Title */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 backdrop-blur-lg border border-emerald-400/30 rounded-xl p-2 aurora-glow">
            <Music2 className="w-6 h-6 text-emerald-300" strokeWidth={1.5} />
          </div>
          <h1 className="aurora-text text-xl font-bold hidden sm:block">PLYST</h1>
        </motion.div>

        {/* Center: Search */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1 max-w-md mx-4"
        >
          <div 
            className="relative cursor-pointer"
            onClick={() => setIsSearchModalOpen(true)}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400/70" />
            <Input
              type="text"
              placeholder="플레이리스트 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={() => setIsSearchModalOpen(true)}
              readOnly
              className="pl-10 bg-emerald-900/20 border-emerald-500/20 text-white placeholder:text-emerald-300/50 backdrop-blur-sm focus:bg-emerald-900/30 focus:border-emerald-400/40 cursor-pointer"
            />
          </div>
        </motion.div>

        {/* Right: Notification, Profile */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2"
        >
          <button 
            onClick={() => setIsNotificationOpen(true)}
            className="p-2 hover:bg-emerald-500/10 rounded-lg transition-colors relative"
          >
            <Bell className="w-5 h-5 text-emerald-300" />
            {/* Notification badge - 읽지 않은 알림이 있을 때만 표시 */}
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full animate-pulse"></span>
            )}
          </button>
          <button 
            onClick={() => setIsProfileOpen(true)}
            className="p-2 hover:bg-emerald-500/10 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 backdrop-blur-sm border border-emerald-400/30 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-emerald-300" />
            </div>
          </button>
        </motion.div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section - Aurora Glass Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="aurora-glass rounded-3xl p-6 md:p-8 mb-6"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="aurora-text text-3xl font-bold mb-2">환영합니다! 👋</h2>
                <p className="text-emerald-200/70">오늘도 좋은 음악과 함께하세요</p>
              </div>
              <div className="flex gap-2">
                <div className="backdrop-blur-lg bg-emerald-500/10 border border-emerald-400/20 rounded-2xl px-4 py-2">
                  <p className="text-emerald-300/60 text-xs">재생 시간</p>
                  <p className="text-emerald-100">{formatListeningTime(totalListeningTime)}</p>
                </div>
                <div className="backdrop-blur-lg bg-cyan-500/10 border border-cyan-400/20 rounded-2xl px-4 py-2">
                  <p className="text-cyan-300/60 text-xs">곡 좋아요</p>
                  <p className="text-cyan-100">{likedTracks.size}곡</p>
                </div>
                <div className="backdrop-blur-lg bg-purple-500/10 border border-purple-400/20 rounded-2xl px-4 py-2">
                  <p className="text-purple-300/60 text-xs">플리 좋아요</p>
                  <p className="text-purple-100">{likedPlaylists.length}개</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Access Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6"
          >
            {[
              { title: "인기 플레이리스트", desc: "지금 가장 인기있는 플레이리스트", icon: TrendingUp, color: "from-emerald-500 to-teal-500", hoverBg: "emerald", action: () => setActiveTab("trending") },
              { title: "최근 재생", desc: "최근에 들은 음악", icon: Clock, color: "from-cyan-500 to-blue-500", hoverBg: "cyan", action: () => setActiveTab("recent") },
              { title: "좋아요 목록", desc: "당신이 좋아한 음악", icon: Heart, color: "from-purple-500 to-pink-500", hoverBg: "purple", action: () => setActiveTab("liked") },
            ].map((item, i) => (
              <div
                key={i}
                onClick={item.action}
                className="aurora-glass aurora-glass-hover rounded-2xl p-6 transition-all cursor-pointer group relative overflow-hidden"
              >
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-15 transition-opacity`} />
                
                {/* Icon */}
                <div className="relative">
                  <div className={`bg-gradient-to-br ${item.color} bg-opacity-20 backdrop-blur-sm border border-white/10 rounded-xl p-3 w-fit mb-4 group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-white text-xl mb-1">{item.title}</h3>
                  <p className="text-emerald-200/60 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Playlist Creation Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="flex flex-wrap gap-3 mb-6"
          >
            <button 
              onClick={() => setIsCreatePlaylistOpen(true)}
              className="group flex items-center gap-3 aurora-glass aurora-glass-hover rounded-2xl px-5 py-3 transition-all"
            >
              <div className="p-2 bg-emerald-500/20 rounded-xl group-hover:bg-emerald-500/30 transition-colors">
                <Plus className="w-5 h-5 text-emerald-300" />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">플레이리스트 만들기</p>
                <p className="text-emerald-300/50 text-xs">나만의 플레이리스트 생성</p>
              </div>
            </button>
            
            <button 
              onClick={() => setIsAIRecommendOpen(true)}
              className="group flex items-center gap-3 backdrop-blur-xl bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-blue-500/20 hover:from-emerald-500/30 hover:via-cyan-500/30 hover:to-blue-500/30 border border-emerald-400/30 hover:border-emerald-400/50 rounded-2xl px-5 py-3 transition-all aurora-glow">
              <div className="p-2 bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 rounded-xl group-hover:from-emerald-500/40 group-hover:to-cyan-500/40 transition-colors">
                <Sparkles className="w-5 h-5 text-emerald-200" />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">AI 추천 플레이리스트</p>
                <p className="text-emerald-200/70 text-xs">AI가 취향에 맞게 추천</p>
              </div>
            </button>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="aurora-glass rounded-2xl p-2 mb-6 inline-flex gap-2"
          >
            {[
              { id: "trending" as const, label: "플레이리스트", icon: Music2 },
              { id: "recent" as const, label: "최근 재생", icon: Clock },
              { id: "liked" as const, label: "좋아요", icon: Heart },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 text-emerald-100 border border-emerald-400/30"
                    : "text-emerald-300/70 hover:text-emerald-100 hover:bg-emerald-500/10"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-sm">{tab.label}</span>
              </button>
            ))}
          </motion.div>

          {/* Music Grid / Playlist Posts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="aurora-glass rounded-3xl p-6 mb-6"
          >
            <h3 className="aurora-text text-2xl font-bold mb-4">
              {activeTab === "trending" && "플레이리스트"}
              {activeTab === "recent" && "최근 재생"}
              {activeTab === "liked" && "좋아요 목록"}
            </h3>
            
            {/* Playlist Posts for Trending Tab */}
            {activeTab === "trending" && (
              <div className="space-y-4">
                {isLoadingPlaylists ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                    <span className="ml-3 text-emerald-200/70">플레이리스트를 불러오는 중...</span>
                  </div>
                ) : playlistPosts.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="aurora-glass border border-dashed border-emerald-400/20 rounded-2xl p-8"
                  >
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/50 to-cyan-500/50 rounded-2xl flex items-center justify-center mb-4 aurora-glow">
                        <Music2 className="w-8 h-8 text-emerald-200/60" />
                      </div>
                      <p className="text-emerald-100/80 mb-2">플레이리스트가 없습니다</p>
                      <p className="text-emerald-200/50 text-sm">첫 번째 플레이리스트를 만들어보세요!</p>
                    </div>
                  </motion.div>
                ) : (
                playlistPosts.map((post, postIndex) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + postIndex * 0.1 }}
                    className="backdrop-blur-lg bg-emerald-900/10 border border-emerald-500/10 rounded-2xl overflow-hidden hover:border-emerald-400/20 transition-all"
                  >
                    {/* Post Header - 클릭하면 곡 목록 펼치기 */}
                    <div 
                      className="p-4 cursor-pointer hover:bg-emerald-500/5 transition-colors"
                      onClick={() => setExpandedPlaylist(expandedPlaylist === post.id ? null : post.id)}
                    >
                      <div className="flex items-start gap-4">
                        {/* Playlist Cover */}
                        <div className={`w-24 h-24 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-xl shrink-0 flex items-center justify-center text-3xl shadow-lg aurora-glow`}>
                          {post.author.avatar}
                        </div>
                        
                        {/* Post Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-emerald-300/60 text-sm">{post.author.name}</span>
                            <span className="text-emerald-400/40 text-xs">• {post.createdAt}</span>
                          </div>
                          <h4 className="text-white text-lg font-medium mb-1 truncate">{post.title}</h4>
                          <p className="text-emerald-200/60 text-sm line-clamp-2">{post.description}</p>
                          {/* Tags */}
                          {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {post.tags.slice(0, 4).map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-0.5 text-xs bg-emerald-500/10 text-emerald-300/70 rounded-full border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="text-emerald-400/40 text-xs mt-2">{post.tracks.length}곡</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-emerald-500/10">
                        {/* Like */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLikePlaylist(post.id);
                          }}
                          className="flex items-center gap-2 text-emerald-300/70 hover:text-emerald-200 transition-colors"
                        >
                          <Heart className={`w-5 h-5 ${post.isLiked ? "fill-emerald-400 text-emerald-400" : ""}`} />
                          <span className="text-sm">{post.likes}</span>
                        </button>
                        
                        {/* Comment */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedPlaylist(expandedPlaylist === post.id ? null : post.id);
                          }}
                          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
                        >
                          <MessageCircle className="w-5 h-5" />
                          <span className="text-sm">{post.comments.length}</span>
                        </button>
                        
                        {/* Share */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(post);
                          }}
                          className="flex items-center gap-2 text-emerald-300/70 hover:text-emerald-200 transition-colors"
                        >
                          <Share2 className="w-5 h-5" />
                          <span className="text-sm">{post.shares}</span>
                        </button>

                        {/* Expand Indicator */}
                        <div className="ml-auto flex items-center gap-1 text-emerald-400/50">
                          {expandedPlaylist === post.id ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {expandedPlaylist === post.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          {/* Track List */}
                          <div className="px-4 pb-4">
                            <div className="backdrop-blur-lg bg-black/30 rounded-xl p-3 space-y-1 border border-emerald-500/10">
                              {post.tracks.map((track, trackIndex) => {
                                const isLoading = loadingTrack === `${track.title}-${track.artist}`;
                                const trackKey = `${track.title}-${track.artist}`;
                                const albumImage = trackAlbumImages[trackKey];
                                // 플레이리스트 트랙 목록 준비
                                const playlistTracks = post.tracks.map((t) => ({
                                  title: t.title,
                                  artist: t.artist,
                                  albumImage: trackAlbumImages[`${t.title}-${t.artist}`],
                                  duration: t.duration,
                                }));
                                return (
                                  <div
                                    key={track.id}
                                    onClick={() => handlePlayTrackFromPlaylist(trackIndex, playlistTracks)}
                                    className={`flex items-center gap-3 p-2 rounded-lg hover:bg-emerald-500/10 transition-colors cursor-pointer group ${isLoading ? 'bg-emerald-500/10' : ''}`}
                                  >
                                    <span className="w-6 text-emerald-400/40 text-sm text-center">{trackIndex + 1}</span>
                                    {/* Album Image with Play Button Overlay */}
                                    <div className="relative w-10 h-10 shrink-0">
                                      {albumImage ? (
                                        <img 
                                          src={albumImage} 
                                          alt={track.title}
                                          className="w-10 h-10 rounded-lg object-cover"
                                        />
                                      ) : (
                                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg animate-pulse" />
                                      )}
                                      <div 
                                        className={`absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center transition-opacity ${isLoading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                      >
                                        {isLoading ? (
                                          <Loader2 className="w-4 h-4 text-emerald-300 animate-spin" />
                                        ) : (
                                          <Play className="w-4 h-4 text-emerald-300 ml-0.5" />
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-white text-sm truncate">{track.title}</p>
                                      <p className="text-emerald-300/50 text-xs truncate">{track.artist}</p>
                                    </div>
                                    <span className="text-emerald-400/40 text-xs mr-2">{track.duration}</span>
                                    {/* 곡 좋아요 버튼 */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const trackKey = `${track.title}-${track.artist}`;
                                        setLikedTracks(prev => {
                                          const newSet = new Set(prev);
                                          if (newSet.has(trackKey)) {
                                            newSet.delete(trackKey);
                                          } else {
                                            newSet.add(trackKey);
                                          }
                                          localStorage.setItem("likedTracks", JSON.stringify([...newSet]));
                                          return newSet;
                                        });
                                      }}
                                      className="p-1.5 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                    >
                                      <Heart
                                        className={`w-4 h-4 ${
                                          likedTracks.has(`${track.title}-${track.artist}`)
                                            ? "fill-emerald-400 text-emerald-400"
                                            : "text-emerald-300/50 hover:text-emerald-200/80"
                                        }`}
                                      />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Comments Section */}
                          <div className="px-4 pb-4 border-t border-emerald-500/10">
                            <h5 className="text-emerald-100 text-sm font-medium my-3">댓글 {post.comments.length}개</h5>
                            
                            {/* Comment Input */}
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 rounded-full flex items-center justify-center text-sm">
                                👤
                              </div>
                              <div className="flex-1 relative">
                                <Input
                                  type="text"
                                  placeholder="댓글 작성..."
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                  onKeyDown={(e) => e.key === "Enter" && handleAddComment(post.id)}
                                  className="pr-10 bg-emerald-900/20 border-emerald-500/20 text-white placeholder:text-emerald-300/50 text-sm"
                                />
                                <button
                                  onClick={() => handleAddComment(post.id)}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-emerald-500/10 rounded transition-colors"
                                >
                                  <Send className="w-4 h-4 text-emerald-300/60" />
                                </button>
                              </div>
                            </div>

                            {/* Comment List */}
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {post.comments.length === 0 ? (
                                <p className="text-emerald-300/40 text-sm text-center py-4">첫 번째 댓글을 남겨보세요!</p>
                              ) : (
                                post.comments.map((comment) => (
                                  <div key={comment.id} className="flex gap-2 bg-emerald-500/5 rounded-lg p-2">
                                    <div className="w-6 h-6 bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 rounded-full flex items-center justify-center text-xs shrink-0">
                                      👤
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-emerald-100 text-xs font-medium">{comment.author}</span>
                                        <span className="text-emerald-400/40 text-xs">{comment.createdAt}</span>
                                      </div>
                                      <p className="text-emerald-100/80 text-sm">{comment.content}</p>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))
                )}
              </div>
            )}

            {/* Song List for other tabs */}
            {activeTab !== "trending" && (
              <div className="space-y-4">
                {/* 최근 재생 탭 */}
                {activeTab === "recent" && (
                  <>
                    {recentlyPlayed.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="aurora-glass border border-dashed border-emerald-400/20 rounded-2xl p-8"
                      >
                        <div className="flex flex-col items-center justify-center text-center">
                          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/50 to-blue-500/50 rounded-2xl flex items-center justify-center mb-4 aurora-glow">
                            <Clock className="w-8 h-8 text-cyan-200/60" />
                          </div>
                          <p className="text-emerald-100/80 mb-2">최근 재생한 곡이 없습니다</p>
                          <p className="text-emerald-200/50 text-sm">플레이리스트에서 곡을 재생해보세요!</p>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="space-y-2">
                        {recentlyPlayed.slice(0, 10).map((item, i) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 + i * 0.05 }}
                            className="backdrop-blur-lg bg-emerald-900/10 border border-emerald-500/10 rounded-xl p-4 hover:bg-emerald-500/10 hover:border-emerald-400/20 transition-all cursor-pointer group"
                            onClick={() => handlePlayTrack(item.title, item.artist, item.albumImage, item.duration)}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-8 h-8 flex items-center justify-center text-emerald-400/50 group-hover:text-emerald-300 transition-colors">
                                <span>{i + 1}</span>
                              </div>
                              {item.albumImage ? (
                                <img src={item.albumImage} alt={item.title} className="w-12 h-12 rounded-lg shrink-0 group-hover:scale-105 transition-transform object-cover" />
                              ) : (
                                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg shrink-0 group-hover:scale-105 transition-transform flex items-center justify-center">
                                  <Music2 className="w-6 h-6 text-white/80" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-white truncate">{item.title}</p>
                                <p className="text-emerald-300/60 text-sm truncate">{item.artist}</p>
                              </div>
                              <div className="text-emerald-400/60 text-sm hidden sm:block">{item.duration}</div>
                              <button 
                                className="p-2 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRecentlyPlayed(prev => prev.map(track => track.id === item.id ? { ...track, isLiked: !track.isLiked } : track));
                                }}
                              >
                                <Heart className={`w-5 h-5 ${item.isLiked ? "fill-emerald-400 text-emerald-400" : "text-emerald-300/70"}`} />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* 좋아요 탭 */}
                {activeTab === "liked" && (
                  <div className="space-y-6">
                    {/* 좋아요한 플레이리스트 섹션 */}
                    <div>
                      <h3 className="text-emerald-100/80 text-lg font-medium mb-3 flex items-center gap-2">
                        <Music2 className="w-5 h-5 text-emerald-400" />
                        좋아요한 플레이리스트
                      </h3>
                      {playlistPosts.filter(post => post.isLiked).length === 0 ? (
                        <div className="aurora-glass border border-dashed border-emerald-400/20 rounded-xl p-6">
                          <p className="text-emerald-200/50 text-center text-sm">좋아요한 플레이리스트가 없습니다</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {playlistPosts.filter(post => post.isLiked).map((post, i) => (
                            <motion.div
                              key={post.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="backdrop-blur-lg bg-emerald-900/10 border border-emerald-500/10 rounded-xl p-4 hover:bg-emerald-500/10 hover:border-emerald-400/20 transition-all cursor-pointer group"
                              onClick={() => setExpandedPlaylist(expandedPlaylist === post.id ? null : post.id)}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-lg shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform`}>
                                  <Music2 className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white font-medium truncate">{post.title}</p>
                                  <p className="text-emerald-300/50 text-sm truncate">{post.author.name} · {post.tracks.length}곡</p>
                                </div>
                                <button
                                  className="p-2 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleLikePlaylist(post.id);
                                  }}
                                >
                                  <Heart className="w-5 h-5 fill-emerald-400 text-emerald-400" />
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 좋아요한 곡 섹션 */}
                    <div>
                      <h3 className="text-emerald-100/80 text-lg font-medium mb-3 flex items-center gap-2">
                        <Heart className="w-5 h-5 text-cyan-400" />
                        좋아요한 곡
                      </h3>
                      {likedTracks.size === 0 ? (
                        <div className="aurora-glass border border-dashed border-emerald-400/20 rounded-xl p-6">
                          <p className="text-emerald-200/50 text-center text-sm">좋아요한 곡이 없습니다</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {Array.from(likedTracks).map((trackKey, i) => {
                            const [title, artist] = trackKey.split('-');
                            // recentlyPlayed에서 앨범 이미지와 duration 찾기
                            const recentTrack = recentlyPlayed.find(t => t.title === title && t.artist === artist);
                            const albumImage = recentTrack?.albumImage || trackAlbumImages[trackKey];
                            const duration = recentTrack?.duration || "";
                            
                            return (
                              <motion.div
                                key={trackKey}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 + i * 0.05 }}
                                className="backdrop-blur-lg bg-emerald-900/10 border border-emerald-500/10 rounded-xl p-4 hover:bg-emerald-500/10 hover:border-emerald-400/20 transition-all cursor-pointer group"
                                onClick={() => handlePlayTrack(title, artist, albumImage, duration)}
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-8 h-8 flex items-center justify-center text-emerald-400/50 group-hover:text-emerald-300 transition-colors">
                                    <span>{i + 1}</span>
                                  </div>
                                  {albumImage ? (
                                    <img src={albumImage} alt={title} className="w-12 h-12 rounded-lg shrink-0 group-hover:scale-105 transition-transform object-cover" />
                                  ) : (
                                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg shrink-0 group-hover:scale-105 transition-transform flex items-center justify-center">
                                      <Music2 className="w-6 h-6 text-white/80" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white truncate">{title}</p>
                                    <p className="text-emerald-300/60 text-sm truncate">{artist}</p>
                                  </div>
                                  {duration && <div className="text-emerald-400/60 text-sm hidden sm:block">{duration}</div>}
                                  <button 
                                    className="p-2 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // 좋아요 해제
                                      setLikedTracks(prev => {
                                        const newSet = new Set(prev);
                                        newSet.delete(trackKey);
                                        localStorage.setItem("likedTracks", JSON.stringify([...newSet]));
                                        return newSet;
                                      });
                                    }}
                                  >
                                    <Heart className="w-5 h-5 fill-emerald-400 text-emerald-400" />
                                  </button>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* View All Button */}
            <button className="w-full mt-4 aurora-btn rounded-xl px-4 py-3 text-emerald-100 transition-all">
              더 보기
            </button>
          </motion.div>

          {/* AI 추천 플레이리스트 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mb-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-emerald-400" />
              <h3 className="aurora-text text-2xl font-bold">AI 추천 플레이리스트</h3>
            </div>
            {aiRecommendedPlaylists.length === 0 ? (
              <div 
                onClick={() => setIsAIRecommendOpen(true)}
                className="aurora-glass aurora-glass-hover border border-dashed border-emerald-400/20 rounded-2xl p-8 transition-all cursor-pointer group"
              >
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform aurora-glow">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-emerald-100/80 mb-2">아직 AI 추천 플레이리스트가 없습니다</p>
                  <p className="text-emerald-200/50 text-sm">클릭하여 AI 추천을 받아보세요!</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {aiRecommendedPlaylists.map((playlist) => (
                  <motion.div
                    key={playlist.id}
                    layout
                    className="aurora-glass rounded-2xl overflow-hidden"
                  >
                    {/* 플레이리스트 헤더 */}
                    <div
                      onClick={() => setExpandedPlaylist(expandedPlaylist === playlist.id ? null : playlist.id)}
                      className="p-4 hover:bg-white/10 transition-all cursor-pointer group"
                    >
                      <div className="flex gap-4 items-center">
                        <div className={`w-20 h-20 bg-gradient-to-br ${playlist.coverGradient} rounded-xl shrink-0 group-hover:scale-105 transition-transform flex items-center justify-center`}>
                          <Sparkles className="w-8 h-8 text-white/80" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium mb-1 truncate">{playlist.title}</p>
                          <p className="text-white/60 text-sm">{playlist.tracks.length}곡</p>
                          <p className="text-white/40 text-xs mt-1">{playlist.createdAt}</p>
                        </div>
                        <div className="text-white/60">
                          {expandedPlaylist === playlist.id ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 곡 목록 (펼쳐졌을 때) */}
                    <AnimatePresence>
                      {expandedPlaylist === playlist.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="border-t border-white/10"
                        >
                          <div className="p-4 space-y-2">
                            <p className="text-white/60 text-sm mb-3">{playlist.description}</p>
                            {playlist.tracks.map((track, idx) => (
                              <div
                                key={track.id}
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const trackKey = `${track.title}-${track.artist}`;
                                  setLoadingTrack(trackKey);
                                  try {
                                    const videoId = await getYoutubeVideoId(track.title, track.artist);
                                    if (videoId) {
                                      const trackInfo = await getTrackInfo(track.title, track.artist);
                                      setCurrentTrack({
                                        track: trackInfo ? {
                                          title: trackInfo.title,
                                          artists: trackInfo.artist,
                                          album: {
                                            title: trackInfo.album || "",
                                            image: trackInfo.albumImage || "",
                                          },
                                        } : {
                                          title: track.title,
                                          artists: track.artist,
                                          album: {
                                            title: "",
                                            image: "",
                                          },
                                        },
                                        videoId,
                                      });
                                    }
                                  } catch (error) {
                                    console.error("Error playing track:", error);
                                  } finally {
                                    setLoadingTrack(null);
                                  }
                                }}
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors cursor-pointer group/track"
                              >
                                <span className="text-white/40 text-sm w-6">{idx + 1}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-sm truncate">{track.title}</p>
                                  <p className="text-white/60 text-xs truncate">{track.artist}</p>
                                </div>
                                <span className="text-white/40 text-sm">{track.duration}</span>
                                <div className="opacity-0 group-hover/track:opacity-100 transition-opacity">
                                  {loadingTrack === `${track.title}-${track.artist}` ? (
                                    <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                                  ) : (
                                    <Play className="w-5 h-5 text-purple-400" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
                {/* 추가 버튼 */}
                <div 
                  onClick={() => setIsAIRecommendOpen(true)}
                  className="backdrop-blur-xl bg-white/5 border border-dashed border-white/20 rounded-2xl p-8 hover:bg-white/10 transition-all cursor-pointer group"
                >
                  <div className="flex flex-col items-center justify-center">
                    <Plus className="w-8 h-8 text-white/50 group-hover:text-white/80 transition-colors" />
                    <p className="text-white/50 text-sm mt-2 group-hover:text-white/80 transition-colors">AI 추천 더 받기</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Bottom padding for music player */}
          <div className="h-32" />
        </div>
      </main>

      {/* Bottom Music Player - 트랙이 선택되었을 때만 표시 */}
      <MusicPlayer 
        track={currentTrack?.track ?? null}
        videoId={currentTrack?.videoId ?? null}
        onClose={() => setCurrentTrack(null)}
        onPrevious={handlePreviousTrack}
        onNext={handleNextTrack}
        hasPrevious={playQueue !== null && playQueue.currentIndex > 0}
        hasNext={playQueue !== null && playQueue.currentIndex < playQueue.tracks.length - 1}
        onTrackEnd={handleTrackEnd}
        isShuffle={isShuffle}
        onShuffleToggle={handleShuffleToggle}
        repeatMode={repeatMode}
        onRepeatToggle={handleRepeatToggle}
        isLiked={isCurrentTrackLiked}
        onLikeToggle={handleLikeToggle}
      />

      {/* Search Playlist Modal */}
      <SearchPlaylistModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectTrack={(track, videoId) => {
          setCurrentTrack({ track, videoId });
          setIsSearchModalOpen(false);
          
          // 최근 재생 기록에 추가
          addToRecentlyPlayed({
            title: track.title,
            artist: track.artists,
            albumImage: track.album?.image,
          });
        }}
        userPlaylistPosts={playlistPosts.map(post => ({
          id: post.id,
          author: post.author,
          title: post.title,
          description: post.description,
          coverGradient: post.coverGradient,
          tags: post.tags,
          tracks: post.tracks,
        }))}
      />

      {/* Create Playlist Modal */}
      <CreatePlaylistModal
        isOpen={isCreatePlaylistOpen}
        onClose={() => setIsCreatePlaylistOpen(false)}
        onCreate={async (newPlaylist) => {
          // DB에 플레이리스트 저장
          const request: CreatePlaylistRequest = {
            title: newPlaylist.title,
            description: newPlaylist.description,
            isPublic: true,
            tags: newPlaylist.tags || [],
            tracks: newPlaylist.tracks.map(t => ({
              title: t.title,
              artist: t.artist,
              durationSec: t.duration ? parseInt(t.duration.split(':')[0]) * 60 + parseInt(t.duration.split(':')[1] || '0') : 210,
              albumImage: t.albumImage,
            })),
          };
          
          const savedPlaylist = await createPlaylist(request);
          
          if (savedPlaylist) {
            // 성공 시 DB에서 받은 플레이리스트 사용
            const newPost: PlaylistPost = {
              id: savedPlaylist.id || Date.now(),
              author: { name: "나", avatar: "🎵" },
              title: savedPlaylist.title || newPlaylist.title,
              description: savedPlaylist.description || newPlaylist.description,
              coverGradient: "from-cyan-500 to-blue-600",
              tags: newPlaylist.tags || [],
              likes: 0,
              shares: 0,
              isLiked: false,
              createdAt: "방금 전",
              tracks: newPlaylist.tracks.map((t, i) => ({
                id: i + 1,
                title: t.title,
                artist: t.artist,
                duration: t.duration || "3:30",
                albumImage: t.albumImage,
              })),
              comments: [],
            };
            setPlaylistPosts([newPost, ...playlistPosts]);
            alert(`"${newPlaylist.title}" 플레이리스트가 생성되었습니다!`);
          } else {
            alert("플레이리스트 생성에 실패했습니다. 다시 시도해주세요.");
          }
        }}
      />

      {/* AI Recommend Playlist Modal */}
      <AIRecommendModal
        isOpen={isAIRecommendOpen}
        onClose={() => setIsAIRecommendOpen(false)}
        onSelectPlaylist={(playlist) => {
          // AI 추천 플레이리스트를 aiRecommendedPlaylists에 추가
          const newPost: PlaylistPost = {
            id: Date.now(),
            author: { name: "AI 추천", avatar: "✨" },
            title: playlist.title,
            description: playlist.description,
            coverGradient: playlist.coverGradient,
            tags: playlist.tags || [],
            likes: 0,
            shares: 0,
            isLiked: false,
            createdAt: "방금 전",
            tracks: playlist.tracks.map((t, i) => ({
              id: i + 1,
              title: t.title,
              artist: t.artist,
              duration: t.duration,
            })),
            comments: [],
          };
          setAIRecommendedPlaylists([newPost, ...aiRecommendedPlaylists]);
        }}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onLogout={() => {
          setIsProfileOpen(false);
          // localStorage 정리
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userId');
          localStorage.removeItem('nickname');
          onLogout();
        }}
      />

      {/* Notification Modal */}
      <NotificationModal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onUnreadCountChange={setUnreadNotificationCount}
      />
    </div>
  );
}
