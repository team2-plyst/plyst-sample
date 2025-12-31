package com.plyst.domain.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserStatsResponse {
    private Long userId;
    private String nickname;
    private long playlistCount;
    private long likedPlaylistCount;
    private long followerCount;
    private long followingCount;
}
