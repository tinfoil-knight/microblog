package main

import (
	"context"
	"fmt"
	"os"

	"github.com/tinfoil-knight/go-postgres/sqlc"

	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	db, err := pgxpool.New(context.Background(), "postgresql://localhost:5432/mydb")
	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to create connection pool: %v\n", err)
		os.Exit(1)
	}
	defer db.Close()

	queries := sqlc.New(db)
	ctx := context.TODO()

	SeedDB(ctx, queries, db)
}
