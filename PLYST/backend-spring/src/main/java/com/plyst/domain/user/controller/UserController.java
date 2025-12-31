package com.plyst.domain.user.controller;

import com.plyst.domain.user.dto.UserStatsResponse;
import com.plyst.domain.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me/stats")
    public ResponseEntity<UserStatsResponse> getMyStats(@RequestHeader("X-User-Id") Long userId) {
        return userService.getUserStats(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{userId}/stats")
    public ResponseEntity<UserStatsResponse> getUserStats(@PathVariable Long userId) {
        return userService.getUserStats(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{userId}/follow")
    public ResponseEntity<Map<String, Boolean>> toggleFollow(
            @PathVariable Long userId,
            @RequestHeader("X-User-Id") Long currentUserId) {
        boolean isFollowing = userService.toggleFollow(currentUserId, userId);
        return ResponseEntity.ok(Map.of("isFollowing", isFollowing));
    }
}
