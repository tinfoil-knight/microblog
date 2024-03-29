-- name: InsertUsers :copyfrom
INSERT INTO users(email, username, password_hash, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5);

-- name: InsertPosts :copyfrom
INSERT INTO posts(content, author_id, created_at)
    VALUES ($1, $2, $3);

-- name: InsertLikes :copyfrom
INSERT INTO likes(post_id, user_id, created_at)
    VALUES ($1, $2, $3);

-- name: InsertFollows :copyfrom
INSERT INTO follows(follower_id, following_id, created_at)
    VALUES ($1, $2, $3);

-- name: GetAllUserIDs :many
SELECT
    id
FROM
    users;

-- name: GetAllPostIDs :many
SELECT
    id
FROM
    posts;

-- name: InsertPost :exec
INSERT INTO posts(content, author_id)
    VALUES ($1, $2);

-- name: DeletePost :exec
DELETE FROM posts
WHERE id = $1;

-- name: GetPost :one
SELECT
    p.content,
    p.author_id,
    p.created_at,
(
        SELECT
            username
        FROM
            users u
        WHERE
            u.id = p.author_id) AS username,
(
        SELECT
            count(*)
        FROM
            likes l
        WHERE
            l.post_id = p.id) AS like_count
FROM
    posts p
WHERE
    p.id = $1;

-- name: LikePost :exec
INSERT INTO likes(post_id, user_id)
    VALUES ($1, $2);

-- name: UnlikePost :exec
DELETE FROM likes
WHERE post_id = $1
    AND user_id = $2;

-- name: InsertUser :exec
INSERT INTO users(email, username, password_hash)
    VALUES ($1, $2, $3);

-- name: GetUserForAuth :one
SELECT
    id,
    password_hash
FROM
    users;

-- name: UpdateUserEmail :exec
UPDATE
    users
SET
    email = $2
WHERE
    id = $1;

-- name: GetUserForProfile :one
WITH FOLLOWING AS (
    SELECT
        following_id
    FROM
        follows
    WHERE
        follower_id = $1
)
SELECT
    id,
    username,
    created_at,
(
        SELECT
            count(*)
        FROM
            follows f
        WHERE
            f.following_id = $1) AS following_count,
(
        SELECT
            ARRAY_AGG(username)
        FROM
            users
        WHERE
            id IN (
                SELECT
                    following_id
                FROM
                    FOLLOWING
                LIMIT 3)) AS followers_you_know,
(
        SELECT
            count(*)
        FROM
            users
        WHERE
            id IN (
                SELECT
                    following_id
                FROM
                    FOLLOWING)) AS followers_you_know_count,
(
        SELECT
            count(*)
        FROM
            posts
        WHERE
            author_id = $1) AS post_count
FROM
    users
WHERE
    id = $1;

-- this query returns people you follow
-- name: GetFollowing :many
SELECT
    username
FROM
    users
WHERE
    id IN (
        SELECT
            following_id
        FROM
            follows
        WHERE
            follower_id = $1
        ORDER BY
            created_at DESC);

-- this query returns people who follow you
-- name: GetFollowers :many
SELECT
    username
FROM
    users
WHERE
    id IN (
        SELECT
            follower_id
        FROM
            follows
        WHERE
            following_id = $1
        ORDER BY
            created_at DESC);

-- follower_id "follows" following_id
-- name: FollowUser :exec
INSERT INTO follows(follower_id, following_id)
    VALUES ($1, $2);

-- follower_id "unfollows" following_id
-- name: UnfollowUser :exec
DELETE FROM follows
WHERE follower_id = $1
    AND following_id = $2;

-- name: DeleteUser :exec
DELETE FROM users
WHERE id = $1;

-- todo: fetch only the last l.created_at, l.user_id value
-- name: GetPaginatedLikes :many
SELECT
    u.username,
    l.created_at,
    l.user_id
FROM
    likes l
    LEFT JOIN users u ON u.id = l.user_id
WHERE
    post_id = $1
    AND (l.created_at < $2
        OR $2 IS NULL)
    AND (l.user_id > $3
        OR $3 IS NULL) -- tie-breaker
ORDER BY
    l.created_at DESC,
    user_id
LIMIT 20;

