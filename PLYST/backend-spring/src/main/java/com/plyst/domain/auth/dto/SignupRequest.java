package com.plyst.domain.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SignupRequest {
    private String nickname;
    private String userId;
    private String email;
    private String password;
    private String realName;
    private String phoneNumber;
    private String gender;
}
