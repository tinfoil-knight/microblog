// eslint-disable-next-line node/no-unpublished-require
const faker = require('faker')
const { connectToDb } = require('../utils/db')
const { createHash } = require('../utils/auth')
const { User, Post, Like } = require('../models')

const cleanup = async () => {
	await User.deleteMany({})
	await Post.deleteMany({})
	console.log('cleanup done')
}

const range = num => {
	return [...Array(num).keys()]
}

const randomList = (num, min, max) => {
	return [...Array(num).keys()].map(_ => getRandomIntInclusive(min, max))
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

function getRandomIntInclusive(min, max) {
	min = Math.ceil(min)
	max = Math.floor(max)
	return Math.floor(Math.random() * (max - min + 1) + min) //The maximum is inclusive and the minimum is inclusive
}

const addPosts = async (min = 5, max = 100) => {
	const getNPosts = n => {
		return range(n).map(_ => ({
			content: faker.lorem.sentences(),
		}))
	}
	const users = await User.find({})
	const ids = users.map(x => x._id)
	await Promise.all(
		ids.map(id => {
			const posts = getNPosts(getRandomIntInclusive(min, max))
			return Post.insertMany(posts.map(x => ({ ...x, author: id })))
		})
	)
	const posts = await Post.countDocuments({})
	console.log('posts added:', posts)
}

const addLikes = async () => {
	const posts = await Post.find({}).lean()
	const users = await User.find({}).lean()
	const getNLikes = n => {
		const nums = randomList(n, 0, users.length - 1)
		return [...new Set(nums)]
	}
	await Promise.all(
		posts.map(post => {
			const nums = getNLikes(getRandomIntInclusive(0, users.length))
			const userIds = nums.map(i => users[i]._id)
			return Like.insertMany(userIds.map(u => ({ user: u, post: post._id })))
		})
	)
	const likes = await Like.countDocuments({})
	console.log('likes added:', likes)
}

const main = async () => {
	await connectToDb(process.env.MONGODB_URI)
	await cleanup()
	await createUsers(100)
	await addPosts()
	await addLikes()
	// eslint-disable-next-line no-process-exit
	process.exit(0)
}

main()
