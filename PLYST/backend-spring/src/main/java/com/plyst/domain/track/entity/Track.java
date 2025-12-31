package com.plyst.domain.track.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tracks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Track {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, length = 255)
    private String artist;

    @Column(name = "duration_sec", nullable = false)
    private Integer durationSec;

    @Column(name = "album_name", length = 255)
    private String albumName;

    @Column(name = "album_image", length = 500)
    private String albumImage;

    @Column(name = "spotify_id", length = 100)
    private String spotifyId;
}