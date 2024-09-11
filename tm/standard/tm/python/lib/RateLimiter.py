from time import time
from time import sleep

class RateLimiterMemory:
    def __init__(self, points, duration):
        self.points = points
        self.duration = duration
        self.consumedPoints = 0

        self.msBeforeNext = duration * 1000

        self.prev_time = 0

    def consume(self, value, point = 1):
        if(self.prev_time != 0):
            passed = round((time() - self.prev_time) * 1000)
            # print('passed: ', passed)

            self.msBeforeNext -= passed

            if(self.msBeforeNext <= 0):
                self.msBeforeNext = self.duration * 1000
                self.consumedPoints = 0

        
        self.consumedPoints += point
        # print('msBeforeNext', self.msBeforeNext)
        # print('consumedPoints', self.consumedPoints)

        self.prev_time = time()

        if(self.consumedPoints <= self.points and self.msBeforeNext <= self.duration * 1000):
            print('success')
        else:
            # raise an exception
            pass



if __name__ == '__main__':
    rateLimiter = RateLimiterMemory(1, 1)

    print(rateLimiter)

    for i in range(0, 10):
        rateLimiter.consume('test')
        sleep(0.2)

