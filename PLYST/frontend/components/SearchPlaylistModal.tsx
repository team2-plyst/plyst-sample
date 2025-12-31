import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Search, Music, Loader2, Play, Users, Globe } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useSpotifySearch, TrackWithVideo } from "../hooks/useSpotifySearch";
import { SpotifyPlaylist, Track } from "../services/api";

interface UserPlaylist {
  id: number;
  author: {
    name: string;
    avatar: string;
  };
  title: string;
  description: string;
  coverGradient: string;
  tags?: string[];
  tracks: {
    id: number;
    title: string;
    artist: string;
    duration: string;
    albumImage?: string;
  }[];
}

interface SearchPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTrack: (track: TrackWithVideo, videoId: string) => void;
  userPlaylistPosts?: UserPlaylist[];
}

export default function SearchPlaylistModal({
  isOpen,
  onClose,
  onSelectTrack,
  userPlaylistPosts = [],
}: SearchPlaylistModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTab, setSearchTab] = useState<"user" | "spotify">("user");
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null);
  const [selectedUserPlaylist, setSelectedUserPlaylist] = useState<UserPlaylist | null>(null);
  const [loadingVideoId, setLoadingVideoId] = useState<string | null>(null);
  
  const {
    playlists,
    tracks,
    loading,
    error,
    searchPlaylistsByKeyword,
    loadPlaylistTracks,
    getVideoId,
    clearSearch,
  } = useSpotifySearch();

  // 유저 플레이리스트 필터링
  const userPlaylists = useMemo(() => {
    if (!searchQuery.trim()) return userPlaylistPosts;
    const query = searchQuery.toLowerCase();
    return userPlaylistPosts.filter(
      p => p.title.toLowerCase().includes(query) || 
           p.description.toLowerCase().includes(query) ||
           p.author.name.toLowerCase().includes(query)
    );
  }, [searchQuery, userPlaylistPosts]);

  // 검색 실행 (Spotify 탭일 때만)
  const handleSearch = () => {
    if (searchQuery.trim() && searchTab === "spotify") {
      setSelectedPlaylist(null);
      searchPlaylistsByKeyword(searchQuery);
    }
  };

  // 엔터 키 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchTab === "spotify") {
      handleSearch();
    }
  };

  // Spotify 플레이리스트 선택
  const handleSelectPlaylist = async (playlist: SpotifyPlaylist) => {
    setSelectedPlaylist(playlist);
    await loadPlaylistTracks(playlist.id);
  };

  // 유저 플레이리스트 선택
  const handleSelectUserPlaylist = (playlist: UserPlaylist) => {
    setSelectedUserPlaylist(playlist);
  };

  // 트랙 재생
  const handlePlayTrack = async (track: Track) => {
    setLoadingVideoId(track.title);
    try {
      const videoId = await getVideoId(track);
      if (videoId) {
        onSelectTrack(track, videoId);
        onClose();
      }
    } finally {
      setLoadingVideoId(null);
    }
  };

  // 유저 플레이리스트 트랙 재생
  const handlePlayUserTrack = async (track: { title: string; artist: string }) => {
    setLoadingVideoId(track.title);
    try {
      const fakeTrack: Track = {
        title: track.title,
        artists: track.artist,
        album: { title: "", image: "" },
      };
      const videoId = await getVideoId(fakeTrack);
      if (videoId) {
        onSelectTrack(fakeTrack, videoId);
        onClose();
      }
    } finally {
      setLoadingVideoId(null);
    }
  };

  // 모달 닫힐 때 초기화
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setSelectedPlaylist(null);
      setSelectedUserPlaylist(null);
      setSearchTab("user");
      clearSearch();
    }
  }, [isOpen, clearSearch]);

  // 뒤로가기
  const handleBack = () => {
    setSelectedPlaylist(null);
    setSelectedUserPlaylist(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-2xl max-h-[80vh] backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              {(selectedPlaylist || selectedUserPlaylist) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="text-white hover:bg-white/10"
                >
                  ← 뒤로
                </Button>
              )}
              <h2 className="text-white text-xl">
                {selectedPlaylist ? selectedPlaylist.name : 
                 selectedUserPlaylist ? selectedUserPlaylist.title : "플레이리스트 검색"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Tab Selector */}
          {!selectedPlaylist && !selectedUserPlaylist && (
            <div className="flex border-b border-white/10">
              <button
                onClick={() => setSearchTab("user")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                  searchTab === "user"
                    ? "text-white border-b-2 border-purple-400 bg-white/5"
                    : "text-white/50 hover:text-white/70"
                }`}
              >
                <Users className="w-4 h-4" />
                유저 플레이리스트
              </button>
              <button
                onClick={() => setSearchTab("spotify")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                  searchTab === "spotify"
                    ? "text-white border-b-2 border-green-400 bg-white/5"
                    : "text-white/50 hover:text-white/70"
                }`}
              >
                <Globe className="w-4 h-4" />
                Spotify 검색
              </button>
            </div>
          )}

          {/* Search Bar */}
          {!selectedPlaylist && !selectedUserPlaylist && (
            <div className="p-4 border-b border-white/10">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                  <Input
                    type="text"
                    placeholder={searchTab === "user" ? "유저 플레이리스트 검색..." : "Spotify에서 검색..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
                {searchTab === "spotify" && (
                  <Button
                    onClick={handleSearch}
                    disabled={loading}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/20"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "검색"}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="overflow-y-auto max-h-[60vh] p-4">
            {error && (
              <div className="text-center text-red-400 py-4">{error}</div>
            )}

            {loading && !playlists.length && !tracks.length && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}

            {/* 유저 플레이리스트 목록 */}
            {searchTab === "user" && !selectedUserPlaylist && userPlaylists.length > 0 && (
              <div className="grid grid-cols-1 gap-3">
                {userPlaylists.map((playlist) => (
                  <motion.div
                    key={playlist.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all cursor-pointer group"
                    onClick={() => handleSelectUserPlaylist(playlist)}
                  >
                    <div className="flex gap-4">
                      <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${playlist.coverGradient} flex items-center justify-center flex-shrink-0`}>
                        <Music className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">
                          {playlist.title}
                        </p>
                        <p className="text-white/60 text-sm truncate">
                          {playlist.author.avatar} {playlist.author.name}
                        </p>
                        {playlist.tags && playlist.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {playlist.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="px-1.5 py-0.5 text-xs bg-white/10 text-white/60 rounded-full"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-white/40 text-xs mt-1">
                          {playlist.tracks.length}곡
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* 유저 플레이리스트 트랙 목록 */}
            {selectedUserPlaylist && (
              <div className="space-y-2">
                <p className="text-white/60 text-sm mb-4">{selectedUserPlaylist.description}</p>
                {selectedUserPlaylist.tracks.map((track, index) => (
                  <motion.div
                    key={`${track.id}-${index}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-white/10 transition-all cursor-pointer group"
                    onClick={() => handlePlayUserTrack(track)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Music className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white truncate text-sm">{track.title}</p>
                        <p className="text-white/60 text-xs truncate">{track.artist}</p>
                      </div>
                      <span className="text-white/40 text-xs">{track.duration}</span>
                      <button className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors opacity-0 group-hover:opacity-100">
                        {loadingVideoId === track.title ? (
                          <Loader2 className="w-4 h-4 text-white animate-spin" />
                        ) : (
                          <Play className="w-4 h-4 text-white" />
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Spotify 플레이리스트 목록 */}
            {searchTab === "spotify" && !selectedPlaylist && playlists.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {playlists.map((playlist) => (
                  <motion.div
                    key={playlist.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-white/10 transition-all cursor-pointer group"
                    onClick={() => handleSelectPlaylist(playlist)}
                  >
                    <div className="flex gap-3">
                      {playlist.image ? (
                        <img
                          src={playlist.image}
                          alt={playlist.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <Music className="w-8 h-8 text-white" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white truncate text-sm font-medium">
                          {playlist.name}
                        </p>
                        <p className="text-white/60 text-xs truncate">
                          {playlist.owner}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* 트랙 목록 */}
            {selectedPlaylist && tracks.length > 0 && (
              <div className="space-y-2">
                {tracks.map((track, index) => (
                  <motion.div
                    key={`${track.title}-${index}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-white/10 transition-all cursor-pointer group"
                    onClick={() => handlePlayTrack(track)}
                  >
                    <div className="flex items-center gap-3">
                      {/* Album Image */}
                      {track.album.image ? (
                        <img
                          src={track.album.image}
                          alt={track.album.title}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <Music className="w-6 h-6 text-white" />
                        </div>
                      )}
                      
                      {/* Track Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white truncate text-sm">
                          {track.title}
                        </p>
                        <p className="text-white/60 text-xs truncate">
                          {track.artists}
                        </p>
                      </div>

                      {/* Play Button */}
                      <button className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors opacity-0 group-hover:opacity-100">
                        {loadingVideoId === track.title ? (
                          <Loader2 className="w-5 h-5 text-white animate-spin" />
                        ) : (
                          <Play className="w-5 h-5 text-white" />
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && !selectedPlaylist && playlists.length === 0 && userPlaylists.length === 0 && (
              <div className="text-center py-12">
                <Music className="w-12 h-12 text-white/30 mx-auto mb-4" />
                <p className="text-white/50">
                  플레이리스트를 검색하세요
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
