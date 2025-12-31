package com.plyst.domain.user.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "profile_taste_tags")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(ProfileTasteTagId.class)
public class ProfileTasteTag {

    @Id
    @Column(length = 50)
    private String tag;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id")
    private Profile profile;
}
