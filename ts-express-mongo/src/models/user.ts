import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
	{
		username: {
			type: String,
			required: true,
			unique: true,
			maxLength: 50,
			minLength: 3,
		},
		email: { type: String, required: true, unique: true, maxLength: 100 },
		passwordHash: { type: String, required: true, select: false },
	},
	{ timestamps: true }
)

export default mongoose.model('User', userSchema)
