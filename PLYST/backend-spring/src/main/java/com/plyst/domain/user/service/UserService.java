package com.plyst.domain.user.service;

import com.plyst.domain.playlist.repository.PlaylistLikeRepository;
import com.plyst.domain.playlist.repository.PlaylistRepository;
import com.plyst.domain.user.dto.UserStatsResponse;
import com.plyst.domain.user.entity.User;
import com.plyst.domain.user.repository.FollowRepository;
import com.plyst.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PlaylistRepository playlistRepository;
    private final PlaylistLikeRepository playlistLikeRepository;
    private final FollowRepository followRepository;

    @Transactional(readOnly = true)
    public Optional<UserStatsResponse> getUserStats(Long userId) {
        return userRepository.findById(userId).map(user -> {
            long playlistCount = playlistRepository.countByOwnerId(userId);
            long likedPlaylistCount = playlistLikeRepository.countByUserId(userId);
            long followerCount = followRepository.countByFollowingId(userId);
            long followingCount = followRepository.countByFollowerId(userId);

            return UserStatsResponse.builder()
                    .userId(userId)
                    .nickname(user.getNickname())
                    .playlistCount(playlistCount)
                    .likedPlaylistCount(likedPlaylistCount)
                    .followerCount(followerCount)
                    .followingCount(followingCount)
                    .build();
        });
    }

    @Transactional
    public boolean toggleFollow(Long followerId, Long followingId) {
        if (followerId.equals(followingId)) {
            throw new RuntimeException("자기 자신을 팔로우할 수 없습니다.");
        }

        User follower = userRepository.findById(followerId)
                .orElseThrow(() -> new RuntimeException("팔로워를 찾을 수 없습니다."));
        User following = userRepository.findById(followingId)
                .orElseThrow(() -> new RuntimeException("팔로잉 대상을 찾을 수 없습니다."));

        return followRepository.findByFollowerIdAndFollowingId(followerId, followingId)
                .map(follow -> {
                    followRepository.delete(follow);
                    return false; // 언팔로우
                })
                .orElseGet(() -> {
                    com.plyst.domain.user.entity.Follow follow = com.plyst.domain.user.entity.Follow.builder()
                            .follower(follower)
                            .following(following)
                            .build();
                    followRepository.save(follow);
                    return true; // 팔로우
                });
    }
}
