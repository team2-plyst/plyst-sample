package com.plyst.domain.spotify.controller;

import com.plyst.domain.spotify.dto.PlaylistDto;
import com.plyst.domain.spotify.dto.TrackDto;
import com.plyst.domain.spotify.dto.TrackInfoDto;
import com.plyst.domain.spotify.service.SpotifyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/search")
@RequiredArgsConstructor
public class SpotifyController {

    private final SpotifyService spotifyService;

    @GetMapping("/tracks/{id}")
    public ResponseEntity<List<TrackDto>> getPlaylistTracks(@PathVariable String id) {
        List<TrackDto> tracks = spotifyService.getPlaylistTracks(id);
        return ResponseEntity.ok(tracks);
    }

    @GetMapping("/track")
    public ResponseEntity<String> findYoutubeVideo(
            @RequestParam String title,
            @RequestParam String artist) {
        String videoId = spotifyService.findYoutubeVideoId(title, artist);
        return ResponseEntity.ok(videoId);
    }

    @GetMapping("/track/info")
    public ResponseEntity<TrackInfoDto> getTrackInfo(
            @RequestParam String title,
            @RequestParam String artist) {
        TrackInfoDto trackInfo = spotifyService.getTrackInfo(title, artist);
        return ResponseEntity.ok(trackInfo);
    }

    @GetMapping("/tracks/search")
    public ResponseEntity<List<TrackInfoDto>> searchTracks(
            @RequestParam String query,
            @RequestParam(defaultValue = "10") int limit) {
        List<TrackInfoDto> tracks = spotifyService.searchTracks(query, limit);
        return ResponseEntity.ok(tracks);
    }

    @GetMapping("/playlist/{keyword}")
    public ResponseEntity<List<PlaylistDto>> searchPlaylists(
            @PathVariable String keyword,
            @RequestParam(defaultValue = "0") int offset) {
        List<PlaylistDto> playlists = spotifyService.searchPlaylists(keyword, offset);
        return ResponseEntity.ok(playlists);
    }
}
