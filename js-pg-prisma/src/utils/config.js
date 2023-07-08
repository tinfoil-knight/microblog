const PORT = process.env.PORT || 3030
const isProd = process.env.NODE_ENV === 'production'
const isDev = process.env.NODE_ENV === 'development'

module.exports = {
	PORT,
	isProd,
	isDev,
}
