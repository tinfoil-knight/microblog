// eslint-disable-next-line node/no-unpublished-require
const faker = require('faker')
const { connectToDb } = require('../utils/db')
const { createHash } = require('../utils/auth')
const { User, Post, Like, Follow } = require('../models')

const cleanup = async () => {
	await User.deleteMany({})
	await Post.deleteMany({})
	await Like.deleteMany({})
	await Follow.deleteMany({})
	console.log('cleanup done')
}

const range = num => {
	return [...Array(num).keys()]
}

const randomList = (num, min, max) => {
	return [...Array(num).keys()].map(_ => getRandIntInclusive(min, max))
}

const createUsers = async num => {
	const users = range(num).map(_ => {
		const password = faker.internet.password()
		const passwordHash = createHash(password)
		const user = {
			username: faker.internet.userName(),
			email: faker.internet.email(),
			passwordHash,
		}
		console.log(user.username, password)
		return user
	})
	await User.insertMany(users)
	console.log('users created')
}

function getRandIntInclusive(min, max) {
	min = Math.ceil(min)
	max = Math.floor(max)
	return Math.floor(Math.random() * (max - min + 1) + min) //The maximum is inclusive and the minimum is inclusive
}

const addPosts = async (min, max) => {
	const getNPosts = n => {
		return range(n).map(_ => ({
			content: faker.lorem.sentences(),
		}))
	}
	const users = await User.find({})
	const ids = users.map(x => x._id)
	await Promise.all(
		ids.map(id => {
			const posts = getNPosts(getRandIntInclusive(min, max))
			return Post.insertMany(posts.map(x => ({ ...x, author: id })))
		})
	)
	const posts = await Post.countDocuments({})
	console.log('posts added:', posts)
}

// Will return n or less unique integers
const getNRand = (n, min, max) => {
	const nums = randomList(n, min, max)
	return [...new Set(nums)]
}

const addLikes = async () => {
	const posts = await Post.find({}).lean()
	const users = await User.find({}).lean()
	// TODO: Use Bluebird Promise.map for better concurrency support
	await Promise.all(
		posts.map(post => {
			const n = getRandIntInclusive(0, users.length)
			const nums = getNRand(n, 0, users.length - 1)
			const userIds = nums.map(i => users[i]._id)
			return Like.insertMany(userIds.map(u => ({ user: u, post: post._id })))
		})
	)
	const likes = await Like.countDocuments({})
	console.log('likes added:', likes)
}

const addFollows = async () => {
	const users = await User.find({}).lean()

	await Promise.all(
		users.map(user => {
			const n = getRandIntInclusive(0, users.length)
			const nums = getNRand(n, 0, users.length - 1)
			const followerIds = nums
				.map(i => users[i]._id)
				.filter(x => x !== user._id)
			return Follow.insertMany(
				followerIds.map(x => ({ follower: user._id, following: x._id }))
			)
		})
	)

	const follows = await Follow.countDocuments({})
	console.log('follows added:', follows)
}

const main = async () => {
	await connectToDb(process.env.MONGODB_URI)
	await cleanup()
	await createUsers(100)
	await addPosts(5, 100)
	await addFollows()
	await addLikes()
	// eslint-disable-next-line no-process-exit
	process.exit(0)
}

main()
