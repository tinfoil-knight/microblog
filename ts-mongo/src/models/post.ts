import { Document, Schema, Model, model } from 'mongoose'

import { IUser } from './user'

const postSchema = new Schema(
	{
		content: { type: String, required: true },
		author: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'User',
		},
	},
	{ timestamps: { createdAt: true, updatedAt: false } }
)

interface BasePost extends Document {
	readonly createdAt: Date
	readonly _id: Schema.Types.ObjectId
	content: string
}

export interface IPost extends BasePost {
	author: IUser['_id']
}

export interface IPPost extends BasePost {
	author: IUser
}

export default model<IPost, Model<IPost>>('Post', postSchema)
