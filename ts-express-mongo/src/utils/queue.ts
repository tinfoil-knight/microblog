import kue from 'kue'

import { Follow, IFollow } from '../models'
import redis from './redis'

const q = kue.createQueue()

const MAX_ACTIVE_JOBS = 10 // use emitter.setMaxListeners() when increasing limit
interface FanoutPost {
	authorId: string
	postId: string
}

interface JobWithFanoutPost extends kue.Job {
	data: FanoutPost
}

// TODO: shift job's type annotation inline?
q.process(
	'fanout',
	MAX_ACTIVE_JOBS,
	function (job: JobWithFanoutPost, done: kue.JobCallback) {
		void fanout(job.data, done)
	}
)

const addJob = (jobName: string, data: Record<string, unknown>) => {
	const REMOVE_ON_COMPLETE = true // change to false for monitoring
	q.create(jobName, { title: Object.values(data).join('--'), ...data })
		.removeOnComplete(REMOVE_ON_COMPLETE)
		.save()
}

async function fanout(data: FanoutPost, done: kue.JobCallback) {
	const { authorId, postId } = data
	const followers: Pick<IFollow, 'follower'>[] = await Follow.find({
		following: authorId,
	})
		.select('follower -_id')
		.lean()
	const followerIds = followers.map(x => String(x.follower))
	await Promise.all(followerIds.map(id => redis.lpush(id, postId)))
	done()
}

export { addJob }
