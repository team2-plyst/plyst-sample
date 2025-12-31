package com.plyst.domain.spotify.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrackDto {
    private String title;
    private AlbumDto album;
    private String artists;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AlbumDto {
        private String title;
        private String image;
    }
}
