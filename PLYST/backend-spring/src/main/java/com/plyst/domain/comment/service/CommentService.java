package com.plyst.domain.comment.service;

import com.plyst.domain.comment.dto.CommentRequest;
import com.plyst.domain.comment.dto.CommentResponse;
import com.plyst.domain.comment.entity.Comment;
import com.plyst.domain.comment.repository.CommentRepository;
import com.plyst.domain.playlist.entity.Playlist;
import com.plyst.domain.playlist.repository.PlaylistRepository;
import com.plyst.domain.user.entity.User;
import com.plyst.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final PlaylistRepository playlistRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<CommentResponse> getCommentsByPlaylistId(Long playlistId) {
        List<Comment> comments = commentRepository.findByPlaylistIdAndParentIsNullOrderByCreatedAtDesc(playlistId);
        return comments.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public CommentResponse createComment(Long playlistId, CommentRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        Playlist playlist = playlistRepository.findById(playlistId)
                .orElseThrow(() -> new RuntimeException("플레이리스트를 찾을 수 없습니다."));

        Comment parent = null;
        if (request.getParentId() != null) {
            parent = commentRepository.findById(request.getParentId())
                    .orElseThrow(() -> new RuntimeException("부모 댓글을 찾을 수 없습니다."));
        }

        Comment comment = Comment.builder()
                .playlist(playlist)
                .author(user)
                .parent(parent)
                .content(request.getContent())
                .status("ACTIVE")
                .build();

        Comment savedComment = commentRepository.save(comment);
        return mapToResponse(savedComment);
    }

    @Transactional
    public void deleteComment(Long commentId, Long userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("댓글을 찾을 수 없습니다."));
        
        if (!comment.getAuthor().getId().equals(userId)) {
            throw new RuntimeException("자신의 댓글만 삭제할 수 있습니다.");
        }
        
        comment.setStatus("DELETED");
        commentRepository.save(comment);
    }

    private CommentResponse mapToResponse(Comment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .author(comment.getAuthor().getNickname())
                .content(comment.getContent())
                .createdAt(formatRelativeTime(comment.getCreatedAt()))
                .parentId(comment.getParent() != null ? comment.getParent().getId() : null)
                .build();
    }

    private String formatRelativeTime(LocalDateTime dateTime) {
        LocalDateTime now = LocalDateTime.now();
        long minutes = ChronoUnit.MINUTES.between(dateTime, now);
        
        if (minutes < 1) return "방금 전";
        if (minutes < 60) return minutes + "분 전";
        
        long hours = ChronoUnit.HOURS.between(dateTime, now);
        if (hours < 24) return hours + "시간 전";
        
        long days = ChronoUnit.DAYS.between(dateTime, now);
        if (days < 7) return days + "일 전";
        
        return dateTime.toLocalDate().toString();
    }
}
