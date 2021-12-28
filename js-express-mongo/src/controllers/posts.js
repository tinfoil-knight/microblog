const { Post, Like } = require('../models')

const HttpError = require('../utils/error')
const { clientAuth } = require('../utils/auth')

const postRouter = require('express').Router()

const ok = { message: 'ok' }

postRouter.post('/', clientAuth, async (req, res) => {
	const { content } = req.body
	const author = req.id
	const post = new Post({ content, author })
	await post.save()
	res.status(201).json(ok)
})

postRouter
	.route('/:id')
	.get(async (req, res) => {
		const postId = req.params.id
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
		const doc = {
			author: post.author.username,
			content: post.content,
			createdAt: post.createdAt,
			likes,
		}
		return res.status(200).json(doc)
	})
	.delete(clientAuth, async (req, res) => {
		const userId = req.id
		const postId = req.params.id
		const post = await Post.findById(postId).select('author -_id').lean()
		if (!post) {
			throw new HttpError(404)
		}
		const authorId = post.author.toString()
		if (userId !== authorId) {
			throw new HttpError(403)
		}
		await Promise.all([
			Like.deleteMany({ post: postId }),
			Post.deleteOne({ _id: postId }),
		])
		return res.status(200).json(ok)
	})

postRouter
	.route('/:id/likes')
	.post(clientAuth, async (req, res) => {
		const post = req.params.id
		const user = req.id
		const like = new Like({ post, user })
		await like.save()
		return res.status(200).json(ok)
	})
	.get(async (req, res) => {
		const limit = 50
		const page = Math.max(0, req.query?.page || 0)
		const offset = limit * page
		const post = req.params.id
		const likes = await Like.find({ post })
			.populate({ path: 'user', select: 'username -_id' })
			.select('user -_id')
			.limit(limit)
			.skip(offset)
			.sort({ createdAt: 'desc' })
			.lean()
		const usernames = likes.map(x => x.user.username)
		return res.status(200).json(usernames)
	})
	.delete(clientAuth, async (req, res) => {
		const post = req.params.id
		const user = req.id
		await Like.deleteOne({ post, user })
		return res.status(200).json(ok)
	})

module.exports = postRouter
