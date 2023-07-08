const { PrismaClient } = require('@prisma/client')
const faker = require('faker') // eslint-disable-line node/no-unpublished-require

const { createHash } = require('./auth')

const prisma = new PrismaClient()

const getMockUserData = () => {
	return {
		username: faker.internet.userName(),
		email: faker.internet.email(),
		password: faker.internet.password(),
	}
}

/**
 *
 * @param {Object} [data] If not provided mock data is generated and used
 * @param {Object} data.username
 * @param {Object} data.email
 * @param {Object} data.password
 * @returns {*} mongoose document
 */
const createUser = data => {
	const { username, email, password } = data || getMockUserData()
	const passwordHash = createHash(password)
	return prisma.user.create({
		username,
		email,
		passwordHash,
	})
}

module.exports = {
	getMockUserData,
	createUser,
}
