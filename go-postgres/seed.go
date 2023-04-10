package main

import (
	"context"
	"fmt"
	"math/rand"
	"time"

	"log"

	fake "github.com/brianvoe/gofakeit/v6"
	"github.com/tinfoil-knight/go-postgres/sqlc"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/exp/maps"
)

const NUM_USERS uint = 100
const MAX_POSTS_PER_USER int = 100

func SeedDB(ctx context.Context, q *sqlc.Queries) {
	// fns := []func(context.Context) error{
	// 	q.TruncateLikes,
	// 	q.TruncatePosts,
	// 	q.TruncateFollows,
	// 	q.TruncateUsers,
	// }

	// log.Println("truncating tables")
	// for _, fn := range fns {
	// 	panicOnErr(fn(ctx))
	// }

	usersData := []sqlc.InsertUsersParams{}
	for i := 0; i < int(NUM_USERS); i++ {
		username, psw := fake.Username(), fake.Password(true, true, true, true, false, 8)
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(psw), bcrypt.DefaultCost)
		fmt.Println(username, psw)
		usersData = append(usersData, sqlc.InsertUsersParams{
			Email:        fake.Email(),
			Username:     username,
			PasswordHash: string(hashedPassword),
		})
	}

	var err error

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
		postsData = append(postsData, sqlc.InsertPostsParams{
			Content:  fake.Sentence((int(id) % 40) + 1),
			AuthorID: id,
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
				likesData = append(likesData, sqlc.InsertLikesParams{
					PostID: postID,
					UserID: userIDs[idx],
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
					followsData = append(followsData, sqlc.InsertFollowsParams{
						FollowerID:  followerID,
						FollowingID: followingID,
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
