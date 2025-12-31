package com.plyst.domain.playlist.controller;

import com.plyst.domain.playlist.dto.PlaylistRequest;
import com.plyst.domain.playlist.dto.PlaylistResponse;
import com.plyst.domain.playlist.service.PlaylistService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/playlists")
@RequiredArgsConstructor
public class PlaylistController {

    private final PlaylistService playlistService;

    @GetMapping("/trending")
    public ResponseEntity<List<PlaylistResponse>> getTrendingPlaylists(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "viewCount"));
        List<PlaylistResponse> playlists = playlistService.getTrendingPlaylists(pageable, userId);
        return ResponseEntity.ok(playlists);
    }

    @GetMapping("/search")
    public ResponseEntity<List<PlaylistResponse>> searchPlaylists(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        Pageable pageable = PageRequest.of(page, size);
        List<PlaylistResponse> playlists = playlistService.searchPlaylists(keyword, pageable, userId);
        return ResponseEntity.ok(playlists);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlaylistResponse> getPlaylist(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        return playlistService.getPlaylistById(id, userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PlaylistResponse>> getUserPlaylists(
            @PathVariable Long userId,
            @RequestHeader(value = "X-User-Id", required = false) Long currentUserId) {
        List<PlaylistResponse> playlists = playlistService.getUserPlaylists(userId, currentUserId);
        return ResponseEntity.ok(playlists);
    }

    @GetMapping("/liked")
    public ResponseEntity<List<PlaylistResponse>> getLikedPlaylists(
            @RequestHeader("X-User-Id") Long userId) {
        List<PlaylistResponse> playlists = playlistService.getLikedPlaylists(userId);
        return ResponseEntity.ok(playlists);
    }

    @PostMapping
    public ResponseEntity<PlaylistResponse> createPlaylist(
            @RequestBody PlaylistRequest request,
            @RequestHeader("X-User-Id") Long userId) {
        PlaylistResponse playlist = playlistService.createPlaylist(request, userId);
        return ResponseEntity.ok(playlist);
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<Map<String, Object>> toggleLike(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId) {
        boolean isLiked = playlistService.toggleLike(id, userId);
        return ResponseEntity.ok(Map.of("isLiked", isLiked));
    }

    @PostMapping("/{id}/view")
    public ResponseEntity<Void> incrementView(@PathVariable Long id) {
        playlistService.incrementViewCount(id);
        return ResponseEntity.ok().build();
    }
}
