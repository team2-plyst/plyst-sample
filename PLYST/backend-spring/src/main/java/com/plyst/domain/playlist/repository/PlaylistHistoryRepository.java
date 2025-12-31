package com.plyst.domain.playlist.repository;

import com.plyst.domain.playlist.entity.PlaylistHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlaylistHistoryRepository extends JpaRepository<PlaylistHistory, Long> {
    List<PlaylistHistory> findByUserIdOrderByPlayedAtDesc(Long userId);
}
