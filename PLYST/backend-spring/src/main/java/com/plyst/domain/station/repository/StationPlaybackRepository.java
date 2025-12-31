package com.plyst.domain.station.repository;

import com.plyst.domain.station.entity.StationPlayback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StationPlaybackRepository extends JpaRepository<StationPlayback, Long> {
    Optional<StationPlayback> findByStationId(Long stationId);
}
