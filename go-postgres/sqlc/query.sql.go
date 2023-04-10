// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.17.2
// source: query.sql

package sqlc

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

const deletePost = `-- name: DeletePost :exec
DELETE FROM posts
WHERE id = $1
`

func (q *Queries) DeletePost(ctx context.Context, id int32) error {
	_, err := q.db.Exec(ctx, deletePost, id)
	return err
}

const getAllPostIDs = `-- name: GetAllPostIDs :many
SELECT
    id
FROM
    posts
`

func (q *Queries) GetAllPostIDs(ctx context.Context) ([]int32, error) {
	rows, err := q.db.Query(ctx, getAllPostIDs)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []int32
	for rows.Next() {
		var id int32
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		items = append(items, id)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const getAllUserIDs = `-- name: GetAllUserIDs :many
SELECT
    id
FROM
    users
`

func (q *Queries) GetAllUserIDs(ctx context.Context) ([]int32, error) {
	rows, err := q.db.Query(ctx, getAllUserIDs)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []int32
	for rows.Next() {
		var id int32
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		items = append(items, id)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const getPost = `-- name: GetPost :one
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
    p.id = $1
`

type GetPostRow struct {
	Content   string             `json:"content"`
	AuthorID  int32              `json:"author_id"`
	CreatedAt pgtype.Timestamptz `json:"created_at"`
	Username  string             `json:"username"`
	LikeCount int64              `json:"like_count"`
}

func (q *Queries) GetPost(ctx context.Context, id int32) (GetPostRow, error) {
	row := q.db.QueryRow(ctx, getPost, id)
	var i GetPostRow
	err := row.Scan(
		&i.Content,
		&i.AuthorID,
		&i.CreatedAt,
		&i.Username,
		&i.LikeCount,
	)
	return i, err
}

type InsertFollowsParams struct {
	FollowerID  int32 `json:"follower_id"`
	FollowingID int32 `json:"following_id"`
}

type InsertLikesParams struct {
	PostID int32 `json:"post_id"`
	UserID int32 `json:"user_id"`
}

const insertPost = `-- name: InsertPost :exec
INSERT INTO posts(content, author_id)
    VALUES ($1, $2)
`

type InsertPostParams struct {
	Content  string `json:"content"`
	AuthorID int32  `json:"author_id"`
}

func (q *Queries) InsertPost(ctx context.Context, arg InsertPostParams) error {
	_, err := q.db.Exec(ctx, insertPost, arg.Content, arg.AuthorID)
	return err
}

type InsertPostsParams struct {
	Content  string `json:"content"`
	AuthorID int32  `json:"author_id"`
}

type InsertUsersParams struct {
	Email        string `json:"email"`
	Username     string `json:"username"`
	PasswordHash string `json:"password_hash"`
}

const likePost = `-- name: LikePost :exec
INSERT INTO likes(post_id, user_id)
    VALUES ($1, $2)
`

type LikePostParams struct {
	PostID int32 `json:"post_id"`
	UserID int32 `json:"user_id"`
}

func (q *Queries) LikePost(ctx context.Context, arg LikePostParams) error {
	_, err := q.db.Exec(ctx, likePost, arg.PostID, arg.UserID)
	return err
}

const unlikePost = `-- name: UnlikePost :exec
DELETE FROM likes
WHERE post_id = $1
    AND user_id = $2
`

type UnlikePostParams struct {
	PostID int32 `json:"post_id"`
	UserID int32 `json:"user_id"`
}

func (q *Queries) UnlikePost(ctx context.Context, arg UnlikePostParams) error {
	_, err := q.db.Exec(ctx, unlikePost, arg.PostID, arg.UserID)
	return err
}
