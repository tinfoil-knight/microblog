import jsontoken, { JwtPayload } from 'jsonwebtoken'
import jwt from 'express-jwt'
import bcrypt from 'bcrypt'

import { NextFunction, Request, Response } from 'express'

const TOKEN_SECRET = process.env.TOKEN_SECRET!
const LOCAL_AUDIENCE = process.env.LOCAL_AUDIENCE!

const checkClientJwt = jwt({
	secret: TOKEN_SECRET,
	audience: LOCAL_AUDIENCE,
	algorithms: ['HS256'], // default for the jsonwebtoken pkg
	// requestProperty: 'user' default
})

const writeInfo = (req: Request, _res: Response, next: NextFunction) => {
	// Note: Potential Vulnerability
	if (req.user?.sub) {
		const id = req.user.sub.split('|')[1]
		req.id = id
	} else {
		req.id = undefined
	}
	next()
}

const createHash = async (plaintext: string, saltRounds = 10) => {
	// eslint-disable-next-line @typescript-eslint/await-thenable
	const hash = await bcrypt.hash(plaintext, saltRounds, () => {})
	return hash
}

const compareHash = async (plaintext: string, hash: string) => {
	// eslint-disable-next-line @typescript-eslint/await-thenable
	const result = await bcrypt.compare(plaintext, hash, () => {})
	return result
}

const createToken = (
	data: {
		id: string
	},
	audience = LOCAL_AUDIENCE
) => {
	return jsontoken.sign(data, TOKEN_SECRET, {
		expiresIn: '24h',
		audience,
		subject: `boilerplate|${data.id}`,
	})
}

const clientAuth = [checkClientJwt, writeInfo]

export { clientAuth, createHash, compareHash, createToken }

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Express {
		// eslint-disable-next-line @typescript-eslint/no-empty-interface
		interface User extends JwtPayload {}
		interface Request {
			id?: string | undefined
		}
	}
}
