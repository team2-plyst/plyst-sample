import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Sparkles, Tag, Search, Plus, Check, Music2, Loader2 } from "lucide-react";
import { Input } from "./ui/input";

interface RecommendedPlaylist {
  id: string;
  title: string;
  description: string;
  coverGradient: string;
  trackCount: number;
  tags: string[];
  tracks: {
    title: string;
    artist: string;
    duration: string;
  }[];
}

interface AIRecommendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlaylist: (playlist: RecommendedPlaylist) => void;
}

// 미리 정의된 추천 플레이리스트 데이터
const allRecommendedPlaylists: RecommendedPlaylist[] = [
  {
    id: "1",
    title: "비 오는 날의 재즈 🌧️",
    description: "비 오는 날 카페에서 듣기 좋은 재즈 모음",
    coverGradient: "from-blue-500 to-cyan-600",
    trackCount: 8,
    tags: ["비", "재즈", "카페", "감성", "휴식"],
    tracks: [
      { title: "Autumn Leaves", artist: "Bill Evans", duration: "5:23" },
      { title: "Take Five", artist: "Dave Brubeck", duration: "5:24" },
      { title: "So What", artist: "Miles Davis", duration: "9:22" },
      { title: "My Favorite Things", artist: "John Coltrane", duration: "13:41" },
      { title: "Blue in Green", artist: "Miles Davis", duration: "5:37" },
    ],
  },
  {
    id: "2",
    title: "새벽 감성 발라드 🌙",
    description: "잠이 안 오는 밤에 듣기 좋은 한국 발라드",
    coverGradient: "from-purple-600 to-pink-500",
    trackCount: 10,
    tags: ["새벽", "발라드", "감성", "슬픔", "한국"],
    tracks: [
      { title: "밤편지", artist: "아이유", duration: "4:30" },
      { title: "비도 오고 그래서", artist: "헤이즈", duration: "4:15" },
      { title: "사랑은 늘 도망가", artist: "임영웅", duration: "4:02" },
      { title: "좋니", artist: "윤종신", duration: "4:44" },
      { title: "너의 모든 순간", artist: "성시경", duration: "4:18" },
    ],
  },
  {
    id: "3",
    title: "운동할 때 듣는 EDM 💪",
    description: "운동 효율 200% 올려주는 신나는 EDM",
    coverGradient: "from-orange-500 to-red-600",
    trackCount: 12,
    tags: ["운동", "EDM", "신나는", "파티", "에너지"],
    tracks: [
      { title: "Levels", artist: "Avicii", duration: "3:19" },
      { title: "Titanium", artist: "David Guetta", duration: "4:05" },
      { title: "Animals", artist: "Martin Garrix", duration: "3:11" },
      { title: "Wake Me Up", artist: "Avicii", duration: "4:07" },
      { title: "Don't You Worry Child", artist: "Swedish House Mafia", duration: "3:32" },
    ],
  },
  {
    id: "4",
    title: "공부할 때 집중 음악 📚",
    description: "집중력을 높여주는 잔잔한 피아노 연주곡",
    coverGradient: "from-green-500 to-teal-600",
    trackCount: 15,
    tags: ["공부", "집중", "피아노", "클래식", "잔잔한"],
    tracks: [
      { title: "River Flows in You", artist: "Yiruma", duration: "3:34" },
      { title: "Kiss The Rain", artist: "Yiruma", duration: "4:01" },
      { title: "Comptine d'un autre été", artist: "Yann Tiersen", duration: "2:22" },
      { title: "Nuvole Bianche", artist: "Ludovico Einaudi", duration: "5:57" },
      { title: "Una Mattina", artist: "Ludovico Einaudi", duration: "3:23" },
    ],
  },
  {
    id: "5",
    title: "드라이브 뮤직 🚗",
    description: "드라이브할 때 기분 좋아지는 음악",
    coverGradient: "from-yellow-500 to-orange-500",
    trackCount: 10,
    tags: ["드라이브", "신나는", "여행", "기분전환", "팝"],
    tracks: [
      { title: "Blinding Lights", artist: "The Weeknd", duration: "3:20" },
      { title: "Uptown Funk", artist: "Bruno Mars", duration: "4:30" },
      { title: "Happy", artist: "Pharrell Williams", duration: "3:53" },
      { title: "Can't Stop the Feeling", artist: "Justin Timberlake", duration: "3:56" },
      { title: "Shake It Off", artist: "Taylor Swift", duration: "3:39" },
    ],
  },
  {
    id: "6",
    title: "로맨틱 데이트 플리 💕",
    description: "연인과 함께하는 낭만적인 시간을 위한 음악",
    coverGradient: "from-pink-500 to-rose-600",
    trackCount: 8,
    tags: ["로맨틱", "데이트", "사랑", "감성", "R&B"],
    tracks: [
      { title: "All of Me", artist: "John Legend", duration: "4:29" },
      { title: "Perfect", artist: "Ed Sheeran", duration: "4:23" },
      { title: "Just the Way You Are", artist: "Bruno Mars", duration: "3:40" },
      { title: "Thinking Out Loud", artist: "Ed Sheeran", duration: "4:41" },
      { title: "Make You Feel My Love", artist: "Adele", duration: "3:32" },
    ],
  },
  {
    id: "7",
    title: "힙합 바이브 🎤",
    description: "트렌디한 한국 힙합 모음",
    coverGradient: "from-gray-700 to-gray-900",
    trackCount: 10,
    tags: ["힙합", "랩", "한국", "트렌디", "스웩"],
    tracks: [
      { title: "붕붕", artist: "빅나티", duration: "2:52" },
      { title: "ON THE STREET", artist: "j-hope", duration: "2:48" },
      { title: "해금", artist: "산이", duration: "3:22" },
      { title: "Daechwita", artist: "Agust D", duration: "4:06" },
      { title: "Chicken Noodle Soup", artist: "j-hope", duration: "3:18" },
    ],
  },
  {
    id: "8",
    title: "명상과 힐링 🧘",
    description: "마음을 편안하게 해주는 명상 음악",
    coverGradient: "from-indigo-500 to-purple-600",
    trackCount: 6,
    tags: ["명상", "힐링", "휴식", "잔잔한", "수면"],
    tracks: [
      { title: "Weightless", artist: "Marconi Union", duration: "8:09" },
      { title: "Pure Shores", artist: "All Saints", duration: "4:23" },
      { title: "Strawberry Swing", artist: "Coldplay", duration: "4:09" },
      { title: "Porcelain", artist: "Moby", duration: "4:01" },
      { title: "Sunset Lover", artist: "Petit Biscuit", duration: "3:28" },
    ],
  },
];

// 인기 태그 목록
const popularTags = [
  "비", "새벽", "감성", "운동", "공부", "드라이브", "카페", 
  "발라드", "힙합", "R&B", "팝", "재즈", "EDM", "피아노",
  "로맨틱", "신나는", "잔잔한", "힐링", "파티", "여행"
];

export default function AIRecommendModal({
  isOpen,
  onClose,
  onSelectPlaylist,
}: AIRecommendModalProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<RecommendedPlaylist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<RecommendedPlaylist | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSearch = () => {
    if (tags.length === 0) return;
    
    setIsSearching(true);
    setHasSearched(true);
    setSelectedPlaylist(null);
    
    // 태그와 일치하는 플레이리스트 검색 시뮬레이션
    setTimeout(() => {
      const results = allRecommendedPlaylists.filter((playlist) =>
        playlist.tags.some((playlistTag) =>
          tags.some((searchTag) =>
            playlistTag.toLowerCase().includes(searchTag.toLowerCase()) ||
            searchTag.toLowerCase().includes(playlistTag.toLowerCase())
          )
        )
      );
      
      // 매칭되는 태그 수에 따라 정렬
      results.sort((a, b) => {
        const aMatches = a.tags.filter((t) =>
          tags.some((st) => t.toLowerCase().includes(st.toLowerCase()))
        ).length;
        const bMatches = b.tags.filter((t) =>
          tags.some((st) => t.toLowerCase().includes(st.toLowerCase()))
        ).length;
        return bMatches - aMatches;
      });
      
      setSearchResults(results);
      setIsSearching(false);
    }, 800);
  };

  const handleSelectPlaylist = (playlist: RecommendedPlaylist) => {
    setSelectedPlaylist(playlist);
  };

  const handleConfirmSelection = () => {
    if (selectedPlaylist) {
      onSelectPlaylist(selectedPlaylist);
      handleClose();
    }
  };

  const handleClose = () => {
    setTags([]);
    setTagInput("");
    setSearchResults([]);
    setSelectedPlaylist(null);
    setHasSearched(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-3xl backdrop-blur-2xl bg-gradient-to-br from-purple-900/90 to-pink-900/90 border border-purple-400/30 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-purple-400/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-xl">
                  <Sparkles className="w-6 h-6 text-purple-200" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">AI 추천 플레이리스트</h2>
                  <p className="text-purple-200/70 text-sm">태그를 입력하면 AI가 맞춤 플레이리스트를 추천해드려요</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
            {/* Tag Input Section */}
            <div className="mb-6">
              <label className="text-white/90 text-sm font-medium mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                태그 입력
              </label>
              <div className="flex gap-2 mb-3">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag(tagInput);
                    }
                  }}
                  placeholder="원하는 분위기나 장르를 입력하세요"
                  className="flex-1 bg-white/10 border-purple-400/30 text-white placeholder:text-purple-200/50"
                />
                <button
                  onClick={() => handleAddTag(tagInput)}
                  className="px-4 py-2 bg-purple-500/30 hover:bg-purple-500/50 border border-purple-400/30 rounded-xl text-white transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Selected Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-purple-500/40 to-pink-500/40 border border-purple-400/30 rounded-full text-sm text-white"
                    >
                      #{tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="p-0.5 hover:bg-white/20 rounded-full transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Popular Tags */}
              <div className="mt-4">
                <p className="text-purple-200/70 text-xs mb-2">인기 태그</p>
                <div className="flex flex-wrap gap-2">
                  {popularTags.slice(0, 12).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleAddTag(tag)}
                      disabled={tags.includes(tag)}
                      className={`px-3 py-1 rounded-full text-xs transition-colors ${
                        tags.includes(tag)
                          ? "bg-purple-500/50 text-purple-100 cursor-not-allowed"
                          : "bg-white/10 hover:bg-white/20 text-white/80 hover:text-white"
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Search Button */}
            <button
              onClick={handleSearch}
              disabled={tags.length === 0 || isSearching}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-all mb-6"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  AI가 분석 중...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  플레이리스트 추천받기
                </>
              )}
            </button>

            {/* Search Results */}
            {hasSearched && !isSearching && (
              <div className="space-y-3">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <Music2 className="w-4 h-4" />
                  추천 플레이리스트 ({searchResults.length}개)
                </h3>
                
                {searchResults.length === 0 ? (
                  <div className="text-center py-8 text-purple-200/70">
                    <p>입력한 태그와 일치하는 플레이리스트가 없습니다.</p>
                    <p className="text-sm mt-1">다른 태그로 검색해보세요!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {searchResults.map((playlist) => (
                      <motion.div
                        key={playlist.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          selectedPlaylist?.id === playlist.id
                            ? "bg-purple-500/30 border-purple-400/50"
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        }`}
                        onClick={() => handleSelectPlaylist(playlist)}
                      >
                        <div className="flex items-start gap-4">
                          {/* Playlist Cover */}
                          <div
                            className={`w-16 h-16 rounded-xl bg-gradient-to-br ${playlist.coverGradient} flex items-center justify-center flex-shrink-0`}
                          >
                            <Music2 className="w-8 h-8 text-white/80" />
                          </div>

                          {/* Playlist Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-white font-medium truncate">{playlist.title}</h4>
                              {selectedPlaylist?.id === playlist.id && (
                                <div className="p-1 bg-purple-500 rounded-full">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                            <p className="text-purple-200/70 text-sm line-clamp-1 mt-0.5">
                              {playlist.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <span className="text-purple-200/50 text-xs">
                                {playlist.trackCount}곡
                              </span>
                              <span className="text-purple-200/30">•</span>
                              {playlist.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 bg-purple-500/20 rounded-full text-xs text-purple-200/70"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Track Preview */}
                        {selectedPlaylist?.id === playlist.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mt-4 pt-4 border-t border-purple-400/20"
                          >
                            <p className="text-purple-200/70 text-xs mb-2">수록곡 미리보기</p>
                            <div className="space-y-2">
                              {playlist.tracks.slice(0, 3).map((track, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between text-sm"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-purple-300/50 w-4">{idx + 1}</span>
                                    <span className="text-white/90">{track.title}</span>
                                    <span className="text-purple-200/50">- {track.artist}</span>
                                  </div>
                                  <span className="text-purple-200/50">{track.duration}</span>
                                </div>
                              ))}
                              {playlist.tracks.length > 3 && (
                                <p className="text-purple-200/50 text-xs text-center">
                                  +{playlist.tracks.length - 3}곡 더 있음
                                </p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-purple-400/20 flex justify-end gap-3">
            <button
              onClick={handleClose}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleConfirmSelection}
              disabled={!selectedPlaylist}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed rounded-xl text-white font-medium flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              플레이리스트 추가
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
