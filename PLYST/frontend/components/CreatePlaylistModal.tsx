import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Plus, Search, Music2, Trash2, Loader2, Tag } from "lucide-react";
import { Input } from "./ui/input";
import { searchTracks } from "../services/api";

interface Track {
  id: string;
  title: string;
  artist: string;
  albumImage?: string;
  duration?: string;
}

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (playlist: {
    title: string;
    description: string;
    tags: string[];
    tracks: Track[];
  }) => void;
}

export default function CreatePlaylistModal({
  isOpen,
  onClose,
  onCreate,
}: CreatePlaylistModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "tracks">("info");

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSearchTracks = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await searchTracks(searchQuery, 10);
      
      if (results && results.length > 0) {
        setSearchResults(
          results.map((info, index) => ({
            id: `${Date.now()}-${index}`,
            title: info.title,
            artist: info.artist,
            albumImage: info.albumImage,
            duration: info.duration ? formatDuration(info.duration) : "3:30",
          }))
        );
      } else {
        // 검색 결과가 없으면 입력값으로 임시 트랙 생성
        const parts = searchQuery.split(" - ");
        const trackTitle = parts[0] || searchQuery;
        const artist = parts[1] || "";
        setSearchResults([
          {
            id: `${Date.now()}`,
            title: trackTitle,
            artist: artist || "Unknown Artist",
            duration: "3:30",
          },
        ]);
      }
    } catch (error) {
      console.error("검색 오류:", error);
      // 오류 시에도 입력값으로 트랙 생성
      setSearchResults([
        {
          id: `${Date.now()}`,
          title: searchQuery,
          artist: "Unknown Artist",
          duration: "3:30",
        },
      ]);
    } finally {
      setIsSearching(false);
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleAddTrack = (track: Track) => {
    if (!tracks.find((t) => t.id === track.id)) {
      setTracks([...tracks, track]);
    }
    setSearchResults([]);
    setSearchQuery("");
  };

  const handleRemoveTrack = (trackId: string) => {
    setTracks(tracks.filter((t) => t.id !== trackId));
  };

  const handleCreate = () => {
    if (!title.trim()) {
      alert("플레이리스트 제목을 입력해주세요.");
      return;
    }
    
    onCreate({
      title: title.trim(),
      description: description.trim(),
      tags,
      tracks,
    });
    
    // Reset form
    setTitle("");
    setDescription("");
    setTags([]);
    setTracks([]);
    setSearchQuery("");
    setSearchResults([]);
    onClose();
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setTags([]);
    setTracks([]);
    setSearchQuery("");
    setSearchResults([]);
    setActiveTab("info");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden backdrop-blur-2xl bg-black/40 border border-white/20 rounded-3xl shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Music2 className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-white text-xl font-medium">플레이리스트 만들기</h2>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-4 border-b border-white/10">
              <button
                onClick={() => setActiveTab("info")}
                className={`px-4 py-2 rounded-xl text-sm transition-all ${
                  activeTab === "info"
                    ? "bg-white/20 text-white"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                기본 정보
              </button>
              <button
                onClick={() => setActiveTab("tracks")}
                className={`px-4 py-2 rounded-xl text-sm transition-all ${
                  activeTab === "tracks"
                    ? "bg-white/20 text-white"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                곡 추가 ({tracks.length})
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[65vh]">
              {activeTab === "info" ? (
                <div className="space-y-5">
                  {/* Title */}
                  <div>
                    <label className="block text-white/70 text-sm mb-2">제목 *</label>
                    <Input
                      type="text"
                      placeholder="플레이리스트 제목을 입력하세요"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-white/70 text-sm mb-2">설명</label>
                    <textarea
                      placeholder="플레이리스트에 대한 설명을 입력하세요"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 resize-none focus:outline-none focus:border-white/40 transition-colors"
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-white/70 text-sm mb-2">태그</label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="태그 입력 (예: 감성, 드라이브)"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                        className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                      />
                      <button
                        onClick={handleAddTag}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                    
                    {/* Tag List */}
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-purple-500/20 border border-purple-400/30 rounded-full text-purple-200 text-sm"
                          >
                            <Tag className="w-3 h-3" />
                            {tag}
                            <button
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-1 hover:text-white transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Search */}
                  <div>
                    <label className="block text-white/70 text-sm mb-2">곡 검색</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                        <Input
                          type="text"
                          placeholder="곡 제목 또는 '제목 - 아티스트' 형식으로 검색"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSearchTracks()}
                          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                        />
                      </div>
                      <button
                        onClick={handleSearchTracks}
                        disabled={isSearching}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-colors disabled:opacity-50"
                      >
                        {isSearching ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Search className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-white/60 text-sm">검색 결과 ({searchResults.length})</p>
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {searchResults.map((track) => (
                          <div
                            key={track.id}
                            className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                            onClick={() => handleAddTrack(track)}
                          >
                            {track.albumImage ? (
                              <img
                                src={track.albumImage}
                                alt={track.title}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm truncate">{track.title}</p>
                              <p className="text-white/50 text-xs truncate">{track.artist}</p>
                            </div>
                            <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                              <Plus className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Added Tracks */}
                  <div>
                    <p className="text-white/60 text-sm mb-2">추가된 곡 ({tracks.length})</p>
                    {tracks.length === 0 ? (
                      <div className="text-center py-8 text-white/40">
                        <Music2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>아직 추가된 곡이 없습니다</p>
                        <p className="text-sm mt-1">위에서 곡을 검색하여 추가하세요</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {tracks.map((track, index) => (
                          <div
                            key={track.id}
                            className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl"
                          >
                            <span className="w-6 text-white/40 text-sm text-center">
                              {index + 1}
                            </span>
                            {track.albumImage ? (
                              <img
                                src={track.albumImage}
                                alt={track.title}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm truncate">{track.title}</p>
                              <p className="text-white/50 text-xs truncate">{track.artist}</p>
                            </div>
                            <button
                              onClick={() => handleRemoveTrack(track.id)}
                              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-white/10">
              <p className="text-white/50 text-sm">
                {tracks.length}곡 · {tags.length}개 태그
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleCreate}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl text-white font-medium transition-colors"
                >
                  만들기
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
