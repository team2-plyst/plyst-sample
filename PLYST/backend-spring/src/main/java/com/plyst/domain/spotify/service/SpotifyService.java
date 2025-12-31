package com.plyst.domain.spotify.service;

import com.plyst.domain.spotify.dto.PlaylistDto;
import com.plyst.domain.spotify.dto.SpotifyTokenResponse;
import com.plyst.domain.spotify.dto.TrackDto;
import com.plyst.domain.spotify.dto.TrackInfoDto;
import com.plyst.global.config.SpotifyConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class SpotifyService {

    private final SpotifyConfig spotifyConfig;
    private final RestTemplate restTemplate;

    private static final String SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
    private static final String SPOTIFY_API_URL = "https://api.spotify.com/v1/";

    public String getSpotifyToken() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        
        String credentials = spotifyConfig.getClientId() + ":" + spotifyConfig.getClientSecret();
        String encodedCredentials = Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
        headers.set("Authorization", "Basic " + encodedCredentials);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "client_credentials");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
        
        ResponseEntity<SpotifyTokenResponse> response = restTemplate.exchange(
                SPOTIFY_TOKEN_URL,
                HttpMethod.POST,
                request,
                SpotifyTokenResponse.class
        );

        return Objects.requireNonNull(response.getBody()).getAccessToken();
    }

    public String findYoutubeVideoId(String title, String artist) {
        try {
            // 특수문자 제거하고 검색어 구성 - 공식 MV나 Audio 검색
            String cleanTitle = title.replaceAll("[\\[\\](){}'\",]", "").trim();
            String cleanArtist = artist.replaceAll("[\\[\\](){}'\",]", "").trim();
            String searchQuery = cleanArtist + " " + cleanTitle + " Official MV";
            String youtubeUrl = "https://www.youtube.com/results?search_query=" + 
                java.net.URLEncoder.encode(searchQuery, StandardCharsets.UTF_8);
            
            // User-Agent 헤더 추가 (YouTube가 봇 요청을 차단하지 않도록)
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            headers.set("Accept-Language", "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7");
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            
            ResponseEntity<String> response = restTemplate.exchange(youtubeUrl, HttpMethod.GET, entity, String.class);
            String html = response.getBody();
            
            if (html != null) {
                // Express.js와 동일한 파싱 방식
                String[] parts = html.split("\\{\"videoRenderer\":\\{\"videoId\":\"");
                if (parts.length > 1) {
                    return parts[1].split("\"")[0];
                }
            }
        } catch (Exception e) {
            log.error("YouTube 검색 오류: {}", e.getMessage());
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    public List<TrackDto> getPlaylistTracks(String playlistId) {
        String token = getSpotifyToken();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(Objects.requireNonNull(token));
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        // 첫 요청으로 총 트랙 수 확인
        String url = SPOTIFY_API_URL + "playlists/" + playlistId + "/tracks?limit=100";
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(url, HttpMethod.GET, entity, (Class<Map<String, Object>>)(Class<?>)Map.class);
        Map<String, Object> data = response.getBody();
        
        if (data == null) {
            return new ArrayList<>();
        }
        
        int total = (int) data.get("total");
        List<TrackDto> totalSongs = new ArrayList<>();

        for (int i = 0; i < Math.ceil((double) total / 100); i++) {
            String offsetUrl = SPOTIFY_API_URL + "playlists/" + playlistId + "/tracks?offset=" + (i * 100);
            ResponseEntity<Map<String, Object>> offsetResponse = restTemplate.exchange(offsetUrl, HttpMethod.GET, entity, (Class<Map<String, Object>>)(Class<?>)Map.class);
            Map<String, Object> offsetData = offsetResponse.getBody();
            
            if (offsetData == null) {
                continue;
            }
            
            List<Map<String, Object>> items = (List<Map<String, Object>>) offsetData.get("items");
            
            for (Map<String, Object> item : items) {
                Map<String, Object> track = (Map<String, Object>) item.get("track");
                if (track != null) {
                    Map<String, Object> album = (Map<String, Object>) track.get("album");
                    List<Map<String, Object>> images = (List<Map<String, Object>>) album.get("images");
                    List<Map<String, Object>> artists = (List<Map<String, Object>>) track.get("artists");
                    
                    if (images != null && !images.isEmpty()) {
                        TrackDto trackDto = TrackDto.builder()
                                .title((String) track.get("name"))
                                .album(TrackDto.AlbumDto.builder()
                                        .title((String) album.get("name"))
                                        .image((String) images.get(0).get("url"))
                                        .build())
                                .artists((String) artists.get(0).get("name"))
                                .build();
                        totalSongs.add(trackDto);
                    }
                }
            }
        }

        return totalSongs;
    }

    @SuppressWarnings("unchecked")
    public TrackInfoDto getTrackInfo(String title, String artist) {
        try {
            String token = getSpotifyToken();
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(Objects.requireNonNull(token));
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            String searchQuery = (title + " " + artist).replaceAll("\\s+", " ").trim();
            String url = SPOTIFY_API_URL + "search?q=" + 
                    java.net.URLEncoder.encode(searchQuery, StandardCharsets.UTF_8) + 
                    "&type=track&limit=1";

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(url, HttpMethod.GET, entity, (Class<Map<String, Object>>)(Class<?>)Map.class);
            Map<String, Object> data = response.getBody();
            
            if (data == null) {
                return TrackInfoDto.builder().albumImage("").build();
            }
            
            Map<String, Object> tracks = (Map<String, Object>) data.get("tracks");
            List<Map<String, Object>> items = (List<Map<String, Object>>) tracks.get("items");
            
            if (items != null && !items.isEmpty()) {
                Map<String, Object> track = items.get(0);
                Map<String, Object> album = (Map<String, Object>) track.get("album");
                List<Map<String, Object>> images = (List<Map<String, Object>>) album.get("images");
                List<Map<String, Object>> artists = (List<Map<String, Object>>) track.get("artists");

                return TrackInfoDto.builder()
                        .title((String) track.get("name"))
                        .artist((String) artists.get(0).get("name"))
                        .album((String) album.get("name"))
                        .albumImage(images != null && !images.isEmpty() ? (String) images.get(0).get("url") : "")
                        .duration(((Number) track.get("duration_ms")).longValue())
                        .build();
            }
        } catch (Exception e) {
            log.error("트랙 정보 검색 오류: {}", e.getMessage());
        }
        return TrackInfoDto.builder().albumImage("").build();
    }

    @SuppressWarnings("unchecked")
    public List<TrackInfoDto> searchTracks(String query, int limit) {
        List<TrackInfoDto> results = new ArrayList<>();
        try {
            String token = getSpotifyToken();
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(Objects.requireNonNull(token));
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            String searchQuery = query.replaceAll("\\s+", " ").trim();
            String url = SPOTIFY_API_URL + "search?q=" + 
                    java.net.URLEncoder.encode(searchQuery, StandardCharsets.UTF_8) + 
                    "&type=track&limit=" + limit;

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(url, HttpMethod.GET, entity, (Class<Map<String, Object>>)(Class<?>)Map.class);
            Map<String, Object> data = response.getBody();
            
            if (data == null) {
                return results;
            }
            
            Map<String, Object> tracks = (Map<String, Object>) data.get("tracks");
            List<Map<String, Object>> items = (List<Map<String, Object>>) tracks.get("items");
            
            if (items != null) {
                for (Map<String, Object> item : items) {
                    Map<String, Object> album = (Map<String, Object>) item.get("album");
                    List<Map<String, Object>> images = (List<Map<String, Object>>) album.get("images");
                    List<Map<String, Object>> artists = (List<Map<String, Object>>) item.get("artists");

                    TrackInfoDto trackInfo = TrackInfoDto.builder()
                            .title((String) item.get("name"))
                            .artist((String) artists.get(0).get("name"))
                            .album((String) album.get("name"))
                            .albumImage(images != null && !images.isEmpty() ? (String) images.get(0).get("url") : "")
                            .duration(((Number) item.get("duration_ms")).longValue())
                            .build();
                    results.add(trackInfo);
                }
            }
        } catch (Exception e) {
            log.error("트랙 검색 오류: {}", e.getMessage());
        }
        return results;
    }

    @SuppressWarnings("unchecked")
    public List<PlaylistDto> searchPlaylists(String keyword, int offset) {
        String token = getSpotifyToken();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(Objects.requireNonNull(token));
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        String url = SPOTIFY_API_URL + "search?q=" + 
                java.net.URLEncoder.encode(keyword, StandardCharsets.UTF_8) + 
                "&type=playlist&limit=50&offset=" + (offset * 50);

        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(url, HttpMethod.GET, entity, (Class<Map<String, Object>>)(Class<?>)Map.class);
        Map<String, Object> data = response.getBody();
        
        if (data == null) {
            return new ArrayList<>();
        }
        
        Map<String, Object> playlists = (Map<String, Object>) data.get("playlists");
        List<Map<String, Object>> items = (List<Map<String, Object>>) playlists.get("items");
        
        List<PlaylistDto> result = new ArrayList<>();
        for (Map<String, Object> item : items) {
            if (item != null) {
                List<Map<String, Object>> images = (List<Map<String, Object>>) item.get("images");
                Map<String, Object> owner = (Map<String, Object>) item.get("owner");
                
                PlaylistDto playlistDto = PlaylistDto.builder()
                        .name((String) item.get("name"))
                        .image(images != null && !images.isEmpty() ? (String) images.get(0).get("url") : "")
                        .id((String) item.get("id"))
                        .owner((String) owner.get("display_name"))
                        .build();
                result.add(playlistDto);
            }
        }

        return result;
    }
}
