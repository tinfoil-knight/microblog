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

export interface IPost extends Document {
	content: string
	createdAt: Date
	author: IUser['_id']
}

export interface IPPost extends IPost {
	author: IUser
}

export default model<IPost, Model<IPost>>('Post', postSchema)
