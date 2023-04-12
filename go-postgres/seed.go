package main

import (
	"context"
	"fmt"
	"math/rand"
	"os"
	"time"

	"log"

	fake "github.com/brianvoe/gofakeit/v6"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/tinfoil-knight/go-postgres/sqlc"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/exp/maps"
)

const NUM_USERS uint = 100
const MAX_POSTS_PER_USER int = 100

// NOTE: Timestamps might be out of logical order
// eg. timestamp can indicate that a user was followed before they were created
// OR a post was liked before it was created
func SeedDB(ctx context.Context, q *sqlc.Queries, db *pgxpool.Pool) {
	var err error

	log.Println("dropping tables")
	db.Exec(ctx, `DROP TABLE IF EXISTS likes, follows, posts, users CASCADE`)

	log.Println("creating tables")
	f, _ := os.ReadFile("schema.sql")
	schema := string(f)

	_, err = db.Exec(ctx, schema)
	panicOnErr(err)

	// TODO: add some variation in created_at prop for all tables

	usersData := []sqlc.InsertUsersParams{}
	for i := 0; i < int(NUM_USERS); i++ {
		username, psw := fake.Username(), fake.Password(true, true, true, true, false, 8)
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(psw), bcrypt.DefaultCost)
		fmt.Println(username, psw)
		var created_at pgtype.Timestamptz
		// adds variation in created_at by spreading it over the last 1000 hours
		err := created_at.Scan(time.Now().Add(time.Hour * time.Duration(-rand.Intn(1000))))
		panicOnErr(err)
		usersData = append(usersData, sqlc.InsertUsersParams{
			Email:        fake.Email(),
			Username:     username,
			PasswordHash: string(hashedPassword),
			CreatedAt:    created_at,
			UpdatedAt:    created_at,
		})
	}

	log.Println("creating users")
	_, err = q.InsertUsers(ctx, usersData)
	panicOnErr(err)

	userIDs, _ := q.GetAllUserIDs(ctx)

	authorIDs := []int32{}
	for _, id := range userIDs {
		numPosts := rand.Intn(MAX_POSTS_PER_USER)
		authorIDs = append(authorIDs, fill(numPosts, id)...)
	}

	rand.Seed(time.Now().UnixNano())
	rand.Shuffle(len(authorIDs), func(i, j int) { authorIDs[i], authorIDs[j] = authorIDs[j], authorIDs[i] })

	postsData := []sqlc.InsertPostsParams{}
	for _, id := range authorIDs {
		var created_at pgtype.Timestamptz
		created_at.Scan(time.Now().Add(time.Hour * time.Duration(-rand.Intn(100))))
		postsData = append(postsData, sqlc.InsertPostsParams{
			Content:   fake.Sentence((int(id) % 40) + 1),
			AuthorID:  id,
			CreatedAt: created_at,
		})
	}

	log.Println("creating posts")
	_, err = q.InsertPosts(ctx, postsData)
	panicOnErr(err)

	postIDs, _ := q.GetAllPostIDs(ctx)
	numUsers := len(userIDs)

	likesData := []sqlc.InsertLikesParams{}
	for _, postID := range postIDs {
		numLikes := rand.Intn(numUsers + 1)
		if numLikes > 0 {
			idxs := getNRand(numLikes, numUsers)

			for _, idx := range idxs {
				var created_at pgtype.Timestamptz
				created_at.Scan(time.Now().Add(time.Hour * time.Duration(-rand.Intn(10))))
				likesData = append(likesData, sqlc.InsertLikesParams{
					PostID:    postID,
					UserID:    userIDs[idx],
					CreatedAt: created_at,
				})
			}
		}
	}

	log.Println("adding likes to posts")
	_, err = q.InsertLikes(ctx, likesData)
	panicOnErr(err)

	followsData := []sqlc.InsertFollowsParams{}
	for _, followerID := range userIDs {
		numFollowers := rand.Intn(numUsers)
		if numFollowers > 0 {
			idxs := getNRand(numFollowers, numUsers)

			for _, idx := range idxs {
				followingID := userIDs[idx]
				if followingID != followerID {
					var created_at pgtype.Timestamptz
					created_at.Scan(time.Now().Add(time.Hour * time.Duration(-rand.Intn(500))))
					followsData = append(followsData, sqlc.InsertFollowsParams{
						FollowerID:  followerID,
						FollowingID: followingID,
						CreatedAt:   created_at,
					})
				}
			}
		}
	}

	log.Println("adding followers")
	_, err = q.InsertFollows(ctx, followsData)
	panicOnErr(err)
}

func panicOnErr(err error) {
	if err != nil {
		panic(err)
	}
}

func fill(size int, num int32) []int32 {
	s := make([]int32, size)
	for i := range s {
		s[i] = num
	}
	return s
}

func getNRand(n int, limit int) []int {
	m := make(map[int]struct{})
	for len(m) < n {
		r := rand.Intn(limit)
		if _, ok := m[r]; !ok {
			m[r] = struct{}{}
		}
	}
	return maps.Keys(m)
}
