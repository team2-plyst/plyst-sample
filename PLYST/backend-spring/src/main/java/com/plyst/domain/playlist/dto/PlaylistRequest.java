package com.plyst.domain.playlist.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlaylistRequest {
    private String title;
    private String description;
    private String coverImageUrl;
    private Boolean isPublic;
    private List<String> tags;
    private List<TrackRequest> tracks;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TrackRequest {
        private String title;
        private String artist;
        private Integer durationSec;
        private String albumImage;
        private String spotifyId;
    }
}
