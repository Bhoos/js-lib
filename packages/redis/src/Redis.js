import RedisHelper from './RedisHelper';

const redis = require('redis');

const Key = (name, id) => `${name}:${id}`;

class Redis {
  get(attr) {
    return this.attributes[attr];
  }

  set(attr, value) {
    this.attributes[attr] = value;
  }

  toJSON() {
    return Object.assign({ id: this.id }, this.attributes);
  }
}

Redis.config = {
  host: 'localhost',
  port: 6379,
};

const update = (client, key, attributes) => () => new Promise((resolve, reject) => {
  client.hmset(key, attributes, (err) => {
    if (err) {
      return reject(err);
    }

    return resolve(true);
  });
});

const remove = (client, key, dependents) => () => new Promise((resolve, reject) => {
  const transaction = client.multi();
  transaction.del(key);
  dependents.forEach(d => transaction.del(d));
  transaction.exec((err) => {
    if (err) {
      return reject(err);
    }

    return resolve(true);
  });
});

// renews the TTL for record and all its dependents
const renew = (client, key, dependents, ttl) => () => new Promise((resolve, reject) => {
  const transaction = client.multi();
  transaction.pexpire(key, ttl);
  dependents.forEach(d => transaction.pexpire(d, ttl));
  transaction.exec((err) => {
    if (err) {
      return reject(err);
    }

    return resolve(true);
  });
});

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

function createObject(helper, client, key, id, attributes, ttl) {
  const expireAt = ttl > 0 ? (Date.now() + ttl) : 0;
  const obj = new helper.Class(id, attributes);

  obj.attributes = attributes;
  obj.id = id;

  const dependents = [];
  // Setup the data structures
  Object.keys(helper.children).forEach((name) => {
    const fieldKey = `${key}:${name}`;
    dependents.push(fieldKey);
    obj[name] = helper.children[name](client, fieldKey, expireAt);
  });

  obj.remove = remove(client, key, dependents);
  obj.update = update(client, key, attributes);
  if (ttl > 0) {
    obj.renew = renew(client, key, dependents, ttl);
  }
  return obj;
}

function bindClass(helper, client) {
  const Class = helper.Class;
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

  Class.get = id => new Promise((resolve, reject) => {
    const key = Key(helper.getName(), id);
    const transaction = client.multi();
    transaction.type(key);
    transaction.hgetall(key);
    transaction.exec((err, res) => {
      if (err) {
        return reject(err);
      }

      if (res[0] !== 'hash') {
        return resolve(null);
      }

      return resolve(createObject(helper, client, key, id, res[1], helper.ttl));
    });
  });

  Class.create = async (id, attributes) => {
    const key = Key(helper.getName(), id);
    if (await exists(client, key)) {
      throw new Error(`Record already exists ${key}`);
    }

    const obj = createObject(helper, client, key, id, attributes, helper.ttl);
    return new Promise((resolve, reject) => {
      const transaction = client.multi();
      transaction.hmset(key, attributes);
      if (helper.ttl) {
        transaction.pexpire(key, helper.ttl);
      }

      transaction.exec((err) => {
        if (err) {
          return reject(err);
        }

        return resolve(obj);
      });
    });
  };

  Class.validate = (id) => {
    const key = Key(helper.getName(), id);
    const transaction = client.multi();
    transaction.type(key);
    transaction.pttl(key);
    transaction.hgetall(key);

    return new Promise((resolve, reject) => {
      transaction.exec((err, res) => {
        if (err) {
          return reject(err);
        }

        if (res[0] !== 'hash') {
          return reject(new Error(`${key} is ${res[0]} (Doesn't exist or is not a hash)`));
        }

        return resolve(createObject(helper, client, key, id, res[2], res[1]));
      });
    });
  };

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
