import mongoose from 'mongoose'

const mongoOptions = {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	autoIndex: false,
}

const connectToDb = async (mongoUri: string) => {
	console.log(`mongoUri: ${mongoUri}`)
	try {
		await mongoose.connect(mongoUri, mongoOptions)
		console.log('connected to MongoDB')
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (err: any) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		console.log('error connecting to MongoDB:', err.message)
		console.log('shutting down the server')
		// eslint-disable-next-line
		process.exit(0)
	}
}

export { connectToDb }
