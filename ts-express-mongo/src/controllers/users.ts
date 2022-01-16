import { Request, Response, Router } from 'express'
import { LeanDocument } from 'mongoose'

import {
	User,
	Post,
	Like,
	Follow,
	IPost,
	IPPost,
	IUser,
	IPFollow,
} from '../models'

import HttpError from '../utils/error'
import { clientAuth, createHash, compareHash, createToken } from '../utils/auth'
import redis from '../utils/redis'

const userRouter = Router()

const ok = { message: 'ok' }

type L<T> = LeanDocument<T>

userRouter
	.route('/')
	.post(async (req: Request, res: Response) => {
		const { username, email, password } = req.body
		if (!password) {
			throw new HttpError(400, 'password missing', { body: req.body })
		}
		const passwordHash = await createHash(String(password))
		await User.create({
			username,
			email,
			passwordHash,
		})
		res.status(201).json(ok)
	})
	.put(clientAuth, async (req: Request, res: Response) => {
		const { email } = req.body
		await User.updateOne({ _id: req.id }, { email })
		return res.status(200).json(ok)
	})
	.delete(clientAuth, async (req: Request, res: Response) => {
		const userId = req.id
		const postIds: L<IPost>['_id'][] = (
			await Post.find({ author: userId }).select('_id').lean()
		).map(x => x._id)
		await Promise.all([
			User.deleteOne({ _id: userId }),
			Like.deleteMany({ $or: [{ user: userId }, { post: { $in: postIds } }] }),
			Post.deleteMany({ author: userId }),
		])
		return res.status(200).json(ok)
	})

userRouter.post('/auth', async (req: Request, res: Response) => {
	const { username, password } = req.body
	const user: Pick<L<IUser>, '_id' | 'passwordHash'> = await User.findOne({
		username,
	})
		.select('passwordHash')
		.lean()
	if (!user) {
		throw new HttpError(404, 'no such user')
	}
	const isPswCorrect = await compareHash(String(password), user.passwordHash)
	// @ts-expect-error
	if (!isPswCorrect) {
		throw new HttpError(401, 'incorrect password')
	}
	// eslint-disable-next-line @typescript-eslint/await-thenable
	const token = await createToken({ id: String(user._id) })
	return res.status(200).json({ token })
})

userRouter.get('/profile/:username', async (req: Request, res: Response) => {
	const username = req.params.username
	const user: Pick<L<IUser>, '_id' | 'createdAt'> = await User.findOne({
		username,
	})
		.select('createdAt')
		.lean()
	if (user == null) {
		throw new HttpError(404)
	}
	const [followers, following] = await Promise.all([
		Follow.countDocuments({ following: user._id }),
		Follow.countDocuments({ follower: user._id }),
	])
	res
		.status(200)
		.json({ id: user._id, createdAt: user.createdAt, followers, following })
})

userRouter.get('/:id/followers', async (req: Request, res: Response) => {
	const userId = req.params.id
	const followerList: Pick<L<IPFollow>, 'follower'>[] = await Follow.find({
		following: userId,
	})
		.populate({ path: 'follower', select: 'username -_id' })
		.select('follower')
		.lean()
	res
		.status(200)
		.json({ followers: followerList.map(x => x.follower.username) })
})

userRouter.get('/:id/following', async (req: Request, res: Response) => {
	const userId = req.params.id
	const followingList: Pick<L<IPFollow>, 'following'>[] = await Follow.find({
		follower: userId,
	})
		.populate({ path: 'following', select: 'username -_id' })
		.select('following')
		.lean()
	res
		.status(200)
		.json({ following: followingList.map(x => x.following.username) })
})

userRouter
	.route('/follow/:id')
	.post(clientAuth, async (req: Request, res: Response) => {
		const follower = req.id!
		const following = req.params.id

		if (follower === following) {
			throw new HttpError(400, 'can not follow your own account')
		}

		const follow = new Follow({ follower, following })
		await follow.save()
		res.status(200).json(ok)
	})
	.delete(clientAuth, async (req: Request, res: Response) => {
		const follower = req.id
		const following = req.params.id
		await Follow.deleteOne({ follower, following })
		res.status(200).json(ok)
	})

userRouter.get('/feed', clientAuth, async (req: Request, res: Response) => {
	const userId = req.id!
	const START = Math.max(0, Number(req.query?.cursor || 0))
	const LIMIT = 50
	const END = START + LIMIT
	const postIds = await redis.lrange(userId, START, END + 1)
	const hasMore = postIds.length > LIMIT
	if (hasMore) {
		postIds.shift()
	}
	const posts: Partial<L<IPPost>>[] = await Post.find({
		_id: { $in: postIds },
	})
		.populate({ path: 'author', select: 'username' })
		.sort({ createdAt: -1 })
		.lean()

	const mappedPosts = posts.map(x => {
		x.postId = x._id
		x.authorId = x.author!._id
		x.author = x.author!.username
		delete x._id
		return x
	})

	res.status(200).json({
		data: { posts: mappedPosts },
		paging: { cursor: hasMore ? END : null, hasMore },
	})
})

userRouter.get('/:id/posts', async (req: Request, res: Response) => {
	const userId = req.params.id
	type PostRes = Pick<IPost, '_id' | 'content' | 'createdAt'>
	const posts: L<PostRes>[] = await Post.find({
		author: userId,
	})
		.select('content createdAt')
		.sort({ _id: -1 })
		.lean()
	const mappedPosts = posts.map((x: Partial<PostRes>) => {
		x.id = x._id
		delete x._id
		return x
	})
	res.status(200).json(mappedPosts)
})

export default userRouter
