package com.plyst.domain.comment.controller;

import com.plyst.domain.comment.dto.CommentRequest;
import com.plyst.domain.comment.dto.CommentResponse;
import com.plyst.domain.comment.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/playlists/{playlistId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @GetMapping
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable Long playlistId) {
        List<CommentResponse> comments = commentService.getCommentsByPlaylistId(playlistId);
        return ResponseEntity.ok(comments);
    }

    @PostMapping
    public ResponseEntity<CommentResponse> createComment(
            @PathVariable Long playlistId,
            @RequestBody CommentRequest request,
            @RequestHeader("X-User-Id") Long userId) {
        CommentResponse comment = commentService.createComment(playlistId, request, userId);
        return ResponseEntity.ok(comment);
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long playlistId,
            @PathVariable Long commentId,
            @RequestHeader("X-User-Id") Long userId) {
        commentService.deleteComment(commentId, userId);
        return ResponseEntity.ok().build();
    }
}
