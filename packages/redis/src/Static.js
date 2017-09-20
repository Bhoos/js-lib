export default function Static(client, className, name) {
  const key = `${className}::${name}`;
  return {
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
