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
	readonly _id: Schema.Types.ObjectId
	username: string
	email?: string
	passwordHash: string
	readonly createdAt: Date
	readonly updatedAt: Date
}

export default model<IUser, Model<IUser>>('User', userSchema)
