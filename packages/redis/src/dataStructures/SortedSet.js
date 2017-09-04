export default function SortedSet(client, key, expireAt) {

  class Filter {
    constructor(reverse) {
      if (reverse) {
        this.command = client.zrevrangebyscore;
        this.min = Number.POSITIVE_INFINITY;
        this.max = Number.NEGATIVE_INFINITY;
      } else {
        this.command = client.zrevrangebyscore;
        this.min = Number.POSITIVE_INFINITY;
        this.max = Number.NEGATIVE_INFINITY;
      }
    }

    min(score, inclusive = true) {
      this.min = inclusive ? score : `(${score}`;
    }

    max(score, inclusive = true) {
      this.max = inclusive ? score : `(${score}`;
    }

    async get() {
      return new Promise((resolve, reject) => {
        this.command(key, this.min, this.max, (err, res) => {
          if (err) {
            return reject(err);
          }

          return resolve(res);
        });
      });
    }
  }

  return {
    add: (item, score) => new Promise((resolve, reject) => {
      const transaction = client.multi();
      transaction.zcard(key);
      transaction.zadd(key, score, item);
      if (expireAt) {
        transaction.expireat(key, expireAt);
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

        return resolve(res);
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
