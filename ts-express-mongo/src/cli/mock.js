// @ts-nocheck

// eslint-disable-next-line node/no-unpublished-require
import faker from 'faker'

import { connectToDb } from '../utils/db'
import { createHash } from '../utils/auth'
import { addJob } from '../utils/queue'
import { User, Post, Like, Follow } from '../models'

const cleanup = async () => {
	await Promise.all([
		User.deleteMany({}),
		Post.deleteMany({}),
		Like.deleteMany({}),
		Follow.deleteMany({}),
	])
	console.log('mongodb cleanup done')
}

const range = num => {
	return [...Array(num).keys()]
}

const mean = list => {
	return Math.floor(list.reduce((a, b) => a + b, 0) / list.length)
}

// Will return n or less unique integers
const getNRand = (n, min, max) => {
	const randomList = (num, min, max) => {
		return [...Array(num).keys()].map(_ => getRandIntInclusive(min, max))
	}
	const nums = randomList(n, min, max)
	return [...new Set(nums)]
}

const createUsers = async num => {
	const users = range(num).map(_ => {
		const password = faker.internet.password()
		const passwordHash = await createHash(password)
		const user = {
			username: faker.internet.userName(),
			email: faker.internet.email(),
			passwordHash,
		}
		console.log(user.username, password)
		return user
	})
	await User.insertMany(users)
	console.log('users created:', num)
}

// Note: randomization done for an organic looking feed
const addPosts = async (min, max) => {
	function* generatePost() {
		while (true) {
			yield faker.lorem.sentences()
		}
	}

	const postGen = generatePost()
	const users = await User.find({}).select('_id').lean()
	const ids = users.map(x => x._id)
	let userIds = []
	const stat = []
	ids.forEach(id => {
		const rand = getRandIntInclusive(min, max)
		stat.push(rand)
		userIds = userIds.concat(Array(rand).fill(id))
	})
	shuffleArray(userIds)
	const posts = userIds.map(id => ({
		author: id,
		content: postGen.next().value,
	}))
	await Post.insertMany(posts)
	const count = await Post.countDocuments({})
	console.log('posts added:', count)
	console.log('on avg a user has', mean(stat), 'posts')
}

const addLikes = async () => {
	const posts = await Post.find({}).lean()
	const users = await User.find({}).lean()
	const stat = []

	function* chunks(arr, n) {
		for (let i = 0; i < arr.length; i += n) {
			yield arr.slice(i, i + n)
		}
	}

	const allPosts = posts
		.map(post => {
			const likesForPost = getRandIntInclusive(0, users.length)
			const idxs = getNRand(likesForPost, 0, users.length - 1)
			stat.push(idxs.length)
			const userIds = idxs.map(i => users[i]._id)
			return userIds.map(u => ({ user: u, post: post._id }))
		})
		.flat()

	const CHUNK_SIZE = 20000
	const likeGen = chunks(allPosts, CHUNK_SIZE)

	console.time(`allInserts`)
	for (let chunk of likeGen) {
		console.time(`label${chunk[0].user}`)
		await Like.insertMany(chunk, { ordered: false })
		console.timeEnd(`label${chunk[0].user}`)
	}
	console.timeEnd(`allInserts`)

	const likes = await Like.countDocuments({})
	console.log('likes added:', likes)
	console.log('on avg a post is liked', mean(stat), 'times')
}

const addFollows = async () => {
	const users = await User.find({}).lean()
	const stat = []
	await Promise.all(
		users.map(user => {
			const n = getRandIntInclusive(0, users.length)
			const nums = getNRand(n, 0, users.length - 1)
			const followerIds = nums
				.map(i => users[i]._id)
				.filter(x => x !== user._id)
			stat.push(followerIds.length)
			return Follow.insertMany(
				followerIds.map(x => ({ follower: user._id, following: x._id }))
			)
		})
	)

	const follows = await Follow.countDocuments({})
	console.log('follows added:', follows)
	console.log(
		'on avg a user is following',
		Math.floor(stat.reduce((a, b) => a + b, 0) / stat.length),
		'users'
	)
}

const buildFeed = async () => {
	const posts = await Post.find({}).select('author').lean()
	posts.forEach(post => {
		const data = { authorId: post.author, postId: post._id }
		addJob('fanout', data)
	})
	console.log('jobs queued for building feed')
}

const main = async () => {
	await connectToDb(process.env.MONGODB_URI)
	await cleanup()
	await createUsers(100)
	await addPosts(10, 500)
	await addFollows()
	await addLikes()
	await buildFeed()
	console.log('all done')
	// process.exit will terminate the program before buildFeed is done
	// use event emitters to handle exit
}

main()

// UTILITIES

function getRandIntInclusive(min, max) {
	min = Math.ceil(min)
	max = Math.floor(max)
	return Math.floor(Math.random() * (max - min + 1) + min) //The maximum is inclusive and the minimum is inclusive
}

// https://stackoverflow.com/a/12646864/12531621
function shuffleArray(array) {
	for (var i = array.length - 1; i > 0; i--) {
		var j = Math.floor(Math.random() * (i + 1))
		var temp = array[i]
		array[i] = array[j]
		array[j] = temp
	}
}
