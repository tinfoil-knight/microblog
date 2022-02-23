const { PrismaClient } = require('@prisma/client')

const HttpError = require('../utils/error')
// const { addJob } = require('../utils/queue')

const prisma = new PrismaClient()

module.exports = class PostService {
	static async CreatePost({ content, authorId }) {
		const post = await prisma.post.create({ data: { content, authorId } })
		// addJob('fanout', { authorId, postId: post.id })
		return post.id
	}

	static async GetPost(postId) {
		const post = await prisma.post.findUnique({
			where: { id: postId },
			select: {
				author: {
					select: { username: true },
				},
				content: true,
				createdAt: true,
				_count: {
					select: { likes: true },
				},
			},
		})
		if (!post) {
			throw new HttpError(404)
		}
		return {
			author: post.author.username,
			content: post.content,
			createdAt: post.createdAt,
			likes: post._count.likes,
		}
	}

	static Like(postId, userId) {
		return prisma.like.create({ data: { postId, userId } })
	}

	static Unlike(postId, userId) {
		return prisma.like.delete({
			where: {
				postId_userId: {
					postId,
					userId,
				},
			},
		})
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
		const post = await prisma.post.findUnique({
			where: { id: postId },
			select: { authorId: true },
		})
		if (userId !== post.authorId) {
			throw new HttpError(403)
		}
		await prisma.like.deleteMany({ where: { postId } })
		await prisma.post.delete({ where: { id: postId } })
	}
}
