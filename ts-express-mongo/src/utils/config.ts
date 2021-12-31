const PORT = process.env.PORT || 3030
const isProd = process.env.NODE_ENV === 'production'
const isDev = process.env.NODE_ENV === 'development'

const MONGODB_URI = process.env.MONGODB_URI

export { PORT, isProd, isDev, MONGODB_URI }
