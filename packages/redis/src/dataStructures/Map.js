export default function (client, key, expireAt) {
  return {
    set: (field, value) => new Promise((resolve, reject) => {
      const transaction = client.multi();
      transaction.hset(key, field, value);
      if (expireAt) {
        transaction.pexpireat(key, expireAt);
      }

      transaction.exec((err) => {
        if (err) {
          return reject(err);
        }

        return resolve(value);
      });
    }),

    get: field => new Promise((resolve, reject) => {
      client.hget(key, field, (err, res) => {
        if (err) {
          return reject(err);
        }

        return resolve(res);
      });
    }),

    size: () => new Promise((resolve, reject) => {
      client.hlen(key, (err, res) => {
        if (err) {
          return reject(err);
        }

        return resolve(res);
      });
    }),

    keys: () => new Promise((resolve, reject) => {
      client.hkeys(key, (err, res) => {
        if (err) {
          return reject(err);
        }

        return resolve(res);
      });
    }),

    values: () => new Promise((resolve, reject) => {
      client.hvals(key, (err, res) => {
        if (err) {
          return reject(err);
        }

        return resolve(res);
      });
    }),

    getAll: () => new Promise((resolve, reject) => {
      client.hgetall(key, (err, res) => {
        if (err) {
          return reject(err);
        }
        return resolve(res);
      });
    }),

    setAll: obj => new Promise((resolve, reject) => {
      const transaction = client.multi();
      transaction.hmset(key, obj);
      if (expireAt) {
        transaction.pexpireat(key, expireAt);
      }
      transaction.exec((err) => {
        if (err) {
          return reject(err);
        }

        return resolve(obj);
      });
    }),

    remove: field => new Promise((resolve, reject) => {
      client.hdel(key, field, (err, res) => {
        if (err) {
          return reject(err);
        }

        return resolve(res);
      });
    }),

    increase: (field, increment = 1) => new Promise((resolve, reject) => {
      client.hincrby(key, field, increment, (err, res) => {
        if (err) {
          return reject(err);
        }

        return resolve(res);
      });
    }),

    decrease: (field, factor = 1) => new Promise((resolve, reject) => {
      client.hincrby(key, field, -factor, (err, res) => {
        if (err) {
          return reject(err);
        }

        return resolve(res);
      });
    }),
  };
}
