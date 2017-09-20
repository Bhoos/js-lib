import Redis from '../src';

const redis = require('redis');
const { spawn } = require('child_process');

const PORT = 7777;

class SimpleCache extends Redis {}

class CacheWithList extends Redis {}

class CacheWithSet extends Redis {}

class CacheWithMap extends Redis {}

class CacheWithSortedSet extends Redis {}

class CacheWithAll extends Redis {}

class CacheWithStatic extends Redis {}

let Cache = null;
let server = null;
let direct = null;

beforeAll(() => new Promise((resolve) => {
  Redis.config.port = PORT;
  server = spawn('redis-server', ['--save', '', '--appendonly', 'no', '--port', PORT]);
  server.stdout.on('data', (data) => {
    // console.log(data.toString());
    // Use the text from the output to make sure server has started
    if (data.toString().indexOf(`The server is now ready to accept connections on port ${PORT}`) >= 0) {
      direct = redis.createClient({ port: PORT });
      Cache = Redis.bind({
        cache: SimpleCache,
        cacheWithList: Redis.$(CacheWithList).List('list'),
        cacheWithSet: Redis.$(CacheWithSet).Set('set'),
        cacheWithSortedSet: Redis.$(CacheWithSortedSet).SortedSet('sset'),
        cacheWithMap: Redis.$(CacheWithMap).Map('map'),
        cacheWithAll: Redis.$(CacheWithAll).List('list').SortedSet('sset').Set('set').Map('map').Map('map2').TTL(1000),
        cacheWithState: Redis.$(CacheWithStatic).Static('token').StaticMap('map'),
      });
      Cache.onConnect = () => {
        resolve();
      };
    }
  });
}));

afterAll(() => {
  direct.quit();
  Cache.quit();
  server.kill();
});

test('Check redis transaction return type', async () => {
  // Checking this to see how the errors are passed in multi commands
  direct.hmset('tmp-hash-1', 'f1', 'v1');
  direct.lpush('tmp-hash-2', '1');
  const t = direct.multi();
  return new Promise((resolve) => {
    t.hgetall('tmp-hash-1');
    t.hgetall('tmp-hash-2');
    t.exec((err, res) => {
      expect(res[0]).toMatchObject({ f1: 'v1' });
      expect(res[1]).toBeInstanceOf(Error);
      resolve(res);
    });
  });
});

test('Check Redis get', async () => {
  const obj = await SimpleCache.create('t', { name: 'Test' });
  expect(obj.toJSON()).toMatchObject({
    id: 't',
    name: 'Test',
  });

  expect(await SimpleCache.get('invalid')).toEqual(null);
  const t = await SimpleCache.get('t');
  expect(t.toJSON()).toMatchObject({
    id: 't',
    name: 'Test',
  });

  direct.lpush('cache:invalid', 'i', async (err, res) => {
    expect(res).toBe(1);
    const u = await SimpleCache.get('invalid');
    expect(u).toBe(null);
  });
});

test('Check Redis getAll', async () => {
  await SimpleCache.create('l1', { n: 1 });
  await SimpleCache.create('l2', { n: 2 });

  const res = await SimpleCache.getAll(['l1', 'l2']);
  expect(res.length).toBe(2);
  expect(res[0].toJSON()).toMatchObject({ id: 'l1', n: '1' });
  expect(res[1].toJSON()).toMatchObject({ id: 'l2', n: '2' });
});

test('Check Redis increase/decrease', async () => {
  const attrs = { v: 'v' };
  const obj = await SimpleCache.create('t1', attrs);

  return Promise.all([
    expect(obj.increase('counter', 2)).resolves.toBe(2),
    expect(obj.increase('counter')).resolves.toEqual(3),
    expect(obj.decrease('neg', 2)).resolves.toEqual(-2),
    expect(obj.decrease('neg')).resolves.toEqual(-3),
  ]).then(() => Promise.all([
    expect(obj.toJSON()).toMatchObject({ id: 't1', v: 'v', counter: 3, neg: -3 }),
  ]));
});

test('Check Redis basic functions', async () => {
  const obj = await Cache.SimpleCache.create('1', { name: 'Test' });
  expect(obj.toJSON()).toMatchObject({
    id: '1',
    name: 'Test',
  });

  obj.set('name', 'Changed Name');
  obj.set('eman', 'Reverse name');
  expect(obj.toJSON()).toMatchObject({
    id: '1',
    name: 'Changed Name',
    eman: 'Reverse name',
  });
  await obj.update();

  const v = await Cache.SimpleCache.validate('1');
  expect(v.toJSON()).toMatchObject({
    id: '1',
    name: 'Changed Name',
    eman: 'Reverse name',
  });
  expect(await obj.remove()).toBe(true);

});

test('Check Redis list', async () => {
  const obj = await Cache.CacheWithList.create('2', { name: 'list' });
  expect(obj.toJSON()).toMatchObject({ id: '2', name: 'list' });
  expect(await obj.list.add(2)).toEqual(1);
  expect(await obj.list.add(3)).toEqual(2);
  expect(await obj.list.getAll()).toEqual(['2', '3']);
  await obj.list.set(0, 'changed');
  expect(await obj.list.get(0)).toEqual('changed');
});

test('Check Redis map', async () => {
  const obj = await Cache.CacheWithMap.create('1', { name: 'map-test' });
  expect(obj.toJSON()).toMatchObject({ id: '1', name: 'map-test' });
  expect(await obj.map.set('f1', 'v1')).toEqual('v1');
  expect(await obj.map.get('f1')).toEqual('v1');
  expect(await obj.map.set('f2', 'v2')).toEqual('v2');
  expect(await obj.map.size()).toEqual(2);
  expect(await obj.map.keys()).toEqual(['f1', 'f2']);
  expect(await obj.map.values()).toEqual(['v1', 'v2']);
  expect(await obj.map.getAll()).toMatchObject({ f1: 'v1', f2: 'v2' });
  expect(await obj.map.remove('f1')).toEqual(1);
  expect(await obj.map.getAll()).toMatchObject({ f2: 'v2' });
  expect(await obj.map.increase('counter', 1)).toEqual(1);
  expect(await obj.map.increase('counter', 1)).toEqual(2);
  expect(await obj.map.getAll()).toMatchObject({ f2: 'v2', counter: '2' });
  expect(await obj.map.setAll({ f3: 'v3', f4: 'v4'})).toMatchObject({ f3: 'v3', f4: 'v4' });
  expect(await obj.map.getAll()).toMatchObject({ f2: 'v2', counter: '2', f3: 'v3', f4: 'v4' });
});

test('Check Redis set', async () => {
  const obj = await Cache.CacheWithSet.create('1', { name: 'set' });
  expect(obj.toJSON()).toMatchObject({ id: '1', name: 'set' });

  expect(await obj.set.add('one')).toEqual(1);
  expect(await obj.set.add('two')).toEqual(2);
  expect(await obj.set.add('one')).toEqual(2);

  const list = await obj.set.getAll();
  expect(list.length).toBe(2);
  expect(list).toContain('one');
  expect(list).toContain('two');

  expect(await obj.set.contains('two')).toEqual(true);
  expect(await obj.set.contains('three')).toEqual(false);
  expect(await obj.set.remove('one')).toEqual(1);
  expect(await obj.set.contains('one')).toEqual(false);
  expect(await obj.set.size()).toEqual(1);
});

test('Check Redis SortedSet', async () => {
  const obj = await Cache.CacheWithSortedSet.create('1', { name: 'sorted-set' });
  expect(obj.toJSON()).toMatchObject({ id: '1', name: 'sorted-set' });
  expect(await obj.sset.add('one', 1)).toEqual(1);
  expect(await obj.sset.add('two', 2)).toEqual(2);

  const list = await obj.sset.getAll();
  expect(list.length).toBe(2);
  expect(await obj.sset.contains('two')).toEqual(true);
  expect(await obj.sset.remove('one')).toEqual(1);
  expect(await obj.sset.contains('one')).toEqual(false);
  expect(await obj.sset.add('three', 3)).toEqual(2);
  expect(await obj.sset.getScore('two')).toEqual(2);

  const filter = obj.sset.filter();
  const filteredList = await filter.get();
  expect(filteredList).toContain('two');
  expect(filteredList).toContain('three');

  filter.start(3);
  const list2 = await filter.get();
  expect(list2.length).toBe(1);
  expect(list2).toContain('three');

  await obj.sset.add('four', 4);
  await obj.sset.add('five', 5);
  filter.end(5, false);
  const list3 = await filter.get();
  expect(list3.length).toBe(2);
  expect(list3).toEqual(['three', 'four']);

  filter.start(3, false).end(5);
  const list4 = await filter.get();
  expect(list4).toEqual(['four', 'five']);

  const rFilter = obj.sset.filter(true);
  expect(await rFilter.get()).toEqual(['five', 'four', 'three', 'two']);
  rFilter.start(5).end(3);
  expect(await rFilter.get()).toEqual(['five', 'four', 'three']);
  rFilter.start(5, false).end(3);
  expect(await rFilter.get()).toEqual(['four', 'three']);
  rFilter.start(5).end(3, false);
  expect(await rFilter.get()).toEqual(['five', 'four']);
});

function expectValidationError(res) {
  return res.then(() => {
    throw new Error('Result not expected');
  }).catch(err => (
    expect(err.message).toMatch(/Doesn't exist or is not a hash/)
  ));
}

async function runAfter(interval, action) {
  return new Promise((resolve) => {
    setTimeout(async () => {
      resolve(await action());
    }, interval);
  });
}

test('Check Redis with TTL', async () => {
  const obj = await Cache.CacheWithAll.create('1', { name: 'all' });
  await obj.list.add(1);
  await obj.set.add(1);
  await obj.set.add(2);
  await obj.sset.add('one', 1);
  await obj.sset.add('two', 2);
  await obj.map.set('f1', 1);
  await obj.map2.setAll({ f1: 1, f2: 2 });

  await runAfter(500, async () => {
    expect(await obj.list.size()).toEqual(1);
    expect(await obj.set.size()).toEqual(2);
    expect(await obj.sset.size()).toEqual(2);
    expect(await obj.map.size()).toEqual(1);
    expect(await obj.map2.size()).toEqual(2);
    expect(await Cache.CacheWithAll.validate('1')).toMatchObject({ id: '1' });
  });

  await runAfter(1000, async () => {
    expect(await obj.list.size()).toEqual(0);
    expect(await obj.set.size()).toEqual(0);
    expect(await obj.sset.size()).toEqual(0);
    expect(await obj.map.size()).toEqual(0);
    expect(await obj.map2.size()).toEqual(0);
    await expectValidationError(Cache.CacheWithAll.validate('1'));
  });
});

test('Check multiple addition', async () => {
  const obj = await Cache.CacheWithAll.create('t', { name: 'm' });
  expect(await obj.list.add(1, 2, 3)).toEqual(3);
  expect(await obj.set.add(1, 2, 3)).toEqual(3);
  expect(await obj.list.getAll()).toEqual(['1', '2', '3']);
  expect(await obj.set.remove(2, 3)).toEqual(2);
  expect(await obj.set.getAll()).toEqual(['1']);
});

test('Check iterator', async () => {
  await Cache.CacheWithAll.create('n1', { n: 1 });
  await Cache.CacheWithAll.create('n2', { n: 2 });
  await Cache.CacheWithAll.create('n3', { n: 2 });
  await Cache.CacheWithAll.create('n4', { n: 2 });
  await Cache.CacheWithAll.create('n5', { n: 2 });
  await Cache.CacheWithAll.create('n6', { n: 2 });
  await Cache.CacheWithAll.create('n7', { n: 2 });
  await Cache.CacheWithAll.create('n8', { n: 2 });

  const all = await Cache.CacheWithAll.iterator().all();
  expect(all.length).toBe(9);
});

test('Check watch success', async () => {
  const obj = await Cache.CacheWithAll.create('w0', { n: 'w0' });
  await obj.list.add('1');
  await obj.list.add('2');

  const watchRes = await obj.watch(obj.list, async (resolve) => {
    const size = await obj.list.size();
    expect(size).toBe(2);
    resolve(obj.list.add('3'));
  });

  expect(watchRes).toBe(3);
  expect(await obj.list.size()).toBe(3);
});

test('Check watch failure', async () => {
  const obj = await Cache.CacheWithAll.create('w1', { n: 'watch' });
  const listSizeBeforeWatch = await obj.list.size();
  async function breakWatch() {
    return new Promise((resolve, reject) => {
      direct.lpush(obj.list.key, 'direct_value', (err, res) => {
        if (err) {
          return reject(err);
        }

        return resolve(res);
      });
    });
  }

  const watchRes = await obj.watch(obj.list, async (resolve) => {
    await breakWatch();
    const size = await obj.list.size();
    expect(size).toBe(listSizeBeforeWatch + 1);
    resolve(obj.list.add('fail item'));
  });

  expect(watchRes).toBe(null);
  expect(await obj.list.size()).toBe(listSizeBeforeWatch + 1);
});

test('Check static values', async () => {
  const v = await Cache.CacheWithStatic.token.get();
  expect(v).toBe(null);
  await Cache.CacheWithStatic.token.set('something');
  expect(await Cache.CacheWithStatic.token.get()).toBe('something');
  await Cache.CacheWithStatic.token.set('10');
  expect(await Cache.CacheWithStatic.token.increase()).toBe(11);
  expect(await Cache.CacheWithStatic.token.increase(3)).toBe(14);
  expect(await Cache.CacheWithStatic.token.decrease()).toBe(13);
  expect(await Cache.CacheWithStatic.token.decrease(2)).toBe(11);
});

test('Check static with map', async () => {
  await Cache.CacheWithStatic.map.set('one', 1);
  await Cache.CacheWithStatic.map.set('two', 2);
  expect(await Cache.CacheWithStatic.map.getAll()).toMatchObject({
    one: '1',
    two: '2',
  });
});
// test('Check watch failture', async () => {
//   const obj = await Cache.CacheWithAll.create('w1', { n: 'watch' });

//   await obj.watch(obj.list);

//   const t1 = direct.multi();
//   t1.rpush(obj.list.key, 't1', (err, res) => {
//     console.log('After t1 push', res, err);
//   });
//   t1.exec((err, res) => {
//     console.log(res, err);
//   });

//   direct.watch(obj.list.key);
//   const t2 = direct.multi();
//   // obj.list.add('t-between');
//   t2.rpush(obj.list.key, 't2', (err, res) => {
//     console.log('After t2 push', res, err);
//   });
//   t2.sadd(obj.set.key, 't2', 't2', (err, res) => {
//     console.log('T2 set add', res, err);
//   });
//   t2.exec((err, res) => {
//     console.log(res, err);
//   });

//   const t3 = direct.multi();
//   t3.sadd('temp-key', '2');
//   t3.type('temp-key', (err, res) => {
//     console.log('Type', res, err);
//   });

//   t3.hgetall('temp-key', (err, res) => {
//     console.log('getall', res, err);
//   });

//   t3.exec((err, res) => {
//     console.log('exec', res, err);
//   });



//   return expect(obj.list.size()).resolves.toBe(2);
// });
