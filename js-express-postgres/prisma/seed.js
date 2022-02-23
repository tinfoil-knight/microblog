const { PrismaClient } = require('@prisma/client')
const faker = require('faker') // eslint-disable-line node/no-unpublished-require

const { createHash } = require('../src/utils/auth')

const prisma = new PrismaClient()

const NUM_USERS = 100
const MIN_POSTS_PER_USER = 10
const MAX_POSTS_PER_USER = 100

async function main() {
	await prisma.like.deleteMany({})
	await prisma.post.deleteMany({})
	await prisma.user.deleteMany({})

	console.log('creating users')
	const usersData = range(NUM_USERS).map(_ => {
		const password = faker.internet.password()

		const user = {
			email: faker.internet.email(),
			username: faker.internet.userName(),
			passwordHash: createHash(password),
		}
		console.log(user.username, password)
		return user
	})
	const userResult = await prisma.user.createMany({ data: usersData })
	console.log({ userResult })

	console.log('adding posts to users')
	const users = await prisma.user.findMany({ select: { id: true } })
	const userIds = users.map(x => x.id)
	let authorIds = userIds
		.map(id => {
			const rand = getRandIntInclusive(MIN_POSTS_PER_USER, MAX_POSTS_PER_USER)
			return Array(rand).fill(id)
		})
		.flat()
	shuffleArray(authorIds)
	const postsData = authorIds.map(id => ({
		content: faker.lorem.sentences(),
		authorId: id,
	}))
	const postResult = await prisma.post.createMany({ data: postsData })
	console.log({ postResult })

	console.log('adding likes to posts')
	const posts = await prisma.post.findMany({ select: { id: true } })
	const postIds = posts.map(x => x.id)
	const postsWithLikes = postIds
		.map(postId => {
			const numLikes = getRandIntInclusive(0, userIds.length)
			const idxs = getNRand(numLikes, 0, users.length - 1)
			const peopleWhoLiked = idxs.map(i => userIds[i])
			return peopleWhoLiked.map(id => ({
				userId: id,
				postId,
			}))
		})
		.flat()
	const likeResult = await prisma.like.createMany({ data: postsWithLikes })
	console.log({ likeResult })

	console.log('adding follows')
	await Promise.all(
		userIds.map(userId => {
			const n = getRandIntInclusive(0, userIds.length)
			const nums = getNRand(n, 0, userIds.length - 1)
			const followerIds = nums.map(i => userIds[i]).filter(x => x !== userId)
			return prisma.follow.createMany({
				data: followerIds.map(x => ({ followerId: x, followingId: userId })),
			})
		})
	)
	const followResult = await prisma.follow.count()
	console.log({ followResult })
}

main()
	.catch(e => {
		console.error(e)
		process.exit(1) // eslint-disable-line no-process-exit
	})
	.finally(async () => {
		await prisma.$disconnect()
	})

// UTILS

function range(num) {
	return [...Array(num).keys()]
}

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

// Will return n or less unique integers
function getNRand(n, min, max) {
	const randomList = (num, min, max) => {
		return [...Array(num).keys()].map(_ => getRandIntInclusive(min, max))
	}
	const nums = randomList(n, min, max)
	return [...new Set(nums)]
}
