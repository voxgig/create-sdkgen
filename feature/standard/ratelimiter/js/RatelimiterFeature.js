const { RateLimiter, RetryQueue } = require('./RateLimiter')

class RatelimiterFeature {
  constructor(client, config) {
    this.client = client
    this.config = config

    this.options = client.options.ratelimiter

    // TODO: default come from the config
    this.limiter = new RateLimiter(
      this.options.limit || config.option.limit.defval, 
      this.options.period || config.option.period.defval,
      this.options.retry || config.option.retry.defval)

    this.retryqueue = new RetryQueue(
      this.limiter, 
      this.options.queue_max || config.option.queueMax.defval)

    this.cost = this.options.cost || config.option.cost.defval

  }

  async tryAcquire() {
    let acquire = await this.retryqueue.tryAcquire(this.cost, 'ratelimiterfeature')

    if(this.options.debug) {
      // TODO: implement a logger
      console.log('RATE LIMITER', acquire)
    }

    return acquire
  }
}


module.exports = {
  RatelimiterFeature
}
