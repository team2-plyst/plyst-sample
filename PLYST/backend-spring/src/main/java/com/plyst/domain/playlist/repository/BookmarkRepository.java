package com.plyst.domain.playlist.repository;

import com.plyst.domain.playlist.entity.Bookmark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookmarkRepository extends JpaRepository<Bookmark, Long> {
    List<Bookmark> findByUserId(Long userId);
    Optional<Bookmark> findByUserIdAndPlaylistId(Long userId, Long playlistId);
    boolean existsByUserIdAndPlaylistId(Long userId, Long playlistId);
}
