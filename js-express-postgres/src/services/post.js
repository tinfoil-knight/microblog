const HttpError = require('../utils/error')
const { addJob } = require('../utils/queue')

module.exports = class PostService {
	static async CreatePost({ content, author }) {
		const post = new Post({ content, author })
		await post.save()
		addJob('fanout', { authorId: author, postId: post._id })
	}

	static async GetPost(postId) {
		const [post, likes] = await Promise.all([
			Post.findById(postId)
				.populate({ path: 'author', select: 'username -_id' })
				.select('content createdAt -_id')
				.lean(),
			Like.countDocuments({ post: postId }),
		])
		if (!post) {
			throw new HttpError(404)
		}
		return {
			author: post.author.username,
			content: post.content,
			createdAt: post.createdAt,
			likes,
		}
	}

	static async Like(postId, userId) {
		const like = new Like({ post: postId, user: userId })
		await like.save()
	}

	static async Unlike(postId, userId) {
		await Like.deleteOne({ post: postId, user: userId })
	}

	static async GetLikes(postId, cursor) {
		const limit = 20
		const post = postId
		const prevId = cursor
		const filter = prevId ? { post, _id: { $lt: prevId } } : { post }

		const likes = await Like.find(filter)
			.populate({ path: 'user', select: 'username -_id' })
			.select('user')
			.sort({ _id: 'desc' })
			.limit(limit + 1)
			.lean()
		const hasMore = likes.length === limit + 1
		if (hasMore) {
			likes.pop()
		}
		const lastId = likes.length && hasMore ? likes.at(-1)._id : null
		const usernames = likes.map(x => x.user.username)
		return { usernames, lastId, hasMore }
	}

	static async DeletePost(postId, userId) {
		const post = await Post.findById(postId).select('author -_id').lean()
		if (!post) {
			throw new HttpError(404)
		}
		const authorId = String(post.author)
		if (userId !== authorId) {
			throw new HttpError(403)
		}
		await Promise.all([
			Like.deleteMany({ post: postId }),
			Post.deleteOne({ _id: postId }),
		])
	}
}
