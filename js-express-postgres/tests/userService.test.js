const test = require('ava')
const faker = require('faker')
const jsonwebtoken = require('jsonwebtoken')

const { UserService } = require('../src/services')
const { getMockUserData, createUser } = require('../src/utils/test-helpers')

test.before(async () => {
	// connect to db
})

test.after.always('db cleanup', async () => {})

test('should sign-up user', async t => {
	const user = getMockUserData()
	await UserService.SignUp(user)
	const result = await User.findOne({ username: user.username }).lean()
	t.truthy(result)
	t.pass()
})

test('can update user email', async t => {
	const user = await createUser()
	const newMail = faker.internet.email()
	await UserService.UpdateMail(user._id, newMail)
	const result = await User.findById(user._id)
	t.is(result.email, newMail)
})

test('can get auth token with correct password', async t => {
	const userData = getMockUserData()
	const user = await createUser(userData)
	const token = await UserService.GetToken(user.username, userData.password)
	const decoded = jsonwebtoken.verify(token, process.env.TOKEN_SECRET)
	t.is(decoded.id, String(user._id))
})
