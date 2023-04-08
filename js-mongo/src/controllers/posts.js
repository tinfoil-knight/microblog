const { clientAuth } = require('../utils/auth')
const { PostService } = require('../services')

const postRouter = require('express').Router()

const ok = { message: 'ok' }

postRouter.post('/', clientAuth, async (req, res) => {
	const { content } = req.body
	await PostService.CreatePost({ content, author: req.id })
	res.status(201).json(ok)
})

postRouter
	.route('/:id')
	.get(async (req, res) => {
		const post = await PostService.GetPost(req.params.id)
		return res.status(200).json(post)
	})
	.delete(clientAuth, async (req, res) => {
		const userId = req.id
		const postId = req.params.id
		await PostService.DeletePost(postId, userId)
		return res.status(200).json(ok)
	})

postRouter
	.route('/:id/likes')
	.post(clientAuth, async (req, res) => {
		await PostService.Like(req.params.id, req.id)
		return res.status(200).json(ok)
	})
	.get(async (req, res) => {
		const { usernames, lastId, hasMore } = await PostService.GetLikes(
			req.params.id,
			req.query.cursor
		)
		return res
			.status(200)
			.json({ data: { usernames }, paging: { cursor: lastId, hasMore } })
	})
	.delete(clientAuth, async (req, res) => {
		await PostService.Unlike(req.params.id, req.id)
		res.status(200).json(ok)
	})

module.exports = postRouter
