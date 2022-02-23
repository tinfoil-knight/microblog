const { PrismaClient } = require('@prisma/client')

const { createHash, compareHash, createToken } = require('../utils/auth')
const HttpError = require('../utils/error')
const redis = require('../utils/redis')

const prisma = new PrismaClient()

module.exports = class UserService {
	static SignUp({ username, email, password }) {
		return prisma.user.create({
			data: {
				username,
				email,
				passwordHash: createHash(password),
			},
		})
	}

	static async GetToken(username, password) {
		const user = await prisma.user.findUnique({
			where: {
				username,
			},
			select: { id: true, passwordHash: true },
		})
		const isPswCorrect = await compareHash(password, user.passwordHash)
		if (!isPswCorrect) {
			throw new HttpError(401, 'incorrect password')
		}
		const token = await createToken({ id: user.id })
		return token
	}

	static UpdateMail(userId, email) {
		return prisma.user.update({
			where: {
				id: userId,
			},
			data: {
				email,
			},
		})
	}

	static async GetProfile(username) {
		const user = await prisma.user.findUnique({
			where: {
				username,
			},
			select: {
				_count: {
					select: { followers: true, following: true, posts: true },
				},
				createdAt: true,
				id: true,
			},
		})
		if (!user) {
			throw new HttpError(404)
		}
		return {
			id: user.id,
			createdAt: user.createdAt,
			followers: user._count.followers,
			following: user._count.following,
			posts: user._count.posts,
		}
	}

	static async GetFollowers(userId) {
		const followers = await prisma.follow.findMany({
			where: { followingId: userId },
			orderBy: { createdAt: 'desc' },
			select: {
				follower: {
					select: {
						username: true,
					},
				},
			},
		})
		return followers.map(x => x.follower.username)
	}

	static async GetFollowing(userId) {
		const following = await prisma.follow.findMany({
			where: { followerId: userId },
			orderBy: { createdAt: 'desc' },
			select: {
				following: {
					select: {
						username: true,
					},
				},
			},
		})
		return following.map(x => x.following.username)
	}

	static Follow(followerId, followingId) {
		return prisma.follow.create({ data: { followerId, followingId } })
	}

	static Unfollow(followerId, followingId) {
		return prisma.follow.delete({
			where: { followerId_followingId: { followerId, followingId } },
		})
	}

	static GetPosts(userId) {
		// TODO: paginate
		return prisma.post.findMany({
			where: { authorId: userId },
			select: {
				content: true,
				createdAt: true,
				id: true,
				_count: {
					select: { likes: true },
				},
			},
			orderBy: { createdAt: 'desc' },
		})
	}

	static async GetFeed(userId, cursor) {
		const START = Math.max(0, cursor || 0)
		const LIMIT = 50
		const END = START + LIMIT
		const postIds = await redis.lrange(userId, START, END + 1)
		const hasMore = postIds.length > LIMIT
		if (hasMore) {
			postIds.shift()
		}
		const posts = await Post.find({ _id: { $in: postIds } })
			.select('content author createdAt')
			.populate({ path: 'author', select: 'username' })
			.sort({ createdAt: -1 })
			.lean()
		const mappedPosts = posts.map(x => {
			x.postId = x._id
			x.authorId = x.author._id
			x.author = x.author.username
			delete x._id
			return x
		})
		return { posts: mappedPosts, cursor: hasMore ? END : null, hasMore }
	}

	static async Delete(userId) {
		await Promise.all([
			prisma.follow.deleteMany({
				where: {
					OR: [
						{
							followerId: userId,
						},
						{
							followingId: userId,
						},
					],
				},
			}),
			prisma.like.deleteMany({
				where: { OR: [{ userId }, { post: { authorId: userId } }] },
			}),
		])
		await prisma.post.deleteMany({ where: { authorId: userId } })
		await prisma.user.delete({ where: { id: userId } })
		// TODO: clear redis
	}
}
