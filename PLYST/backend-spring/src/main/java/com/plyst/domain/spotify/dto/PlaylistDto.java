package com.plyst.domain.spotify.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlaylistDto {
    private String name;
    private String image;
    private String id;
    private String owner;
}
