package com.plyst.domain.auth.controller;

import com.plyst.domain.auth.dto.AuthResponse;
import com.plyst.domain.auth.dto.LoginRequest;
import com.plyst.domain.auth.dto.SignupRequest;
import com.plyst.domain.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@RequestBody SignupRequest request) {
        AuthResponse response = authService.signup(request);
        if (response.getUserId() == null) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        if (response.getUserId() == null) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/check-email")
    public ResponseEntity<Map<String, Boolean>> checkEmail(@RequestParam String email) {
        boolean exists = authService.checkEmailDuplicate(email);
        return ResponseEntity.ok(Map.of("exists", exists));
    }

    @GetMapping("/check-nickname")
    public ResponseEntity<Map<String, Boolean>> checkNickname(@RequestParam String nickname) {
        boolean exists = authService.checkNicknameDuplicate(nickname);
        return ResponseEntity.ok(Map.of("exists", exists));
    }

    @PutMapping("/profile/nickname")
    public ResponseEntity<Map<String, Object>> updateNickname(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody Map<String, String> request) {
        String newNickname = request.get("nickname");
        boolean success = authService.updateNickname(userId, newNickname);
        if (success) {
            return ResponseEntity.ok(Map.of("success", true, "nickname", newNickname, "message", "닉네임이 변경되었습니다."));
        } else {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "이미 사용 중인 닉네임입니다."));
        }
    }
}
