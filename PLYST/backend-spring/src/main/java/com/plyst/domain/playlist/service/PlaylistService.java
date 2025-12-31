package com.plyst.domain.playlist.service;

import com.plyst.domain.comment.entity.Comment;
import com.plyst.domain.comment.repository.CommentRepository;
import com.plyst.domain.playlist.dto.PlaylistRequest;
import com.plyst.domain.playlist.dto.PlaylistResponse;
import com.plyst.domain.playlist.entity.Playlist;
import com.plyst.domain.playlist.entity.PlaylistItem;
import com.plyst.domain.playlist.entity.PlaylistLike;
import com.plyst.domain.playlist.repository.PlaylistItemRepository;
import com.plyst.domain.playlist.repository.PlaylistLikeRepository;
import com.plyst.domain.playlist.repository.PlaylistRepository;
import com.plyst.domain.track.entity.Track;
import com.plyst.domain.track.repository.TrackRepository;
import com.plyst.domain.user.entity.User;
import com.plyst.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class PlaylistService {

    private final PlaylistRepository playlistRepository;
    private final PlaylistItemRepository playlistItemRepository;
    private final PlaylistLikeRepository playlistLikeRepository;
    private final TrackRepository trackRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;

    @Transactional(readOnly = true)
    public List<PlaylistResponse> getTrendingPlaylists(Pageable pageable, Long currentUserId) {
        Page<Playlist> playlists = playlistRepository.findByIsPublicTrueAndIsDraftFalse(pageable);
        return playlists.stream()
                .map(p -> mapToResponse(p, currentUserId))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PlaylistResponse> searchPlaylists(String keyword, Pageable pageable, Long currentUserId) {
        Page<Playlist> playlists = playlistRepository.findByTitleContainingAndIsPublicTrueAndIsDraftFalse(keyword, pageable);
        return playlists.stream()
                .map(p -> mapToResponse(p, currentUserId))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<PlaylistResponse> getPlaylistById(Long id, Long currentUserId) {
        return playlistRepository.findById(id)
                .map(p -> mapToResponse(p, currentUserId));
    }

    @Transactional(readOnly = true)
    public List<PlaylistResponse> getUserPlaylists(Long userId, Long currentUserId) {
        List<Playlist> playlists = playlistRepository.findByOwnerId(userId);
        return playlists.stream()
                .map(p -> mapToResponse(p, currentUserId))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PlaylistResponse> getLikedPlaylists(Long userId) {
        List<PlaylistLike> likes = playlistLikeRepository.findByUserId(userId);
        return likes.stream()
                .map(like -> mapToResponse(like.getPlaylist(), userId))
                .collect(Collectors.toList());
    }

    @Transactional
    public PlaylistResponse createPlaylist(PlaylistRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        Playlist playlist = Playlist.builder()
                .owner(user)
                .title(request.getTitle())
                .description(request.getDescription())
                .coverImageUrl(request.getCoverImageUrl())
                .isPublic(request.getIsPublic() != null ? request.getIsPublic() : true)
                .isDraft(false)
                .viewCount(0L)
                .build();

        Playlist savedPlaylist = playlistRepository.save(playlist);

        // 트랙 추가
        if (request.getTracks() != null) {
            int orderNo = 1;
            for (PlaylistRequest.TrackRequest trackRequest : request.getTracks()) {
                Track track = Track.builder()
                        .title(trackRequest.getTitle())
                        .artist(trackRequest.getArtist())
                        .durationSec(trackRequest.getDurationSec() != null ? trackRequest.getDurationSec() : 0)
                        .albumImage(trackRequest.getAlbumImage())
                        .spotifyId(trackRequest.getSpotifyId())
                        .build();
                Track savedTrack = trackRepository.save(track);

                PlaylistItem item = PlaylistItem.builder()
                        .playlist(savedPlaylist)
                        .track(savedTrack)
                        .orderNo(orderNo++)
                        .build();
                playlistItemRepository.save(item);
            }
        }

        return mapToResponse(savedPlaylist, userId);
    }

    @Transactional
    public boolean toggleLike(Long playlistId, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        Playlist playlist = playlistRepository.findById(playlistId)
                .orElseThrow(() -> new RuntimeException("플레이리스트를 찾을 수 없습니다."));

        Optional<PlaylistLike> existingLike = playlistLikeRepository.findByUserIdAndPlaylistId(userId, playlistId);

        if (existingLike.isPresent()) {
            playlistLikeRepository.delete(existingLike.get());
            return false; // 좋아요 취소
        } else {
            PlaylistLike like = PlaylistLike.builder()
                    .user(user)
                    .playlist(playlist)
                    .createdAt(LocalDateTime.now())
                    .build();
            playlistLikeRepository.save(like);
            return true; // 좋아요 추가
        }
    }

    @Transactional
    public void incrementViewCount(Long playlistId) {
        playlistRepository.findById(playlistId).ifPresent(playlist -> {
            playlist.setViewCount(playlist.getViewCount() + 1);
            playlistRepository.save(playlist);
        });
    }

    private PlaylistResponse mapToResponse(Playlist playlist, Long currentUserId) {
        List<PlaylistItem> items = playlistItemRepository.findByPlaylistIdOrderByOrderNoAsc(playlist.getId());
        long likeCount = playlistLikeRepository.countByPlaylistId(playlist.getId());
        boolean isLiked = currentUserId != null && 
                playlistLikeRepository.findByUserIdAndPlaylistId(currentUserId, playlist.getId()).isPresent();

        List<PlaylistResponse.TrackInfo> tracks = items.stream()
                .map(item -> PlaylistResponse.TrackInfo.builder()
                        .id(item.getTrack().getId())
                        .title(item.getTrack().getTitle())
                        .artist(item.getTrack().getArtist())
                        .duration(formatDuration(item.getTrack().getDurationSec()))
                        .albumImage(item.getTrack().getAlbumImage() != null ? item.getTrack().getAlbumImage() : "")
                        .build())
                .collect(Collectors.toList());

        // 생성일 포맷팅 (상대 시간)
        String createdAtStr = formatRelativeTime(playlist.getCreatedAt());

        // 그래디언트 색상 생성 (플레이리스트 ID 기반)
        String[] gradients = {
            "from-blue-500 to-indigo-600",
            "from-purple-600 to-pink-500",
            "from-orange-500 to-red-600",
            "from-green-500 to-teal-600",
            "from-cyan-500 to-blue-600"
        };
        String gradient = gradients[(int) (playlist.getId() % gradients.length)];

        // 댓글 불러오기
        List<Comment> commentEntities = commentRepository.findByPlaylistIdAndParentIsNullOrderByCreatedAtDesc(playlist.getId());
        List<PlaylistResponse.CommentInfo> comments = commentEntities.stream()
                .filter(c -> "ACTIVE".equals(c.getStatus()))
                .map(c -> PlaylistResponse.CommentInfo.builder()
                        .id(c.getId())
                        .author(c.getAuthor().getNickname())
                        .content(c.getContent())
                        .createdAt(formatRelativeTime(c.getCreatedAt()))
                        .build())
                .collect(Collectors.toList());

        return PlaylistResponse.builder()
                .id(playlist.getId())
                .author(PlaylistResponse.AuthorInfo.builder()
                        .id(playlist.getOwner().getId())
                        .name(playlist.getOwner().getNickname())
                        .avatar("🎵")
                        .build())
                .title(playlist.getTitle())
                .description(playlist.getDescription())
                .coverImageUrl(playlist.getCoverImageUrl())
                .coverGradient(gradient)
                .isPublic(playlist.getIsPublic())
                .viewCount(playlist.getViewCount())
                .likes(likeCount)
                .shares(0L)
                .isLiked(isLiked)
                .tags(new ArrayList<>())
                .tracks(tracks)
                .comments(comments)
                .createdAt(createdAtStr)
                .updatedAt(playlist.getUpdatedAt())
                .build();
    }

    private String formatDuration(Integer seconds) {
        if (seconds == null || seconds == 0) return "0:00";
        int min = seconds / 60;
        int sec = seconds % 60;
        return String.format("%d:%02d", min, sec);
    }

    private String formatRelativeTime(LocalDateTime dateTime) {
        if (dateTime == null) return "";
        
        LocalDateTime now = LocalDateTime.now();
        long minutes = ChronoUnit.MINUTES.between(dateTime, now);
        
        if (minutes < 1) return "방금 전";
        if (minutes < 60) return minutes + "분 전";
        
        long hours = ChronoUnit.HOURS.between(dateTime, now);
        if (hours < 24) return hours + "시간 전";
        
        long days = ChronoUnit.DAYS.between(dateTime, now);
        if (days < 30) return days + "일 전";
        
        long months = days / 30;
        if (months < 12) return months + "개월 전";
        
        return (days / 365) + "년 전";
    }
}
