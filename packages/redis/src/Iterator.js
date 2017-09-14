const ERROR_ITER_SIZE = process.env.MAX_ITERATION_SIZE || 10000;

export default function Iterator(client, pattern, extractor, getObject) {
  let cursor = 0;
  let eol = false;
  let items = [];
  let itemPos = 0;
  let counter = 0;

  const next = () => new Promise((resolve, reject) => {
    if (eol && items.length === itemPos) {
      return resolve({ done: true });
    }

    if (itemPos < items.length) {
      const key = items[itemPos];
      return getObject(extractor(key)).then((value) => {
        itemPos += 1;
        counter += 1;
        if (counter >= ERROR_ITER_SIZE) {
          return reject(`Too many iterations - ${counter}. You can change this limit through MAX_ITERATION_SIZE environment variable.`);
        }

        return resolve({ value, done: false });
      });
    }

    return client.scan(cursor, 'MATCH', pattern, (err, res) => {
      if (err) {
        eol = true;
        return reject(err);
      }

      cursor = res[0];
      items = res[1];
      itemPos = 0;
      eol = cursor === '0';
      return resolve(next());
    });
  });

  let inProgress = false;
  return {
    next: async () => {
      if (inProgress) {
        throw new Error('Iteration is in progress. Cannot call next until the earlier call resolves');
      }

      inProgress = true;
      const res = await next();
      inProgress = false;
      return res;
    },

    all: async () => {
      const res = [];
      const run = () => next().then(({ value, done }) => {
        if (done) {
          return res;
        }

        res.push(value);
        return run();
      });

      return run();
    },
  };
}
