const { clientAuth } = require('../utils/auth')
const { UserService } = require('../services')

const userRouter = require('express').Router()

const ok = { message: 'ok' }

userRouter
	.route('/')
	.post(async (req, res) => {
		const { username, email, password } = req.body
		await UserService.SignUp({ username, email, password })
		res.status(201).json(ok)
	})
	.put(clientAuth, async (req, res) => {
		const { email } = req.body
		await UserService.UpdateMail({ userId: req.id, email })
		return res.status(200).json(ok)
	})
	.delete(clientAuth, async (req, res) => {
		await UserService.Delete(req.id)
		return res.status(200).json(ok)
	})

userRouter.post('/auth', async (req, res) => {
	const { username, password } = req.body
	const token = await UserService.GetToken(username, password)
	return res.status(200).json({ token })
})

userRouter.get('/profile/:username', async (req, res) => {
	const username = req.params.username
	const data = await UserService.GetProfile(username)
	res.status(200).json(data)
})

userRouter.get('/:id/followers', async (req, res) => {
	const userId = req.params.id
	const followers = await UserService.GetFollowers(userId)
	res.status(200).json({ followers })
})

userRouter.get('/:id/following', async (req, res) => {
	const userId = req.params.id
	const following = await UserService.GetFollowing(userId)
	res.status(200).json({ following })
})

userRouter
	.route('/follow/:id')
	.post(clientAuth, async (req, res) => {
		await UserService.Follow(req.id, req.params.id)
		res.status(200).json(ok)
	})
	.delete(clientAuth, async (req, res) => {
		await UserService.Unfollow(req.id, req.params.id)
		res.status(200).json(ok)
	})

userRouter.get('/feed', clientAuth, async (req, res) => {
	const { posts, cursor, hasMore } = await UserService.GetFeed(
		req.id,
		req.query.cursor
	)

	res.status(200).json({
		data: { posts },
		paging: { cursor, hasMore },
	})
})

userRouter.get('/:id/posts', async (req, res) => {
	const userId = req.params.id
	const posts = await UserService.GetPosts(userId)
	res.status(200).json(posts)
})

module.exports = userRouter
