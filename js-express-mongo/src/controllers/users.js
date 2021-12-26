const { User, Post, Like } = require('../models')

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

module.exports = userRouter
