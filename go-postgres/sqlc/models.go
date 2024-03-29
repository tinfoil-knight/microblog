// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.17.2

package sqlc

import (
	"github.com/jackc/pgx/v5/pgtype"
)

type Follow struct {
	FollowerID  int32              `json:"follower_id"`
	FollowingID int32              `json:"following_id"`
	CreatedAt   pgtype.Timestamptz `json:"created_at"`
}

type Like struct {
	PostID    int32              `json:"post_id"`
	UserID    int32              `json:"user_id"`
	CreatedAt pgtype.Timestamptz `json:"created_at"`
}

type Post struct {
	ID        int32              `json:"id"`
	Content   string             `json:"content"`
	AuthorID  int32              `json:"author_id"`
	CreatedAt pgtype.Timestamptz `json:"created_at"`
}

type User struct {
	ID           int32              `json:"id"`
	Email        string             `json:"email"`
	Username     string             `json:"username"`
	PasswordHash string             `json:"password_hash"`
	CreatedAt    pgtype.Timestamptz `json:"created_at"`
	UpdatedAt    pgtype.Timestamptz `json:"updated_at"`
}
