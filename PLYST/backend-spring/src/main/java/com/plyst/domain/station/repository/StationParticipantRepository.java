package com.plyst.domain.station.repository;

import com.plyst.domain.station.entity.StationParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StationParticipantRepository extends JpaRepository<StationParticipant, Long> {
    List<StationParticipant> findByStationId(Long stationId);
    Optional<StationParticipant> findByStationIdAndUserId(Long stationId, Long userId);
    long countByStationId(Long stationId);
}
