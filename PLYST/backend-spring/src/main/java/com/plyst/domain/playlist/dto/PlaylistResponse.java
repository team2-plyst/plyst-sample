package com.plyst.domain.playlist.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlaylistResponse {
    private Long id;
    private AuthorInfo author;
    private String title;
    private String description;
    private String coverImageUrl;
    private String coverGradient;
    private Boolean isPublic;
    private Long viewCount;
    private Long likes;
    private Long shares;
    private Boolean isLiked;
    private List<String> tags;
    private List<TrackInfo> tracks;
    private List<CommentInfo> comments;
    private String createdAt;
    private LocalDateTime updatedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AuthorInfo {
        private Long id;
        private String name;
        private String avatar;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TrackInfo {
        private Long id;
        private String title;
        private String artist;
        private String duration;
        private String albumImage;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CommentInfo {
        private Long id;
        private String author;
        private String content;
        private String createdAt;
    }
}
