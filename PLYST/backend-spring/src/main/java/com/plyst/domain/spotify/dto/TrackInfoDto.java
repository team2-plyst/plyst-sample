package com.plyst.domain.spotify.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrackInfoDto {
    private String title;
    private String artist;
    private String album;
    private String albumImage;
    private Long duration;
}
