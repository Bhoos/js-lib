import RedisHelper from './RedisHelper';
import Iterator from './Iterator';

import transactionCreator from './Transaction';

const redis = require('redis');

const Key = (name, id) => `${name}:${id}`;
const Id = name => key => key.substring(name.length + 1);

class Redis {
  get(attr) {
    return this.attributes[attr];
  }

  set(attr, value) {
    this.attributes[attr] = value;
  }

  toJSON() {
    return Object.assign({}, this.attributes, { id: this.id });
  }
}

Redis.config = {
  host: 'localhost',
  port: 6379,
};

const update = (client, key, attributes) => () => client.transaction(
  (transaction, resolve, reject) => {
    transaction.hmset(key, attributes, (err) => {
      if (err) {
        return reject(err);
      }

      return resolve(true);
    });
  }, 'update');

const remove = (client, key, dependents) => () => client.transaction(
  (transaction, resolve, reject) => {
    // Remove all the dependent structures
    dependents.forEach(d => transaction.del(d));

    // Remove the main key
    transaction.del(key, (err) => {
      if (err) {
        return reject(err);
      }

      return resolve(true);
    });
  }, 'remove');

// TODO: Should be transaction
const increase = (client, key, attributes) => (field, increment = 1) => new Promise(
  (resolve, reject) => {
    client.hincrby(key, field, increment, (err, res) => {
      if (err) {
        return reject(err);
      }

      // eslint-disable-next-line no-param-reassign
      attributes[field] = res;
      return resolve(res);
    });
  });

const decrease = (client, key, attributes) => (field, increment = 1) => new Promise(
  (resolve, reject) => {
    client.hincrby(key, field, -increment, (err, res) => {
      if (err) {
        return reject(err);
      }

      // eslint-disable-next-line no-param-reassign
      attributes[field] = res;
      return resolve(res);
    });
  });

// renews the TTL for record and all its dependents
const renew = (client, key, dependents, ttl) => () => client.transaction(
  (transaction, resolve, reject) => {
    dependents.forEach(d => transaction.pexpire(d, ttl));
    transaction.pexpire(key, ttl, (err) => {
      if (err) {
        return reject(err);
      }

      return resolve(true);
    });
  }, 'renew');

function exists(client, key) {
  return new Promise((resolve) => {
    client.exists(key, (err, res) => {
      if (err) {
        throw err;
      }

      resolve(res > 0);
    });
  });
}

function watch(client) {
  return (keyProvider, watcher) => new Promise((resolve, reject) => {
    const key = keyProvider.key;
    client.watch(key, (err) => {
      if (err) {
        return reject(err);
      }

      // TODO: Do not perform a watch if already within a transaction

      // Watch was successful, time to run the transaction
      client.transaction(() => watcher(resolve), 'watch').catch((tErr) => {
        reject(tErr);
      });
    });
  });
}

function createObject(helper, client, key, id, attributes, ttl) {
  const expireAt = ttl > 0 ? (Date.now() + ttl) : 0;
  const obj = new helper.Class(id, attributes);

  obj.attributes = attributes;
  obj.t = attributes;
  obj.id = id;
  obj.key = key;

  const dependents = [];
  // Setup the data structures
  Object.keys(helper.children).forEach((name) => {
    const fieldKey = `${name}#${key}`;
    dependents.push(fieldKey);
    obj[name] = helper.children[name](client, fieldKey, expireAt);
  });

  obj.watch = watch(client);

  obj.remove = remove(client, key, dependents);
  obj.update = update(client, key, attributes);
  obj.increase = increase(client, key, attributes);
  obj.decrease = decrease(client, key, attributes);
  if (ttl > 0) {
    obj.renew = renew(client, key, dependents, ttl);
  }
  return obj;
}

function getObject(helper, client, key, id) {
  // TODO: Find a way to optimize this without using transactionq
  return new Promise((resolve, reject) => {
    client.type(key, (typeErr, type) => {
      if (typeErr) {
        return reject(typeErr);
      }
      if (type !== 'hash') {
        return resolve(null);
      }

      return client.pttl(key, (ttlErr, ttl) => {
        if (ttlErr) {
          return reject(ttlErr);
        }

        return client.hgetall(key, (err, res) => {
          if (err) {
            return reject(err);
          }

          return resolve(createObject(helper, client, key, id, res, ttl));
        });
      });
    });
  });
}

function bindClass(helper, client) {
  const Class = helper.Class;
  const classWatcher = watch(client);
  Class.exists = id => new Promise((resolve, reject) => {
    const key = Key(helper.getName(), id);
    client.type(key, (err, res) => {
      if (err) {
        return reject(err);
      }

      // considered exist only if the type of the object stored is 'hash'
      return resolve(res === 'hash');
    });
  });

  Class.get = async (id) => {
    const key = Key(helper.getName(), id);
    return getObject(helper, client, key, id);
  };

  Class.watch = (keyProvider, watcher) => {
    if (typeof keyProvider === 'string') {
      return classWatcher({ key: Key(helper.getName(), keyProvider) }, watcher);
    }

    return classWatcher(keyProvider, watcher);
  };

  Class.create = async (id, attributes) => {
    const key = Key(helper.getName(), id);
    if (await exists(client, key)) {
      throw new Error(`Record already exists ${key}`);
    }

    const obj = createObject(helper, client, key, id, attributes, helper.ttl);
    return client.transaction((transaction, resolve, reject) => {
      transaction.hmset(key, attributes, (err) => {
        if (err) {
          return reject(err);
        }

        return resolve(obj);
      });

      if (helper.ttl) {
        transaction.pexpire(key, helper.ttl);
      }
    }, 'create');

  Class.validate = async (id) => {
    const key = Key(helper.getName(), id);
    const obj = await getObject(helper, client, key, id);
    if (obj === null) {
      throw new Error(`${key} not found (Doesn't exist or is not a hash)`);
    }

    return obj;
  };

  Class.iterator = () => {
    const pattern = Key(helper.getName(), '*');
    const extractId = Id(helper.getName());

    return Iterator(client, pattern, extractId, Class.get);
  };

  Class.getAll = ids => client.transaction((transaction, resolve, reject) => {
    Promise.all(ids.map(id => new Promise((iResolve, iReject) => {
      const key = Key(helper.getName(), id);
      let ttl = null;
      transaction.pttl(key, (err, res) => {
        if (!err) {
          ttl = res;
        }
      });


      transaction.hgetall(key, (err, res) => {
        if (err) {
          return iReject(err);
        }

        iResolve(createObject(helper, client, key, id, res, ttl));
      });
    }))).catch((err) => {
      reject(err);
    }).then((res) => {
      resolve(res);
    });
  });
  }, 'getAll');

  return Class;
}


Redis.$ = (Class) => {
  if (Class instanceof RedisHelper) {
    return Class;
  }

  if (typeof Class !== 'function') {
    throw new Error(`Invalid Redis binding type ${Class}`);
  }

  // Make sure the class has been inherited
  if (!(Class.prototype instanceof Redis)) {
    throw new Error(`Redis bindings work only with class inherited from 'Redis'. Got ${Class.name}`);
  }

  return new RedisHelper(Class);
};

Redis.bind = (def) => {
  // First validate the classes that are being added in the definition
  const classes = Object.keys(def).map(name => Redis.$(def[name]).setName(name));

  // get the redis client
  const client = redis.createClient(Redis.config);

  client.transaction = transactionCreator(client);

  const res = {
    // Method to quit the binding (while closing application)
    quit: () => client.quit(),
    onConnect: () => {},
    onError: (err) => { console.error(err); },
  };

  // Generate all the classes
  classes.forEach((redisHelper) => {
    res[redisHelper.getClassName()] = bindClass(redisHelper, client);
  });

  // the bind is considered complete only when the redis client is connected
  client.on('ready', () => {
    res.onConnect();
  });

  client.on('error', (err) => {
    res.onError(err);
  });

  return res;
};

export default Redis;
