package com.plyst.domain.playlist.repository;

import com.plyst.domain.playlist.entity.Playlist;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlaylistRepository extends JpaRepository<Playlist, Long> {
    List<Playlist> findByOwnerId(Long ownerId);
    Page<Playlist> findByIsPublicTrueAndIsDraftFalse(Pageable pageable);
    Page<Playlist> findByTitleContainingAndIsPublicTrueAndIsDraftFalse(String title, Pageable pageable);
    long countByOwnerId(Long ownerId);
}
