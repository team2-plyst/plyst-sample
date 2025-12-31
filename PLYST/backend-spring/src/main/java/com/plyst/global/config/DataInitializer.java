package com.plyst.global.config;

import com.plyst.domain.playlist.entity.Playlist;
import com.plyst.domain.playlist.entity.PlaylistItem;
import com.plyst.domain.playlist.entity.PlaylistLike;
import com.plyst.domain.playlist.repository.PlaylistItemRepository;
import com.plyst.domain.playlist.repository.PlaylistLikeRepository;
import com.plyst.domain.playlist.repository.PlaylistRepository;
import com.plyst.domain.track.entity.Track;
import com.plyst.domain.track.repository.TrackRepository;
import com.plyst.domain.user.entity.User;
import com.plyst.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PlaylistRepository playlistRepository;
    private final PlaylistItemRepository playlistItemRepository;
    private final PlaylistLikeRepository playlistLikeRepository;
    private final TrackRepository trackRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        // 이미 데이터가 있으면 초기화하지 않음
        if (userRepository.count() > 0) {
            log.info("데이터가 이미 존재합니다. 초기화를 건너뜁니다.");
            return;
        }

        log.info("초기 데이터 삽입을 시작합니다...");

        // 사용자 생성
        User user1 = createUser("music@plyst.com", "음악러버", "김음악", "1234");
        User user2 = createUser("night@plyst.com", "새벽감성", "이밤", "1234");
        User user3 = createUser("workout@plyst.com", "운동마니아", "박헬스", "1234");
        User testUser = createUser("test@plyst.com", "테스트유저", "테스트", "1234");

        // 플레이리스트 1: 비 오는 날 듣기 좋은 감성 플리
        Playlist playlist1 = createPlaylist(
            user1,
            "비 오는 날 듣기 좋은 감성 플리 🌧️",
            "비가 오는 날, 커피 한 잔과 함께 들으면 좋은 감성적인 곡들을 모았습니다.",
            234L
        );

        List<Track> tracks1 = Arrays.asList(
            createTrack("비가 오는 날엔", "헤이즈", 222, "비가 오는 날엔", 
                "https://i.scdn.co/image/ab67616d0000b2736e8c4e2c6ad61aa0ad44e7e0", "3TzWJklEocdHpXLcfnHq8S"),
            createTrack("비도 오고 그래서", "헤이즈", 255, "/// (Slashs)", 
                "https://i.scdn.co/image/ab67616d0000b273d06d67acf48a02b0b2b6f7d6", "5MYKv5x1g09xvOZF6KjCUl"),
            createTrack("Rain", "태연", 238, "Rain", 
                "https://i.scdn.co/image/ab67616d0000b273e41e2a3e1d0f4b5f7e9e9e9e", "0K6hbswlTJz5XHfLZsZQgs"),
            createTrack("밤편지", "아이유", 270, "Palette", 
                "https://i.scdn.co/image/ab67616d0000b273b658276cd9884ef6fae86261", "3HivPCpSSqGxJcLvxdVYcy"),
            createTrack("우산", "윤하", 205, "UNSTABLE MINDSET", 
                "https://i.scdn.co/image/ab67616d0000b273a8a30e6e8b8f8a8a8a8a8a8a", "6FDsGFgMWvR7KvCa8Dv0nV")
        );
        addTracksToPlaylist(playlist1, tracks1);

        // 플레이리스트 2: 새벽에 혼자 듣는 플레이리스트
        Playlist playlist2 = createPlaylist(
            user2,
            "새벽에 혼자 듣는 플레이리스트 ✨",
            "잠이 안 올 때, 혼자만의 시간을 보내고 싶을 때 추천하는 곡들입니다.",
            567L
        );

        List<Track> tracks2 = Arrays.asList(
            createTrack("밤양갱", "비비", 192, "밤양갱", 
                "https://i.scdn.co/image/ab67616d0000b273ada1c7e6f8b9a85cb9af0c61", "4fGtLTI3k8Q2X0sNrVhbHB"),
            createTrack("Love wins all", "아이유", 225, "Love wins all", 
                "https://i.scdn.co/image/ab67616d0000b2738e9d0a8d7e4e8e3d7e9d0a8d", "4A8FmKRfqP0kV3CKjQkPP7"),
            createTrack("Super Shy", "NewJeans", 178, "NewJeans 'Super Shy'", 
                "https://i.scdn.co/image/ab67616d0000b2730744690248ef3ba7b776ea7b", "5sdQOyqq2IDhvmx2lHOpwd"),
            createTrack("Ditto", "NewJeans", 190, "Ditto", 
                "https://i.scdn.co/image/ab67616d0000b2733d98a0ae7c78a3a9babaf8af", "3r8RuvgbX9s7ammBn07D3W")
        );
        addTracksToPlaylist(playlist2, tracks2);

        // 플레이리스트 3: 운동할 때 텐션 올려주는 플리
        Playlist playlist3 = createPlaylist(
            user3,
            "운동할 때 텐션 올려주는 플리 🔥",
            "헬스장에서 운동할 때 듣기 좋은 신나는 곡들 모음!",
            891L
        );

        List<Track> tracks3 = Arrays.asList(
            createTrack("FLOWER", "JISOO", 185, "ME", 
                "https://i.scdn.co/image/ab67616d0000b273f35e9c3a0f96e7f8db7f8c5e", "69CrOS7vEHIrhC2ILyEi0s"),
            createTrack("Dynamite", "BTS", 199, "Dynamite (DayTime Version)", 
                "https://i.scdn.co/image/ab67616d0000b2732f4e50a0e9b5c6c8a8a8a8a8", "5QDLhrAOJJdNAmCTJ8xMyW"),
            createTrack("How You Like That", "BLACKPINK", 182, "How You Like That", 
                "https://i.scdn.co/image/ab67616d0000b2733d3e6c8d9a8e8b8a8b8a8b8a", "4S3cIosPXsY1Z4sQW7GmYy"),
            createTrack("ANTIFRAGILE", "LE SSERAFIM", 176, "ANTIFRAGILE", 
                "https://i.scdn.co/image/ab67616d0000b2736a48a88a3c8d8b8a8b8a8b8a", "4fsQ0K37TOXa3hEQfjEICP"),
            createTrack("Hype Boy", "NewJeans", 178, "NewJeans 1st EP 'New Jeans'", 
                "https://i.scdn.co/image/ab67616d0000b2730d8e88d0f0a0d0e0f0a0d0e0", "0a4MMyCrzT0En247IhqZbD"),
            createTrack("Get A Guitar", "RIIZE", 162, "Get A Guitar", 
                "https://i.scdn.co/image/ab67616d0000b2731e1e8b8a8b8a8b8a8b8a8b8a", "5T5anwfplpvmZGVMQNbEoI")
        );
        addTracksToPlaylist(playlist3, tracks3);

        // 좋아요 추가
        createPlaylistLike(testUser, playlist2);
        createPlaylistLike(user1, playlist2);
        createPlaylistLike(user3, playlist2);

        log.info("초기 데이터 삽입이 완료되었습니다.");
        log.info("- 사용자 {}명 생성", userRepository.count());
        log.info("- 플레이리스트 {}개 생성", playlistRepository.count());
        log.info("- 트랙 {}개 생성", trackRepository.count());
    }

    private User createUser(String email, String nickname, String name, String password) {
        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(password))
                .nickname(nickname)
                .name(name)
                .phone("010-0000-0000")
                .status("ACTIVE")
                .role("USER")
                .build();
        return userRepository.save(user);
    }

    private Playlist createPlaylist(User owner, String title, String description, Long viewCount) {
        Playlist playlist = Playlist.builder()
                .owner(owner)
                .title(title)
                .description(description)
                .isPublic(true)
                .isDraft(false)
                .viewCount(viewCount)
                .build();
        return playlistRepository.save(playlist);
    }

    private Track createTrack(String title, String artist, int durationSec, String albumName, String albumImage, String spotifyId) {
        Track track = Track.builder()
                .title(title)
                .artist(artist)
                .durationSec(durationSec)
                .albumName(albumName)
                .albumImage(albumImage)
                .spotifyId(spotifyId)
                .build();
        return trackRepository.save(track);
    }

    private void addTracksToPlaylist(Playlist playlist, List<Track> tracks) {
        int order = 1;
        for (Track track : tracks) {
            PlaylistItem item = PlaylistItem.builder()
                    .playlist(playlist)
                    .track(track)
                    .orderNo(order++)
                    .build();
            playlistItemRepository.save(item);
        }
    }

    private void createPlaylistLike(User user, Playlist playlist) {
        PlaylistLike like = PlaylistLike.builder()
                .user(user)
                .playlist(playlist)
                .createdAt(LocalDateTime.now())
                .build();
        playlistLikeRepository.save(like);
    }
}
