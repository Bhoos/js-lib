export default function (client, key, expireAt) {
  return {
    key,

    add: (...items) => client.transaction((transaction, resolve, reject) => {
      let previousSize = NaN;
      transaction.scard(key, (err, res) => {
        previousSize = parseInt(res, 10);
      });

      transaction.sadd(key, items, (err, res) => {
        if (err) {
          return reject(err);
        }
        return resolve(previousSize + parseInt(res, 10));
      });

      if (expireAt) {
        transaction.pexpireat(key, expireAt);
      }
    }),

    size: () => new Promise((resolve, reject) => {
      client.scard(key, (err, res) => {
        if (err) {
          return reject(err);
        }

        return resolve(res);
      });
    }),

    remove: (...items) => client.transaction((transaction, resolve, reject) => {
      transaction.srem(key, items, (err, res) => {
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
