const { User, Post, Like, Follow } = require('../models')

const HttpError = require('../utils/error')
const {
	clientAuth,
	createHash,
	compareHash,
	createToken,
} = require('../utils/auth')

const userRouter = require('express').Router()

const ok = { message: 'ok' }

userRouter
	.route('/')
	.post(async (req, res) => {
		const { username, email, password } = req.body
		if (!password) {
			throw new HttpError(400, 'password missing', { body: req.body })
		}
		const passwordHash = createHash(password)
		const user = new User({
			username,
			email,
			passwordHash,
		})
		await user.save()
		res.status(201).json(ok)
	})
	.put(clientAuth, async (req, res) => {
		const { email } = req.body
		await User.updateOne({ _id: req.id }, { email })
		return res.status(200).json(ok)
	})
	.delete(clientAuth, async (req, res) => {
		const userId = req.id
		const postIds = (
			await Post.find({ author: userId }).select('_id').lean()
		).map(x => x._id)
		await Promise.all([
			User.deleteOne({ _id: userId }),
			Like.deleteMany({ $or: [{ user: userId }, { post: { $in: postIds } }] }),
			Post.deleteMany({ author: userId }),
		])
		return res.status(200).json(ok)
	})

userRouter.post('/auth', async (req, res) => {
	const { username, password } = req.body
	const user = await User.findOne({ username }).select('passwordHash').lean()
	const isPswCorrect = await compareHash(password, user.passwordHash)
	if (!isPswCorrect) {
		throw new HttpError(401, 'incorrect password')
	}
	const token = await createToken({ id: user._id })
	return res.status(200).json({ token })
})

userRouter.get('/:username', async (req, res) => {
	const username = req.params.username
	const user = await User.findOne({ username }).select('createdAt').lean()
	const [followers, following] = await Promise.all([
		Follow.countDocuments({ following: user._id }),
		Follow.countDocuments({ follower: user._id }),
	])
	res
		.status(200)
		.json({ id: user._id, createdAt: user.createdAt, followers, following })
})

userRouter.get('/:id/followers', async (req, res) => {
	const userId = req.params.id
	const followerList = await Follow.find({ following: userId })
		.populate({ path: 'follower', select: 'username -_id' })
		.lean()
	res
		.status(200)
		.json({ followers: followerList.map(x => x.follower.username) })
})

userRouter.get('/:id/following', async (req, res) => {
	const userId = req.params.id
	const followingList = await Follow.find({ follower: userId })
		.populate({ path: 'following', select: 'username -_id' })
		.lean()
	res
		.status(200)
		.json({ following: followingList.map(x => x.following.username) })
})

userRouter
	.route('/follow/:id')
	.post(clientAuth, async (req, res) => {
		const follower = req.id
		const following = req.params.id

		const follow = new Follow({ follower, following })
		await follow.save()
		res.status(200).json(ok)
	})
	.delete(clientAuth, async (req, res) => {
		const follower = req.id
		const following = req.params.id
		await Follow.deleteOne({ follower, following })
		res.status(200).json(ok)
	})

module.exports = userRouter
