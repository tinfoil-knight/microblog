import jsontoken from 'jsonwebtoken'
import jwt from 'express-jwt'
import bcrypt from 'bcrypt'

const checkClientJwt = jwt({
	secret: process.env.TOKEN_SECRET || '',
	audience: process.env.LOCAL_AUDIENCE,
	algorithms: ['HS256'], // default for the jsonwebtoken pkg
	// requestProperty: 'user' default
})

const writeInfo = (req, _res, next) => {
	// Note: Potential Vulnerability
	if (req.user?.sub) {
		const id = req.user.sub.split('|')[1]
		req.id = id
	} else {
		req.id = undefined
	}
	next()
}

const createHash = async (string, saltRounds = 10) => {
	return bcrypt.hash(string, saltRounds, () => {})
}

const compareHash = async (plaintext, hash) => {
	return bcrypt.compare(plaintext, hash, () => {})
}

const createToken = (data, audience = process.env.LOCAL_AUDIENCE) => {
	return jsontoken.sign(data, process.env.TOKEN_SECRET, {
		expiresIn: '24h',
		audience,
		subject: `boilerplate|${data.id}`,
	})
}

const clientAuth = [checkClientJwt, writeInfo]

export { clientAuth, createHash, compareHash, createToken }
