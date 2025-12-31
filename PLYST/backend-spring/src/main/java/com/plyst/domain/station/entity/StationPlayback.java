package com.plyst.domain.station.entity;

import com.plyst.domain.track.entity.Track;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "station_playbacks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StationPlayback {

    @Id
    @Column(name = "station_id")
    private Long stationId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "station_id")
    private Station station;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "track_id", nullable = false)
    private Track track;

    @Column(name = "position_ms", nullable = false)
    private Long positionMs;

    @Column(name = "is_playing", nullable = false)
    private Boolean isPlaying;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
