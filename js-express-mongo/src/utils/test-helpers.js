const { User, Post, Like, Follow } = require('../models')
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

module.exports = {
	mongoDbCleanup,
	mongoDbConnect,
}
