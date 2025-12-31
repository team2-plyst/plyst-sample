package com.plyst.domain.user.entity;

import lombok.*;

import java.io.Serializable;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class ProfileTasteTagId implements Serializable {
    private String tag;
    private Long profile;
}
