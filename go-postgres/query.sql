-- name: InsertUsers :copyfrom
INSERT INTO users(email, username, password_hash)
    VALUES ($1, $2, $3);

-- name: InsertPosts :copyfrom
INSERT INTO posts(content, author_id)
    VALUES ($1, $2);

-- name: InsertLikes :copyfrom
INSERT INTO likes(post_id, user_id)
    VALUES ($1, $2);

-- name: InsertFollows :copyfrom
INSERT INTO follows(follower_id, following_id)
    VALUES ($1, $2);

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

