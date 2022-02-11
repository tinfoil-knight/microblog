const faker = require('faker') // eslint-disable-line node/no-unpublished-require

const { User, Post, Like, Follow } = require('../models')
const { createHash } = require('./auth')
const { connectToDb } = require('./db')
const { MONGODB_URI } = require('./config')

const mongoDbCleanup = async () => {
	await Promise.all([
		User.deleteMany({}),
		Post.deleteMany({}),
		Like.deleteMany({}),
		Follow.deleteMany({}),
	])
}

const mongoDbConnect = async () => {
	await connectToDb(MONGODB_URI)
}

const getMockUserData = () => {
	const user = {
		username: faker.internet.userName(),
		email: faker.internet.email(),
		password: faker.internet.password(),
	}
	return user
}

const createUser = async () => {
	const { username, email, password } = getMockUserData()
	const passwordHash = createHash(password)
	const user = await User.create({
		username,
		email,
		passwordHash,
	})
	return user
}

module.exports = {
	mongoDbCleanup,
	mongoDbConnect,
	getMockUserData,
	createUser,
}
