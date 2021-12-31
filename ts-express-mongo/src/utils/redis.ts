declare function require(path: string): any;
const Redis = require('ioredis')

const redis = new Redis()

export default redis
