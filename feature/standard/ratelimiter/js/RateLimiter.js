


class RateLimiterError extends Error {
  constructor(res) {
    this.res = res
    super('Rejected')
  }
}

class PacketRes {
  constructor(config) {
    this.acquire = config.acquire
    this.until_next = config.until_next
    this.consumed = config.consumed
  }
}


class RateLimiter {
  constructor(limit, period, retry) {
    this.limit = limit
    this.period = period
    this.retry = retry


    // Limiter vars
    this.consumed = 0
    this.until_next = period * 1000
    this.prev_time = 0
  }

  tryAcquire(cost = 1) { // TODO: async
    if(this.prev_time != 0) {
      const passed = Date.now() - this.prev_time

      this.until_next -= passed


      if(this.until_next <= 0) {
        this.until_next = this.period * 1000
        this.consumed = 0
      }
    }

    this.consumed += cost

    this.prev_time = Date.now()

    if(this.consumed <= this.limit) {
      return new PacketRes({
        acquire: true,
        until_next: this.until_next,
        consumed: this.consumed
      })
    } else {
      return new PacketRes({
        acquire: false,
        until_next: this.until_next,
        consumed: this.consumed
      })
    }

  }

}

class RateLimiterInMemory {
  constructor(limit, period) {
    this.limit = limit
    this.period = period
    this.storage = {}
  }

  consume(limiter_key, cost = 1) {
    limiter = this.storage[key] || RateLimiter(this.limit, this.period, 10)
    this.storage[limiter_key] = limiter

    return limiter.tryAcquire(cost)
  }

  delete(limiter_key) {
    return delete this.storage[limiter_key]
  }


}

class QueueFullError extends Error {
  constructor(...args) {
    super(...args)
  }
}

class RetryExceededError extends Error {
  constructor(...args) {
    super(...args)
  }
}

class QueueItem {
  constructor(packet, cost, source) {
    this.packet = packet
    this.cost = cost
    this.source = source
  }
}

class RetryQueue {
  constructor(limiter, queue_max) {
    this.queue = [] // TODO: refactor actual deque
    this.limiter = limiter
    this.queue_max = queue_max
    this.max_retry = limiter.retry
  }

  async tryAcquire(cost, source) {
    const packet = this.limiter.tryAcquire(cost)

    if(packet.acquire) {
      return packet
    } else {
      if(this.queue.length >= this.queue_max) {
        throw new QueueFullError('Queue reached max')
      }
      this.queue.push(new QueueItem(packet, cost, source))

      return await this.retryFIFO(packet.until_next)
    }

  }

  async retryFIFO(wait) {
    let retry = 0

    while(this.queue.length != 0) {
      if(retry >= this.max_retry) {
        throw new RetryExceededError('Max Retry Number: ' + this.max_retry + ' exceeded')
      }
      await new Promise(resolve => setTimeout(resolve, wait))
      const item = this.queue.shift()
      const packet = this.limiter.tryAcquire(item.cost)

      if(packet.acquire) {
        return packet
      } else {
        this.queue.unshift(item)
        wait = packet.until_next
        retry += 1
      }


    }

  }

}



/*
;(async function main() {
  let rateLimiter = new RateLimiter(5, 1, 3)

  for(let i = 0; i < 11; i++) {
    let out = await rateLimiter.tryAcquire(1)
    console.log(out)
  }


  let queue = new RetryQueue(
    new RateLimiter(5, 10, 3), 20)

  for(let i = 0; i < 50; i++) {
    let out = await queue.tryAcquire(1, 'inner')
    console.log(out)
  }



})()
*/

module.exports = {
  RateLimiter, 
  RetryQueue
}
