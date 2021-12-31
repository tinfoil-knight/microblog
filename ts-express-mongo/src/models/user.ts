import { Document, Schema, Model, model } from 'mongoose'

const userSchema = new Schema(
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

export interface IUser extends Document {
	username: string
	email?: string
	passwordHash: string
	createdAt: Date
	updatedAt: Date
}

export default model<IUser, Model<IUser>>('User', userSchema)
