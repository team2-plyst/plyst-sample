package com.plyst.domain.playlist.entity;

import com.plyst.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "playlists")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Playlist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "cover_image_url", length = 2048)
    private String coverImageUrl;

    @Column(name = "is_public", nullable = false)
    private Boolean isPublic;

    @Column(name = "is_draft", nullable = false)
    private Boolean isDraft;

    @Column(name = "external_link", length = 2048)
    private String externalLink;

    @Column(name = "external_provider", length = 30)
    private String externalProvider;

    @Column(name = "view_count", nullable = false)
    private Long viewCount;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
