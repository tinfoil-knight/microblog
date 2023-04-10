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

