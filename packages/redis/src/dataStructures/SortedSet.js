export default function SortedSet(client, key, expireAt) {
  class Filter {
    constructor(reverse) {
      if (reverse) {
        this.command = client.zrevrangebyscore;
        this.minScore = Number.POSITIVE_INFINITY;
        this.maxScore = Number.NEGATIVE_INFINITY;
      } else {
        this.command = client.zrangebyscore;
        this.minScore = Number.NEGATIVE_INFINITY;
        this.maxScore = Number.POSITIVE_INFINITY;
      }
    }

    start(score, inclusive = true) {
      this.minScore = inclusive ? score : `(${score}`;
      return this;
    }

    end(score, inclusive = true) {
      this.maxScore = inclusive ? score : `(${score}`;
      return this;
    }

    async get() {
      return new Promise((resolve, reject) => {
        this.command.call(client, key, this.minScore, this.maxScore, (err, res) => {
          if (err) {
            return reject(err);
          }

          return resolve(res);
        });
      });
    }
  }

  return {
    key,

    add: (item, score) => new Promise((resolve, reject) => {
      const transaction = client.multi();
      transaction.zcard(key);
      transaction.zadd(key, score, item);
      if (expireAt) {
        transaction.pexpireat(key, expireAt);
      }

      transaction.exec((err, res) => {
        if (err) {
          return reject(err);
        }

        // Return the total number of items in the set
        return resolve(res[0] + res[1]);
      });
    }),

    size: () => new Promise((resolve, reject) => {
      client.zcard(key, (err, res) => {
        if (err) {
          return reject(err);
        }

        return resolve(res);
      });
    }),

    remove: item => new Promise((resolve, reject) => {
      client.zrem(key, item, (err, res) => {
        if (err) {
          return reject(err);
        }

        return resolve(res);
      });
    }),

    contains: item => new Promise((resolve, reject) => {
      client.zscore(key, item, (err, res) => {
        if (err) {
          return reject(err);
        }

        return resolve(res !== null);
      });
    }),

    getScore: item => new Promise((resolve, reject) => {
      client.zscore(key, item, (err, res) => {
        if (err) {
          return reject(err);
        }

        return resolve(parseFloat(res));
      });
    }),

    getAll: () => new Promise((resolve, reject) => {
      client.zrange(key, 0, -1, (err, res) => {
        if (err) {
          return reject(err);
        }

        return resolve(res);
      });
    }),

    filter: (reverse = false) => new Filter(reverse),
  };
}
