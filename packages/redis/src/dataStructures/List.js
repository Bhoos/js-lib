export default function List(client, key, expireAt) {
  return {
    key,

    add(...items) {
      return client.transaction((transaction, resolve, reject) => {
        transaction.rpush(key, items, (err, res) => {
          if (err) {
            return reject(err);
          }

          return resolve(res);
        });

        if (expireAt > 0) {
          transaction.pexpireat(key, expireAt);
        }
      }, 'List::add');
    },

    size() {
      return new Promise((resolve, reject) => {
        client.llen(key, (err, res) => {
          if (err) {
            return reject(err);
          }

          return resolve(res);
        });
      });
    },

    getAll() {
      return new Promise((resolve, reject) => {
        client.lrange(key, 0, -1, (err, res) => {
          if (err) {
            return reject(err);
          }

          return resolve(res);
        });
      });
    },

    get(index) {
      return new Promise((resolve, reject) => {
        client.lindex(key, index, (err, res) => {
          if (err) {
            return reject(err);
          }

          return resolve(res);
        });
      });
    },

    set(index, value) {
      return client.transaction((transaction, resolve, reject) => {
        transaction.lset(key, index, value, (err, res) => {
          if (err) {
            return reject(err);
          }

          return resolve(res);
        });
      }, 'List::set');
    },
  };
}
