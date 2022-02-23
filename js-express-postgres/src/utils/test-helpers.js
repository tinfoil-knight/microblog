const faker = require('faker') // eslint-disable-line node/no-unpublished-require

const { createHash } = require('./auth')

const getMockUserData = () => {
	const user = {
		username: faker.internet.userName(),
		email: faker.internet.email(),
		password: faker.internet.password(),
	}
	return user
}

/**
 *
 * @param {Object} [data] If not provided mock data is generated and used
 * @param {Object} data.username
 * @param {Object} data.email
 * @param {Object} data.password
 * @returns {*} mongoose document
 */
const createUser = async data => {
	const { username, email, password } = data || getMockUserData()
	const passwordHash = createHash(password)
	const user = await User.create({
		username,
		email,
		passwordHash,
	})
	return user
}

module.exports = {
	getMockUserData,
	createUser,
}
