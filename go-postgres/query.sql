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

