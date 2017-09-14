export default function (client, key, expireAt) {
  return {
    key,

    set: (field, value) => client.transaction((transaction, resolve, reject) => {
      transaction.hset(key, field, value, (err) => {
        if (err) {
          return reject(err);
        }

        return resolve(value);
      });

      if (expireAt) {
        transaction.pexpireat(key, expireAt);
      }
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

    setAll: obj => client.transaction((transaction, resolve, reject) => {
      transaction.hmset(key, obj, (err) => {
        if (err) {
          return reject(err);
        }

        return resolve(obj);
      });
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

    remove: field => client.transaction((transaction, resolve, reject) => {
      transaction.hdel(key, field, (err, res) => {
        if (err) {
          return reject(err);
        }

        return resolve(res);
      });
    }),

    increase: (field, increment = 1) => client.transaction((transaction, resolve, reject) => {
      transaction.hincrby(key, field, increment, (err, res) => {
        if (err) {
          return reject(err);
        }

        return resolve(res);
      });
    }),

    decrease: (field, factor = 1) => client.transaction((transaction, resolve, reject) => {
      transaction.hincrby(key, field, -factor, (err, res) => {
        if (err) {
          return reject(err);
        }

        return resolve(res);
      });
    }),
  };
}
