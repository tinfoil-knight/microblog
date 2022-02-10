const faker = require('faker') // eslint-disable-line node/no-unpublished-require
const test = require('ava') // eslint-disable-line node/no-unpublished-require, node/no-missing-require
const { UserService } = require('../src/services')
const { User } = require('../src/models')

const { mongoDbCleanup, mongoDbConnect } = require('../src/utils/test-helpers')

test.before(async () => {
	await mongoDbConnect()
})

test.after.always('mongodb cleanup', () => {
	mongoDbCleanup()
})

test('should sign-up user', async t => {
	const username = faker.internet.userName()
	const user = {
		username,
		email: faker.internet.email(),
		password: faker.internet.password(),
	}
	await UserService.SignUp(user)
	const result = await User.findOne({ username }).lean()
	t.truthy(result)
	t.pass()
})
