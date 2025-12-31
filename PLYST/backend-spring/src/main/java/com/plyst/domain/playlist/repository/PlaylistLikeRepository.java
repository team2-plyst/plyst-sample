package com.plyst.domain.playlist.repository;

import com.plyst.domain.playlist.entity.PlaylistLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlaylistLikeRepository extends JpaRepository<PlaylistLike, Long> {
    Optional<PlaylistLike> findByUserIdAndPlaylistId(Long userId, Long playlistId);
    List<PlaylistLike> findByUserId(Long userId);
    long countByPlaylistId(Long playlistId);
    long countByUserId(Long userId);
    boolean existsByUserIdAndPlaylistId(Long userId, Long playlistId);
}
