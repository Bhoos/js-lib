export default function List(client, key, expireAt) {
  return {
    add(item) {
      return new Promise((resolve, reject) => {
        client.rpush(key, item, (err, res) => {
          if (err) {
            return reject(err);
          }

          if (res === 1) {
            client.expireat(key, expireAt);
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
  };
}
