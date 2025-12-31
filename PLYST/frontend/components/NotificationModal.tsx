import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Heart, MessageCircle, UserPlus, Music2, Sparkles, Check, Trash2 } from "lucide-react";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

interface Notification {
  id: number;
  type: "like" | "comment" | "follow" | "playlist" | "ai";
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  avatar?: string;
}

// 기본 알림 데이터
const DEFAULT_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    type: "like",
    title: "새벽감성",
    message: "님이 회원님의 플레이리스트를 좋아합니다.",
    time: "방금 전",
    isRead: false,
    avatar: "🌙",
  },
  {
    id: 2,
    type: "comment",
    title: "음악좋아",
    message: "님이 댓글을 남겼습니다: \"정말 좋은 플리네요!\"",
    time: "5분 전",
    isRead: false,
    avatar: "🎵",
  },
  {
    id: 3,
    type: "follow",
    title: "재즈마스터",
    message: "님이 회원님을 팔로우하기 시작했습니다.",
    time: "30분 전",
    isRead: false,
    avatar: "🎷",
  },
  {
    id: 4,
    type: "ai",
    title: "AI 추천",
    message: "새로운 추천 플레이리스트가 준비되었습니다!",
    time: "1시간 전",
    isRead: true,
    avatar: "✨",
  },
  {
    id: 5,
    type: "like",
    title: "뮤직팬",
    message: "님이 회원님의 플레이리스트를 좋아합니다.",
    time: "2시간 전",
    isRead: true,
    avatar: "🎧",
  },
  {
    id: 6,
    type: "playlist",
    title: "운동마니아",
    message: "님이 새 플레이리스트를 공유했습니다.",
    time: "3시간 전",
    isRead: true,
    avatar: "💪",
  },
];

// localStorage 키 (사용자별로 구분)
const getStorageKey = () => {
  const userId = localStorage.getItem('userId');
  return userId ? `notifications_${userId}` : 'notifications_guest';
};

export default function NotificationModal({ isOpen, onClose, onUnreadCountChange }: NotificationModalProps) {
  // localStorage에서 알림 상태 불러오기
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem(getStorageKey());
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_NOTIFICATIONS;
      }
    }
    return DEFAULT_NOTIFICATIONS;
  });

  // 알림 상태가 변경되면 localStorage에 저장
  useEffect(() => {
    localStorage.setItem(getStorageKey(), JSON.stringify(notifications));
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // unreadCount가 변경되면 부모에게 알림
  React.useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount, onUnreadCountChange]);

  const markAsRead = (id: number) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="w-4 h-4 text-pink-400" />;
      case "comment":
        return <MessageCircle className="w-4 h-4 text-blue-400" />;
      case "follow":
        return <UserPlus className="w-4 h-4 text-green-400" />;
      case "playlist":
        return <Music2 className="w-4 h-4 text-purple-400" />;
      case "ai":
        return <Sparkles className="w-4 h-4 text-yellow-400" />;
      default:
        return <Music2 className="w-4 h-4 text-white" />;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-16"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, x: 20, y: -10 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 20, y: -10 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm max-h-[70vh] overflow-hidden backdrop-blur-2xl bg-gradient-to-br from-white/20 to-white/5 border border-white/20 rounded-2xl shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-white/10 bg-black/20 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <h2 className="text-white text-lg font-bold">알림</h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
                  title="모두 읽음 처리"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
                  title="모두 삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto max-h-[calc(70vh-60px)]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
                  <Music2 className="w-8 h-8 text-white/50" />
                </div>
                <p className="text-white/70 mb-1">알림이 없습니다</p>
                <p className="text-white/50 text-sm">새로운 알림이 오면 여기에 표시됩니다</p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onClick={() => markAsRead(notification.id)}
                    className={`p-4 hover:bg-white/10 transition-colors cursor-pointer group ${
                      !notification.isRead ? "bg-white/5" : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-lg">
                          {notification.avatar}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                          {getIcon(notification.type)}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm">
                          <span className="font-medium">{notification.title}</span>
                          <span className="text-white/70">{notification.message}</span>
                        </p>
                        <p className="text-white/50 text-xs mt-1">{notification.time}</p>
                      </div>

                      {/* Unread indicator & Delete */}
                      <div className="flex items-center gap-2">
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all"
                        >
                          <X className="w-3 h-3 text-white/50" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
