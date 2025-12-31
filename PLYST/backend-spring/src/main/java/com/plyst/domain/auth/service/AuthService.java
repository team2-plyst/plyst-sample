package com.plyst.domain.auth.service;

import com.plyst.domain.auth.dto.AuthResponse;
import com.plyst.domain.auth.dto.LoginRequest;
import com.plyst.domain.auth.dto.SignupRequest;
import com.plyst.domain.user.entity.User;
import com.plyst.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        // 이메일 중복 체크
        if (userRepository.existsByEmail(request.getEmail())) {
            return AuthResponse.builder()
                    .message("이미 사용 중인 이메일입니다.")
                    .build();
        }

        // 닉네임 중복 체크
        if (userRepository.existsByNickname(request.getNickname())) {
            return AuthResponse.builder()
                    .message("이미 사용 중인 닉네임입니다.")
                    .build();
        }

        // 사용자 생성
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getRealName())
                .nickname(request.getNickname())
                .phone(request.getPhoneNumber())
                .status("ACTIVE")
                .role("USER")
                .build();

        User savedUser = userRepository.save(user);

        // 간단한 토큰 생성 (실제로는 JWT 사용)
        String token = UUID.randomUUID().toString();

        return AuthResponse.builder()
                .userId(savedUser.getId())
                .email(savedUser.getEmail())
                .nickname(savedUser.getNickname())
                .name(savedUser.getName())
                .token(token)
                .message("회원가입이 완료되었습니다.")
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());

        if (userOpt.isEmpty()) {
            return AuthResponse.builder()
                    .message("이메일 또는 비밀번호가 일치하지 않습니다.")
                    .build();
        }

        User user = userOpt.get();

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return AuthResponse.builder()
                    .message("이메일 또는 비밀번호가 일치하지 않습니다.")
                    .build();
        }

        // 간단한 토큰 생성 (실제로는 JWT 사용)
        String token = UUID.randomUUID().toString();

        return AuthResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .name(user.getName())
                .token(token)
                .message("로그인 성공")
                .build();
    }

    public boolean checkEmailDuplicate(String email) {
        return userRepository.existsByEmail(email);
    }

    public boolean checkNicknameDuplicate(String nickname) {
        return userRepository.existsByNickname(nickname);
    }

    @Transactional
    public boolean updateNickname(Long userId, String newNickname) {
        // 닉네임 중복 체크
        if (userRepository.existsByNickname(newNickname)) {
            return false;
        }

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return false;
        }

        User user = userOpt.get();
        user.setNickname(newNickname);
        userRepository.save(user);
        return true;
    }
}
