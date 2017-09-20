export default function (client, key, expireAt) {
  return {
    key,

    get() {
      return new Promise((resolve, reject) => {
        client.get(key, (err, res) => {
          if (err) {
            return reject(err);
          }

          return resolve(res);
        });
      });
    },

    set(value) {
      return client.transaction((transaction, resolve, reject) => {
        transaction.set(key, value, (err) => {
          if (err) {
            return reject(err);
          }

          return resolve(value);
        });

        if (expireAt) {
          transaction.pexpireat(key, expireAt);
        }
      });
    },

    clear() {
      return client.transaction((transaction, resolve, reject) => {
        transaction.del(key, (err) => {
          if (err) {
            return reject(err);
          }

          return resolve(true);
        });
      });
    },

    increase(increment = 1) {
      return client.transaction((transaction, resolve, reject) => {
        transaction.incrby(key, increment, (err, res) => {
          if (err) {
            return reject(err);
          }

          return resolve(res);
        });
      });
    },

    decrease(decrement = 1) {
      return client.transaction((transaction, resolve, reject) => {
        transaction.incrby(key, -decrement, (err, res) => {
          if (err) {
            return reject(err);
          }

          return resolve(res);
        });
      });
    },
  };
}
