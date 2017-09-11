export default function (client, key, expireAt) {
  return {
    key,

    add: (...items) => new Promise((resolve, reject) => {
      const transaction = client.multi();
      transaction.scard(key);
      transaction.sadd(key, items);
      if (expireAt) {
        transaction.pexpireat(key, expireAt);
      }

      transaction.exec((err, res) => {
        if (err) {
          return reject(err);
        }

        // Return the total number of elements in the set
        return resolve(res[0] + res[1]);
      });
    }),

    size: () => new Promise((resolve, reject) => {
      client.scard(key, (err, res) => {
        if (err) {
          return reject(err);
        }

        return resolve(res);
      });
    }),

    remove: (...items) => new Promise((resolve, reject) => {
      client.srem(key, items, (err, res) => {
        if (err) {
          return reject(err);
        }

        return resolve(res);
      });
    }),

    contains: item => new Promise((resolve, reject) => {
      client.sismember(key, item, (err, res) => {
        if (err) {
          return reject(err);
        }

        return resolve(res === 1);
      });
    }),

    getAll: () => new Promise((resolve, reject) => {
      client.smembers(key, (err, res) => {
        if (err) {
          return reject(err);
        }

        return resolve(res);
      });
    }),

  };
}
