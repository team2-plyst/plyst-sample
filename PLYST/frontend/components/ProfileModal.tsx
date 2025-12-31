import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Edit3, LogOut, Music2, Heart, Users, UserPlus, Camera, Save, Loader2 } from "lucide-react";
import { updateNickname, getUserStats } from "../services/api";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

interface UserProfile {
  nickname: string;
  bio: string;
  avatar: string;
  musicTags: string[];
  playlists: number;
  likedPlaylists: number;
  followers: number;
  following: number;
}

const AVAILABLE_TAGS = [
  "재즈", "발라드", "EDM", "힙합", "R&B", "클래식", "록", "팝",
  "인디", "K-POP", "J-POP", "OST", "어쿠스틱", "일렉트로닉", "레트로"
];

export default function ProfileModal({ isOpen, onClose, onLogout }: ProfileModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  
  // localStorage에서 닉네임 가져오기 (DB에서 저장된 값)
  const savedNickname = localStorage.getItem('userNickname') || "음악러버";
  
  const [profile, setProfile] = useState<UserProfile>({
    nickname: savedNickname,
    bio: "음악과 함께하는 일상 🎵",
    avatar: "🎧",
    musicTags: [],
    playlists: 0,
    likedPlaylists: 0,
    followers: 0,
    following: 0,
  });

  // 모달이 열릴 때 DB에서 통계 불러오기
  useEffect(() => {
    if (isOpen) {
      const loadStats = async () => {
        setIsLoadingStats(true);
        const currentNickname = localStorage.getItem('userNickname') || "음악러버";
        setProfile(prev => ({ ...prev, nickname: currentNickname }));
        setEditForm(prev => ({ ...prev, nickname: currentNickname }));
        
        // DB에서 통계 가져오기
        const stats = await getUserStats();
        if (stats) {
          setProfile(prev => ({
            ...prev,
            nickname: stats.nickname || currentNickname,
            playlists: stats.playlistCount,
            likedPlaylists: stats.likedPlaylistCount,
            followers: stats.followerCount,
            following: stats.followingCount,
          }));
        }
        setIsLoadingStats(false);
      };
      loadStats();
    }
  }, [isOpen]);

  const [editForm, setEditForm] = useState({
    nickname: profile.nickname,
    bio: profile.bio,
    musicTags: [...profile.musicTags],
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 닉네임이 변경되었으면 API 호출
      if (editForm.nickname !== profile.nickname) {
        const result = await updateNickname(editForm.nickname);
        if (!result.success) {
          alert(result.message);
          setIsSaving(false);
          return;
        }
      }
      
      setProfile({
        ...profile,
        nickname: editForm.nickname,
        bio: editForm.bio,
        musicTags: editForm.musicTags,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('프로필 저장 오류:', error);
      alert('프로필 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm({
      nickname: profile.nickname,
      bio: profile.bio,
      musicTags: [...profile.musicTags],
    });
    setIsEditing(false);
  };

  const toggleTag = (tag: string) => {
    if (editForm.musicTags.includes(tag)) {
      setEditForm({
        ...editForm,
        musicTags: editForm.musicTags.filter(t => t !== tag),
      });
    } else if (editForm.musicTags.length < 5) {
      setEditForm({
        ...editForm,
        musicTags: [...editForm.musicTags, tag],
      });
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md max-h-[90vh] overflow-y-auto backdrop-blur-2xl bg-gradient-to-br from-emerald-900/30 via-black/40 to-cyan-900/30 border border-emerald-500/20 rounded-3xl shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-emerald-500/10 bg-black/30 backdrop-blur-xl rounded-t-3xl">
            <h2 className="text-emerald-100 text-xl font-bold">내 프로필</h2>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 hover:bg-emerald-500/10 rounded-lg transition-colors"
                >
                  <Edit3 className="w-5 h-5 text-emerald-300" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-emerald-500/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-emerald-300" />
              </button>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-full flex items-center justify-center text-4xl shadow-lg" style={{ boxShadow: '0 0 30px rgba(0, 255, 135, 0.3)' }}>
                  {profile.avatar}
                </div>
                {isEditing && (
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 rounded-full flex items-center justify-center hover:bg-emerald-500/30 transition-colors">
                    <Camera className="w-4 h-4 text-emerald-300" />
                  </button>
                )}
              </div>

              {/* Nickname */}
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.nickname}
                  onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                  className="mt-4 text-xl font-bold text-white bg-emerald-900/20 border border-emerald-500/20 rounded-lg px-4 py-2 text-center focus:outline-none focus:border-emerald-400"
                  placeholder="닉네임"
                />
              ) : (
                <h3 className="mt-4 text-xl font-bold text-emerald-100">{profile.nickname}</h3>
              )}

              {/* Bio */}
              {isEditing ? (
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className="mt-2 w-full text-emerald-100/80 bg-emerald-900/20 border border-emerald-500/20 rounded-lg px-4 py-2 text-center focus:outline-none focus:border-emerald-400 resize-none"
                  placeholder="한줄 소개"
                  rows={2}
                />
              ) : (
                <p className="mt-2 text-emerald-200/70 text-center">{profile.bio}</p>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              <div className="backdrop-blur-xl bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center mb-1">
                  <Music2 className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-white font-bold">{profile.playlists}</p>
                <p className="text-emerald-300/50 text-xs">플레이리스트</p>
              </div>
              <div className="backdrop-blur-xl bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center mb-1">
                  <Heart className="w-4 h-4 text-cyan-400" />
                </div>
                <p className="text-white font-bold">{profile.likedPlaylists}</p>
                <p className="text-cyan-300/50 text-xs">좋아요</p>
              </div>
              <div className="backdrop-blur-xl bg-teal-500/10 border border-teal-500/20 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center mb-1">
                  <Users className="w-4 h-4 text-teal-400" />
                </div>
                <p className="text-white font-bold">{profile.followers}</p>
                <p className="text-teal-300/50 text-xs">팔로워</p>
              </div>
              <div className="backdrop-blur-xl bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center mb-1">
                  <UserPlus className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-white font-bold">{profile.following}</p>
                <p className="text-blue-300/50 text-xs">팔로잉</p>
              </div>
            </div>

            {/* Music Tags */}
            <div className="mb-6">
              <h4 className="text-emerald-100 font-medium mb-3">🎵 음악 취향</h4>
              {isEditing ? (
                <div className="space-y-3">
                  <p className="text-emerald-300/50 text-sm">최대 5개까지 선택 가능</p>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_TAGS.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                          editForm.musicTags.includes(tag)
                            ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white"
                            : "bg-emerald-500/10 text-emerald-200/70 hover:bg-emerald-500/20 border border-emerald-500/20"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.musicTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 border border-emerald-400/30 rounded-full text-sm text-emerald-100"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {isEditing ? (
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="flex-1 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-100 border border-emerald-500/20 rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ boxShadow: '0 0 20px rgba(0, 255, 135, 0.3)' }}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSaving ? '저장 중...' : '저장'}
                </button>
              </div>
            ) : (
              <button
                onClick={onLogout}
                className="w-full py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/20 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                로그아웃
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
