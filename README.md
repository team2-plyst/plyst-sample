# plyst

root password: 123456   
   
DB connector name: plyst-test   
password: 1234   
name: plyst   

<br><br>

# root 계정에서 plyst 생성

`create user plyst@'%' identified by '1234';`   
`grant all privileges on *.* to plyst@'%';`   
`flush privileges;`   
   
<br><br>

```sql
CREATE TABLE `users` (
    `id`          INT       NOT NULL AUTO_INCREMENT,
    `email`       VARCHAR(255) NOT NULL,
    `password`    VARCHAR(255) NULL,
    `name`        VARCHAR(100) NOT NULL,
    `nickname`    VARCHAR(50)  NOT NULL,
    `phone`       VARCHAR(30)  NULL,
    `status`      VARCHAR(30)  NOT NULL,
    `role`        VARCHAR(30)  NOT NULL,
    `created_at`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `UK_users_email` (`email`),
    UNIQUE KEY `UK_users_nickname` (`nickname`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `profiles` (
    `id`        INT        NOT NULL AUTO_INCREMENT,
    `user_id`   INT        NOT NULL,
    `image_url` VARCHAR(2048) NULL,
    `intro`     TEXT          NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `UK_profiles_user_id` (`user_id`),
    CONSTRAINT `FK_users_TO_profiles` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `oauth_accounts` (
    `id`              INT       NOT NULL AUTO_INCREMENT,
    `user_id`         INT       NOT NULL,
    `provider`        VARCHAR(30)  NOT NULL,
    `provider_user_id` VARCHAR(255) NOT NULL,
    `linked_at`       DATETIME(3)  NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `UK_oauth_accounts_provider_user` (`provider`, `provider_user_id`),
    CONSTRAINT `FK_users_TO_oauth_accounts` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `follows` (
    `id`           INT       NOT NULL AUTO_INCREMENT,
    `follower_id`  INT       NOT NULL,
    `following_id` INT       NOT NULL,
    `created_at`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `UK_follows_follower_following` (`follower_id`, `following_id`),
    CONSTRAINT `FK_users_TO_follows_follower` FOREIGN KEY (`follower_id`) REFERENCES `users` (`id`),
    CONSTRAINT `FK_users_TO_follows_following` FOREIGN KEY (`following_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `blocks` (
    `id`         INT       NOT NULL AUTO_INCREMENT,
    `blocker_id` INT       NOT NULL,
    `blocked_id` INT       NOT NULL,
    `reason`     VARCHAR(255) NULL,
    `created_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `UK_blocks_blocker_blocked` (`blocker_id`, `blocked_id`),
    CONSTRAINT `FK_users_TO_blocks_blocker` FOREIGN KEY (`blocker_id`) REFERENCES `users` (`id`),
    CONSTRAINT `FK_users_TO_blocks_blocked` FOREIGN KEY (`blocked_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 인증 관련 테이블
CREATE TABLE `refresh_tokens` (
    `id`         INT       NOT NULL AUTO_INCREMENT,
    `user_id`    INT       NOT NULL,
    `token`      VARCHAR(512) NOT NULL,
    `expires_at` DATETIME(3)  NOT NULL,
    `revoked_at` DATETIME(3)  NULL,
    PRIMARY KEY (`id`),
    INDEX `IDX_refresh_tokens_token` (`token`),
    CONSTRAINT `FK_users_TO_refresh_tokens` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `email_verifications` (
    `id`         INT      NOT NULL AUTO_INCREMENT,
    `email`      VARCHAR(255) NOT NULL,
    `code`       VARCHAR(30)  NOT NULL,
    `expires_at` DATETIME(3)  NOT NULL,
    `verified_at` DATETIME(3) NULL,
    PRIMARY KEY (`id`),
    INDEX `IDX_email_verifications_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 트랙 관련 테이블
CREATE TABLE `tracks` (
    `id`             INT       NOT NULL AUTO_INCREMENT,
    `title`          VARCHAR(255) NOT NULL,
    `artist`         VARCHAR(255) NOT NULL,
    `duration_sec`   INT          NOT NULL,
    `album_name`     VARCHAR(255) NULL,
    `album_image`    VARCHAR(500) NULL,
    `spotify_id`     VARCHAR(100) NULL,
    PRIMARY KEY (`id`),
    INDEX `IDX_tracks_title_artist` (`title`, `artist`),
    INDEX `IDX_tracks_spotify_id` (`spotify_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 플레이리스트 관련 테이블
CREATE TABLE `playlists` (
    `id`               INT        NOT NULL AUTO_INCREMENT,
    `owner_id`         INT        NOT NULL,
    `title`            VARCHAR(255)  NOT NULL,
    `description`      TEXT          NULL,
    `cover_image_url`  VARCHAR(2048) NULL,
    `is_public`        TINYINT(1)    NOT NULL,
    `is_draft`         TINYINT(1)    NOT NULL,
    `external_link`    VARCHAR(2048) NULL,
    `external_provider` VARCHAR(30)  NULL,
    `view_count`       INT        NOT NULL DEFAULT 0,
    `created_at`       DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`       DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `IDX_playlists_owner_id` (`owner_id`),
    CONSTRAINT `FK_users_TO_playlists` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `playlist_items` (
    `id`          INT NOT NULL AUTO_INCREMENT,
    `playlist_id` INT NOT NULL,
    `track_id`    INT NOT NULL,
    `order_no`    INT    NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IDX_playlist_items_playlist_id` (`playlist_id`),
    CONSTRAINT `FK_playlists_TO_playlist_items` FOREIGN KEY (`playlist_id`) REFERENCES `playlists` (`id`),
    CONSTRAINT `FK_tracks_TO_playlist_items` FOREIGN KEY (`track_id`) REFERENCES `tracks` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `playlist_likes` (
    `id`          INT      NOT NULL AUTO_INCREMENT,
    `user_id`     INT      NOT NULL,
    `playlist_id` INT      NOT NULL,
    `created_at`  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `UK_playlist_likes_user_playlist` (`user_id`, `playlist_id`),
    CONSTRAINT `FK_users_TO_playlist_likes` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
    CONSTRAINT `FK_playlists_TO_playlist_likes` FOREIGN KEY (`playlist_id`) REFERENCES `playlists` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `bookmarks` (
    `id`          INT       NOT NULL AUTO_INCREMENT,
    `user_id`     INT       NOT NULL,
    `playlist_id` INT       NOT NULL,
    `created_at`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `UK_bookmarks_user_playlist` (`user_id`, `playlist_id`),
    CONSTRAINT `FK_users_TO_bookmarks` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
    CONSTRAINT `FK_playlists_TO_bookmarks` FOREIGN KEY (`playlist_id`) REFERENCES `playlists` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 태그 관련 테이블
CREATE TABLE `tags` (
    `id`   INT      NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `UK_tags_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `playlist_tags` (
    `id`          INT NOT NULL AUTO_INCREMENT,
    `playlist_id` INT NOT NULL,
    `tag_id`      INT NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `UK_playlist_tags_playlist_tag` (`playlist_id`, `tag_id`),
    CONSTRAINT `FK_playlists_TO_playlist_tags` FOREIGN KEY (`playlist_id`) REFERENCES `playlists` (`id`),
    CONSTRAINT `FK_tags_TO_playlist_tags` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `profile_taste_tags` (
    `tag`        VARCHAR(50) NOT NULL,
    `profile_id` INT      NOT NULL,
    PRIMARY KEY (`tag`, `profile_id`),
    CONSTRAINT `FK_profiles_TO_profile_taste_tags` FOREIGN KEY (`profile_id`) REFERENCES `profiles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 단축 URL 테이블
CREATE TABLE `short_urls` (
    `id`          INT       NOT NULL AUTO_INCREMENT,
    `playlist_id` INT       NOT NULL,
    `code`        VARCHAR(32)  NOT NULL,
    `created_at`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expires_at`  DATETIME(3)  NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `UK_short_urls_code` (`code`),
    CONSTRAINT `FK_playlists_TO_short_urls` FOREIGN KEY (`playlist_id`) REFERENCES `playlists` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 댓글 관련 테이블
CREATE TABLE `comments` (
    `id`         INT       NOT NULL AUTO_INCREMENT,
    `playlist_id` INT      NOT NULL,
    `author_id`  INT       NOT NULL,
    `parent_id`  INT       NULL,
    `content`    TEXT         NOT NULL,
    `status`     VARCHAR(30)  NOT NULL,
    `created_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `IDX_comments_playlist_id` (`playlist_id`),
    CONSTRAINT `FK_playlists_TO_comments` FOREIGN KEY (`playlist_id`) REFERENCES `playlists` (`id`),
    CONSTRAINT `FK_users_TO_comments` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`),
    CONSTRAINT `FK_comments_TO_comments` FOREIGN KEY (`parent_id`) REFERENCES `comments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `comment_likes` (
    `id`         INT      NOT NULL AUTO_INCREMENT,
    `user_id`    INT      NOT NULL,
    `comment_id` INT      NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `UK_comment_likes_user_comment` (`user_id`, `comment_id`),
    CONSTRAINT `FK_users_TO_comment_likes` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
    CONSTRAINT `FK_comments_TO_comment_likes` FOREIGN KEY (`comment_id`) REFERENCES `comments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 신고 관련 테이블
CREATE TABLE `user_reports` (
    `id`               INT       NOT NULL AUTO_INCREMENT,
    `reporter_id`      INT       NOT NULL,
    `reported_user_id` INT       NOT NULL,
    `type`             VARCHAR(30)  NOT NULL,
    `reason`           VARCHAR(255) NULL,
    `created_at`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    CONSTRAINT `FK_users_TO_user_reports_reporter` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`),
    CONSTRAINT `FK_users_TO_user_reports_reported` FOREIGN KEY (`reported_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `comment_reports` (
    `id`          INT       NOT NULL AUTO_INCREMENT,
    `reporter_id` INT       NOT NULL,
    `comment_id`  INT       NOT NULL,
    `type`        VARCHAR(30)  NOT NULL,
    `reason`      VARCHAR(255) NULL,
    `created_at`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    CONSTRAINT `FK_users_TO_comment_reports` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`),
    CONSTRAINT `FK_comments_TO_comment_reports` FOREIGN KEY (`comment_id`) REFERENCES `comments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `playlist_reports` (
    `id`          INT       NOT NULL AUTO_INCREMENT,
    `reporter_id` INT       NOT NULL,
    `playlist_id` INT       NOT NULL,
    `type`        VARCHAR(30)  NOT NULL,
    `reason`      VARCHAR(255) NULL,
    `created_at`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    CONSTRAINT `FK_users_TO_playlist_reports` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`),
    CONSTRAINT `FK_playlists_TO_playlist_reports` FOREIGN KEY (`playlist_id`) REFERENCES `playlists` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 스테이션 관련 테이블 (함께 듣기 기능)
CREATE TABLE `stations` (
    `id`              INT      NOT NULL AUTO_INCREMENT,
    `title`           VARCHAR(255) NOT NULL,
    `invite_code`     VARCHAR(20)  NOT NULL,
    `max_participants` INT         NOT NULL,
    `status`          VARCHAR(30)  NOT NULL,
    `created_at`      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `UK_stations_invite_code` (`invite_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `station_participants` (
    `id`            INT      NOT NULL AUTO_INCREMENT,
    `station_id`    INT      NOT NULL,
    `user_id`       INT      NOT NULL,
    `role`          VARCHAR(30) NOT NULL,
    `joined_at`     DATETIME(3) NOT NULL,
    `last_active_at` DATETIME(3) NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `UK_station_participants_station_user` (`station_id`, `user_id`),
    CONSTRAINT `FK_stations_TO_station_participants` FOREIGN KEY (`station_id`) REFERENCES `stations` (`id`),
    CONSTRAINT `FK_users_TO_station_participants` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `station_playbacks` (
    `station_id`      INT       NOT NULL,
    `track_id`        INT       NOT NULL,
    `position_ms`     INT       NOT NULL,
    `is_playing`      TINYINT(1)   NOT NULL,
    `updated_at`      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`station_id`),
    CONSTRAINT `FK_stations_TO_station_playbacks` FOREIGN KEY (`station_id`) REFERENCES `stations` (`id`),
    CONSTRAINT `FK_tracks_TO_station_playbacks` FOREIGN KEY (`track_id`) REFERENCES `tracks` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```