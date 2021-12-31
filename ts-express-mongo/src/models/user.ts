import mongoose from 'mongoose'

interface IUser extends mongoose.Document {
	username: string
	email?: string
	passwordHash: string
}

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

export default mongoose.model<IUser>('User', userSchema)
