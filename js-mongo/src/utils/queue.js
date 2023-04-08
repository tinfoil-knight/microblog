const kue = require('kue')

const { Follow } = require('../models')
const redis = require('./redis')

const q = kue.createQueue()

const MAX_ACTIVE_JOBS = 10 // use emitter.setMaxListeners() when increasing limit

q.process('fanout', MAX_ACTIVE_JOBS, function (job, done) {
	fanout(job.data, done)
})

const addJob = (jobName, data) => {
	const REMOVE_ON_COMPLETE = true // change to false for monitoring
	q.create(jobName, { title: Object.values(data).join('--'), ...data })
		.removeOnComplete(REMOVE_ON_COMPLETE)
		.save()
}

async function fanout(data, done) {
	const { authorId, postId } = data
	const followers = await Follow.find({ following: authorId })
		.select('follower -_id')
		.lean()
	const followerIds = followers.map(x => x.follower.toString())
	await Promise.all(
		followerIds.map(id => {
			redis.lpush(id, postId)
		})
	)
	done()
}

q.on('error', function (err) {
	console.log('REDIS:kue', err)
	if (err.code === 'ECONNREFUSED') {
		// eslint-disable-next-line no-process-exit
		process.exit(1)
	}
})

module.exports = {
	addJob,
}
