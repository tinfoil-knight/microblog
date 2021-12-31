import { Request, Response } from 'express'
import { HydratedDocument } from 'mongoose'

import { Post, IPost, Like } from '../models'
import HttpError from '../utils/error'
import { clientAuth } from '../utils/auth'
import { addJob } from '../utils/queue'

const postRouter = require('express').Router()

const ok = { message: 'ok' }

postRouter.post('/', clientAuth, async (req: Request, res: Response) => {
	const { content } = req.body
	const author = req.id
	const post: HydratedDocument<IPost> = await Post.create({ content, author })
	addJob('fanout', { authorId: author, postId: post._id })
	res.status(201).json(ok)
})

postRouter
	.route('/:id')
	.get(async (req: Request, res: Response) => {
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
	.delete(clientAuth, async (req: Request, res: Response) => {
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
	.post(clientAuth, async (req: Request, res: Response) => {
		const post = req.params.id
		const user = req.id
		const like = new Like({ post, user })
		await like.save()
		return res.status(200).json(ok)
	})
	.get(async (req: Request, res: Response) => {
		const limit = 20
		const post = req.params.id
		const prevId = req.query.cursor
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
		// @ts-expect-error
		const lastId = likes.length && hasMore ? likes.at(-1)._id : null
		const usernames = likes.map(x => x.user.username)
		return res
			.status(200)
			.json({ data: { usernames }, paging: { cursor: lastId, hasMore } })
	})
	.delete(clientAuth, async (req: Request, res: Response) => {
		const post = req.params.id
		const user = req.id
		await Like.deleteOne({ post, user })
		return res.status(200).json(ok)
	})

export default postRouter
