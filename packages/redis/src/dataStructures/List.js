export default function List(client, key, expireAt) {
  return {
    key,

    add(...items) {
      return new Promise((resolve, reject) => {
        client.rpush(key, items, (err, res) => {
          if (err) {
            return reject(err);
          }

          if (res === 1 && expireAt > 0) {
            client.pexpireat(key, expireAt);
          }

          return resolve(res);
        });
      });
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
      return new Promise((resolve, reject) => {
        client.lset(key, index, value, (err, res) => {
          if (err) {
            return reject(err);
          }

          return resolve(res);
        });
      });
    },
  };
}
