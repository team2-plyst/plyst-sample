import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Heart,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Slider } from "./ui/slider";
import { Track, getTrackInfo } from "../services/api";

interface MusicPlayerProps {
  track: Track | null;
  videoId: string | null;
  onClose?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  onTrackEnd?: () => void;
  isShuffle?: boolean;
  onShuffleToggle?: () => void;
  repeatMode?: "off" | "all" | "one";
  onRepeatToggle?: () => void;
  isLiked?: boolean;
  onLikeToggle?: () => void;
}

// YouTube IFrame API 타입
declare global {
  interface Window {
    YT: {
      Player: new (elementId: string, options: {
        videoId: string;
        playerVars?: Record<string, number>;
        events?: {
          onReady?: (event: { target: YTPlayer }) => void;
          onStateChange?: (event: { data: number; target: YTPlayer }) => void;
        };
      }) => YTPlayer;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  setVolume: (volume: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  destroy: () => void;
}

export default function MusicPlayer({ 
  track, 
  videoId, 
  onPrevious, 
  onNext, 
  hasPrevious = false, 
  hasNext = false,
  onTrackEnd,
  isShuffle = false,
  onShuffleToggle,
  repeatMode = "off",
  onRepeatToggle,
  isLiked = false,
  onLikeToggle
}: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([100]);
  const [progress, setProgress] = useState([0]);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const [showVolumeValue, setShowVolumeValue] = useState(false);
  const [rippleProgress, setRippleProgress] = useState(false);
  const [rippleVolume, setRippleVolume] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [albumImage, setAlbumImage] = useState<string | null>(null);
  
  const playerRef = useRef<YTPlayer | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 트랙 변경 시 앨범 이미지 가져오기
  useEffect(() => {
    if (!track) {
      setAlbumImage(null);
      return;
    }

    // 이미 앨범 이미지가 있으면 사용
    if (track.album.image) {
      setAlbumImage(track.album.image);
      return;
    }

    // Spotify API에서 앨범 이미지 가져오기
    const fetchAlbumImage = async () => {
      try {
        const info = await getTrackInfo(track.title, track.artists);
        if (info?.albumImage) {
          setAlbumImage(info.albumImage);
        }
      } catch (error) {
        console.error('앨범 이미지 가져오기 오류:', error);
      }
    };

    fetchAlbumImage();
  }, [track]);

  // YouTube IFrame API 로드
  useEffect(() => {
    if (!videoId) return;
    
    const loadYouTubeAPI = () => {
      if (window.YT && window.YT.Player) {
        initPlayer();
        return;
      }

      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    };

    const initPlayer = () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }

      playerRef.current = new window.YT.Player('youtube-player', {
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: (event) => {
            setIsPlayerReady(true);
            setIsPlaying(true);
            event.target.setVolume(volume[0]);
            const dur = event.target.getDuration();
            setDuration(dur);
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            } else if (event.data === window.YT.PlayerState.ENDED) {
              if (repeatMode === "one") {
                event.target.seekTo(0, true);
                event.target.playVideo();
              } else if (onTrackEnd) {
                // 다음 곡으로 자동 이동 (반복모드 all 또는 다음 곡이 있을 때)
                onTrackEnd();
              } else {
                setIsPlaying(false);
              }
            }
          },
        },
      });
    };

    loadYouTubeAPI();

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId]);

  // 진행률 업데이트
  useEffect(() => {
    if (isPlaying && isPlayerReady && playerRef.current) {
      progressIntervalRef.current = setInterval(() => {
        if (playerRef.current && !isDraggingProgress) {
          const current = playerRef.current.getCurrentTime();
          const dur = playerRef.current.getDuration();
          setCurrentTime(current);
          if (dur > 0) {
            setProgress([(current / dur) * 100]);
          }
        }
      }, 1000);
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPlaying, isPlayerReady, isDraggingProgress]);

  // 볼륨 조절
  useEffect(() => {
    if (playerRef.current && isPlayerReady) {
      playerRef.current.setVolume(volume[0]);
    }
  }, [volume, isPlayerReady]);

  const isMuted = volume[0] === 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayPause = useCallback(() => {
    if (!playerRef.current || !isPlayerReady) return;
    
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  }, [isPlaying, isPlayerReady]);

  const handleProgressChange = (value: number[]) => {
    setProgress(value);
    setIsDraggingProgress(true);
    setRippleProgress(true);
    setTimeout(() => setRippleProgress(false), 600);
  };

  const handleProgressCommit = (value: number[]) => {
    if (playerRef.current && isPlayerReady && duration > 0) {
      const seekTime = (value[0] / 100) * duration;
      playerRef.current.seekTo(seekTime, true);
      setCurrentTime(seekTime);
    }
    setIsDraggingProgress(false);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value);
    setIsDraggingVolume(true);
    setRippleVolume(true);
    setTimeout(() => setRippleVolume(false), 600);
  };

  // 재생 중인 곡이 없으면 렌더링하지 않음
  if (!track || !videoId) {
    return null;
  }

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", damping: 20 }}
      className="backdrop-blur-2xl bg-gradient-to-t from-black/40 via-black/30 to-black/20 border-t border-white/10 p-4 shadow-2xl"
    >
      {/* Hidden YouTube Player */}
      <div id="youtube-player" className="hidden" />

      <div className="max-w-7xl mx-auto">
        {/* Progress Bar - Enhanced Glassy */}
        <div className="mb-4 relative">
          <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-3">
            <div className="relative">
              {/* Ripple effect when dragging */}
              <AnimatePresence>
                {rippleProgress && (
                  <>
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0.6 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="absolute inset-0 bg-white/10 rounded-xl"
                    />
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0.4 }}
                      animate={{ scale: 1.3, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
                      className="absolute inset-0 bg-white/5 rounded-xl"
                    />
                  </>
                )}
              </AnimatePresence>

              <motion.div
                animate={{
                  y: isDraggingProgress ? [0, -2, 0, 2, 0] : 0,
                }}
                transition={{
                  duration: 0.4,
                  ease: "easeInOut",
                }}
              >
                <Slider
                  value={progress}
                  onValueChange={handleProgressChange}
                  onValueCommit={handleProgressCommit}
                  onPointerUp={() => handleProgressCommit(progress)}
                  onPointerLeave={() => setIsDraggingProgress(false)}
                  max={100}
                  step={0.1}
                  className="cursor-pointer relative z-10"
                />
              </motion.div>

              {/* Time display - Glassy badges */}
              <div className="flex justify-between mt-3 text-xs">
                <motion.span
                  animate={{
                    scale: isDraggingProgress ? 1.1 : 1,
                    color: isDraggingProgress ? "#ffffff" : "#ffffff99",
                  }}
                  className="backdrop-blur-md bg-white/10 border border-white/20 rounded-full px-3 py-1"
                >
                  {formatTime(currentTime)}
                </motion.span>
                <motion.span
                  className="backdrop-blur-md bg-white/10 border border-white/20 rounded-full px-3 py-1 text-white/60"
                >
                  {formatTime(duration)}
                </motion.span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          {/* Left: Album Art and Song Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Album Art - Enhanced Glassy */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative group"
            >
              {albumImage ? (
                <img
                  src={albumImage}
                  alt={track.album.title}
                  className="w-14 h-14 rounded-xl shrink-0 object-cover border-2 border-white/30 shadow-lg"
                />
              ) : (
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl shrink-0 backdrop-blur-sm border-2 border-white/30 shadow-lg" />
              )}
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-xl transition-colors" />
            </motion.div>

            {/* Song Info */}
            <div className="min-w-0 flex-1">
              <motion.p
                animate={{ x: isPlaying ? [0, -5, 0] : 0 }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-white truncate"
              >
                {track.title}
              </motion.p>
              <p className="text-white/60 text-sm truncate">{track.artists}</p>
            </div>

            {/* Like Button - Enhanced Glassy */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onLikeToggle}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors shrink-0 backdrop-blur-md border border-white/20"
            >
              <motion.div
                animate={{
                  scale: isLiked ? [1, 1.2, 1] : 1,
                }}
                transition={{ duration: 0.3 }}
              >
                <Heart
                  className={`w-5 h-5 transition-colors ${
                    isLiked ? "fill-red-500 text-red-500" : "text-white/70"
                  }`}
                  strokeWidth={1.5}
                />
              </motion.div>
            </motion.button>
          </div>

          {/* Center: Playback Controls */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              {/* Shuffle - Enhanced Glassy */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onShuffleToggle}
                className={`p-2.5 rounded-xl transition-all backdrop-blur-md border ${
                  isShuffle
                    ? "bg-white/30 border-white/50 text-white shadow-lg shadow-white/20"
                    : "bg-white/10 border-white/20 text-white/70 hover:bg-white/20"
                }`}
              >
                <Shuffle className="w-4 h-4" strokeWidth={1.5} />
              </motion.button>

              {/* Previous - Enhanced Glassy */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onPrevious}
                disabled={!hasPrevious}
                className={`p-2.5 rounded-xl transition-all backdrop-blur-md border border-white/20 shadow-lg ${
                  hasPrevious
                    ? "bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                    : "bg-white/5 text-white/30 cursor-not-allowed"
                }`}
              >
                <SkipBack className="w-5 h-5" strokeWidth={1.5} fill="currentColor" />
              </motion.button>

              {/* Play/Pause - Enhanced with multiple effects */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePlayPause}
                className="p-4 bg-gradient-to-br from-white to-white/90 hover:from-white hover:to-white rounded-full transition-all backdrop-blur-lg border-2 border-white/50 shadow-2xl shadow-white/30 relative"
              >
                {/* Pulsing ring when playing */}
                {isPlaying && (
                  <motion.div
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute inset-0 rounded-full border-2 border-white/40"
                  />
                )}

                <AnimatePresence mode="wait">
                  {isPlaying ? (
                    <motion.div
                      key="pause"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Pause className="w-5 h-5 text-gray-900" strokeWidth={1.5} fill="currentColor" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="play"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Play className="w-5 h-5 text-gray-900" strokeWidth={1.5} fill="currentColor" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Next - Enhanced Glassy */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onNext}
                disabled={!hasNext}
                className={`p-2.5 rounded-xl transition-all backdrop-blur-md border border-white/20 shadow-lg ${
                  hasNext
                    ? "bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                    : "bg-white/5 text-white/30 cursor-not-allowed"
                }`}
              >
                <SkipForward className="w-5 h-5" strokeWidth={1.5} fill="currentColor" />
              </motion.button>

              {/* Repeat - Enhanced Glassy */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onRepeatToggle}
                className={`p-2.5 rounded-xl transition-all backdrop-blur-md border relative ${
                  repeatMode !== "off"
                    ? "bg-white/30 border-white/50 text-white shadow-lg shadow-white/20"
                    : "bg-white/10 border-white/20 text-white/70 hover:bg-white/20"
                }`}
              >
                <Repeat className="w-4 h-4" strokeWidth={1.5} />
                {repeatMode === "one" && (
                  <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="absolute top-1 right-1 w-1.5 h-1.5 bg-white rounded-full shadow-lg shadow-white/50"
                  />
                )}
              </motion.button>
            </div>
          </div>

          {/* Right: Volume Control - Enhanced Glassy */}
          <div className="flex items-center gap-3 flex-1 justify-end min-w-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setVolume(isMuted ? [70] : [0])}
              className="p-2.5 hover:bg-white/10 rounded-xl transition-colors backdrop-blur-md border border-white/20 shrink-0"
            >
              <AnimatePresence mode="wait">
                {isMuted ? (
                  <motion.div
                    key="muted"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                  >
                    <VolumeX className="w-5 h-5 text-white/70" strokeWidth={1.5} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="volume"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                  >
                    <Volume2 className="w-5 h-5 text-white/70" strokeWidth={1.5} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            <div
              className="w-28 hidden sm:block relative"
              onMouseEnter={() => setShowVolumeValue(true)}
              onMouseLeave={() => setShowVolumeValue(false)}
            >
              {/* Volume slider container - Glassy */}
              <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-xl p-2 relative">
                {/* Ripple effect when dragging */}
                <AnimatePresence>
                  {rippleVolume && (
                    <>
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0.6 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="absolute inset-0 bg-white/10 rounded-xl"
                      />
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0.4 }}
                        animate={{ scale: 1.3, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
                        className="absolute inset-0 bg-white/5 rounded-xl"
                      />
                    </>
                  )}
                </AnimatePresence>

                <motion.div
                  animate={{
                    x: isDraggingVolume ? [0, -1, 0, 1, 0] : 0,
                  }}
                  transition={{
                    duration: 0.4,
                    ease: "easeInOut",
                  }}
                >
                  <Slider
                    value={volume}
                    onValueChange={handleVolumeChange}
                    onPointerUp={() => setIsDraggingVolume(false)}
                    onPointerLeave={() => setIsDraggingVolume(false)}
                    max={100}
                    step={1}
                    className="relative z-10"
                  />
                </motion.div>

                {/* Volume value tooltip */}
                <AnimatePresence>
                  {(showVolumeValue || isDraggingVolume) && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.9 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute -top-10 left-1/2 -translate-x-1/2 backdrop-blur-md bg-black/40 border border-white/20 rounded-lg px-2.5 py-1 shadow-lg"
                    >
                      <motion.span
                        key={volume[0]}
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.1 }}
                        className="text-white text-xs font-medium"
                      >
                        {volume[0]}%
                      </motion.span>
                      {/* Arrow */}
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/40 border-r border-b border-white/20 rotate-45" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
