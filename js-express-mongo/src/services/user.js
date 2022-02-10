const redis = require('../utils/redis')
const HttpError = require('../utils/error')
const { createHash, compareHash, createToken } = require('../utils/auth')
const { User, Post, Like, Follow } = require('../models')

module.exports = class UserService {
	static async SignUp({ username, email, password }) {
		const passwordHash = createHash(password)
		const user = new User({
			username,
			email,
			passwordHash,
		})
		await user.save()
	}

	static async GetToken(username, password) {
		const user = await User.findOne({ username }).select('passwordHash').lean()
		const isPswCorrect = await compareHash(password, user.passwordHash)
		if (!isPswCorrect) {
			throw new HttpError(401, 'incorrect password')
		}
		const token = await createToken({ id: user._id })
		return token
	}

	static async UpdateMail({ userId, email }) {
		await User.updateOne({ _id: userId }, { email })
	}

	static async GetProfile(username) {
		const user = await User.findOne({ username }).select('createdAt').lean()
		if (!user) {
			return null
		}
		const [followers, following] = await Promise.all([
			Follow.countDocuments({ following: user._id }),
			Follow.countDocuments({ follower: user._id }),
		])
		return { id: user._id, createdAt: user.createdAt, followers, following }
	}

	static async GetFollowers(userId) {
		const followerList = await Follow.find({ following: userId })
			.populate({ path: 'follower', select: 'username -_id' })
			.lean()
		return followerList.map(x => x.follower.username)
	}

	static async GetFollowing(userId) {
		const followingList = await Follow.find({ follower: userId })
			.populate({ path: 'following', select: 'username -_id' })
			.lean()
		return followingList.map(x => x.following.username)
	}

	static async Follow(follower, following) {
		const follow = new Follow({ follower, following })
		await follow.save()
	}

	static async Unfollow(follower, following) {
		await Follow.deleteOne({ follower, following })
	}

	static async GetPosts(userId) {
		const posts = await Post.find({ author: userId })
			.select('content createdAt')
			.sort({ _id: -1 })
			.lean()
		const mappedPosts = posts.map(x => {
			x.id = x._id
			delete x._id
			return x
		})
		return mappedPosts
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
		const postIds = (
			await Post.find({ author: userId }).select('_id').lean()
		).map(x => x._id)

		await Promise.all([
			User.deleteOne({ _id: userId }),
			Like.deleteMany({ $or: [{ user: userId }, { post: { $in: postIds } }] }),
			Post.deleteMany({ author: userId }),
		])
	}
}
