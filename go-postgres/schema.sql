CREATE TABLE users(
    id serial PRIMARY KEY,
    email varchar(100) NOT NULL UNIQUE,
    username varchar(50) NOT NULL UNIQUE,
    password_hash text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE posts(
    id serial PRIMARY KEY,
    content varchar(400) NOT NULL,
    author_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE likes(
    post_id int NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

CREATE INDEX likes_createdat_userid_idx ON likes(created_at, user_id);

CREATE TABLE follows(
    follower_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

CREATE OR REPLACE FUNCTION set_timestamp()
    RETURNS TRIGGER
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$
LANGUAGE 'plpgsql';

CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_timestamp();

