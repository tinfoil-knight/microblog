import { Document, Schema, Model, model } from 'mongoose'

import { IUser } from './user'

const followSchema = new Schema(
	{
		follower: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'User',
			index: true,
		},
		following: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'User',
			index: true,
		},
	},
	{ timestamps: { createdAt: true, updatedAt: false } }
)

followSchema.index({ follower: 1, following: 1 }, { unique: true })

interface BaseFollow extends Document {
	readonly _id: Schema.Types.ObjectId
	readonly createdAt: Date
}

export interface IFollow extends BaseFollow {
	follower: IUser['_id']
	following: IUser['_id']
}

export interface IPFollow extends BaseFollow {
	follower: IUser
	following: IUser
}

export default model<IFollow, Model<IFollow>>('Follow', followSchema)
