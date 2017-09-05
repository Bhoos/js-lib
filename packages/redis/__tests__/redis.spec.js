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

let Cache = null;
let server = null;
let direct = null;

beforeAll(() => new Promise((resolve) => {
  Redis.config.port = PORT;
  server = spawn('redis-server', ['--save', '', '--appendonly', 'no', '--port', PORT]);
  server.stdout.on('data', (data) => {
    console.log(data.toString());
    // Use the text from the output to make sure server has started
    if (data.toString().indexOf(`The server is now ready to accept connections on port ${PORT}`) >= 0) {
      direct = redis.createClient({ port: PORT });
      Cache = Redis.bind({
        cache: SimpleCache,
        cacheWithList: Redis.$(CacheWithList).List('list'),
        cacheWithSet: Redis.$(CacheWithSet).Set('set'),
        cacheWithSortedSet: Redis.$(CacheWithSortedSet).SortedSet('sset'),
        cacheWithMap: Redis.$(CacheWithMap).Map('map'),
        cacheWithAll: Redis.$(CacheWithAll).List('list').SortedSet('sset').Set('set').Map('map').TTL(1000),
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

test('Check Redis get', async () => {
  const obj = await SimpleCache.create('t', { name: 'Test' });
  expect(obj.toJSON()).toMatchObject({
    id: 't',
    name: 'Test',
  });

  expect(SimpleCache.get('invalid')).resolves.toEqual(null);
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
});

test('Check Redis list', async () => {
  const obj = await Cache.CacheWithList.create('2', { name: 'list' });
  expect(obj.toJSON()).toMatchObject({ id: '2', name: 'list' });
  expect(obj.list.add(2)).resolves.toEqual(1);
  expect(obj.list.add(3)).resolves.toEqual(2);
  expect(obj.list.getAll()).resolves.toEqual(['2', '3']);
  await obj.list.set(0, 'changed');
  expect(obj.list.get(0)).resolves.toEqual('changed');
});

test('Check Redis map', async () => {
  const obj = await Cache.CacheWithMap.create('1', { name: 'map-test' });
  return Promise.all([
    expect(obj.toJSON()).toMatchObject({ id: '1', name: 'map-test' }),
    expect(obj.map.set('f1', 'v1')).resolves.toEqual('v1'),
    expect(obj.map.get('f1')).resolves.toEqual('v1'),
    expect(obj.map.set('f2', 'v2')).resolves.toEqual('v2'),
    expect(obj.map.size()).resolves.toEqual(2),
    expect(obj.map.keys()).resolves.toEqual(['f1', 'f2']),
    expect(obj.map.values()).resolves.toEqual(['v1', 'v2']),
    expect(obj.map.getAll()).resolves.toMatchObject({ f1: 'v1', f2: 'v2' }),
    expect(obj.map.remove('f1')).resolves.toEqual(1),
    expect(obj.map.getAll()).resolves.toMatchObject({ f2: 'v2' }),
    expect(obj.map.increase('counter', 1)).resolves.toEqual(1),
    expect(obj.map.increase('counter', 1)).resolves.toEqual(2),
    expect(obj.map.getAll()).resolves.toMatchObject({ f2: 'v2', counter: '2' }),
  ]);
});

test('Check Redis set', async () => {
  const obj = await Cache.CacheWithSet.create('1', { name: 'set' });
  expect(obj.toJSON()).toMatchObject({ id: '1', name: 'set' });
  expect(obj.set.add('one')).resolves.toEqual(1);
  expect(obj.set.add('two')).resolves.toEqual(2);
  expect(obj.set.add('one')).resolves.toEqual(2);
  expect(obj.set.size()).resolves.toEqual(2);
  const list = await obj.set.getAll();
  expect(list.length).toBe(2);
  expect(list).toContain('one');
  expect(list).toContain('two');
  expect(obj.set.contains('two')).resolves.toEqual(true);
  expect(obj.set.contains('three')).resolves.toEqual(false);
  expect(obj.set.remove('one')).resolves.toEqual(1);
  expect(obj.set.size()).resolves.toEqual(1);
});

test('Check Redis SortedSet', async () => {
  const obj = await Cache.CacheWithSortedSet.create('1', { name: 'sorted-set' });
  expect(obj.toJSON()).toMatchObject({ id: '1', name: 'sorted-set' });
  expect(obj.sset.add('one', 1)).resolves.toEqual(1);
  expect(obj.sset.add('two', 2)).resolves.toEqual(2);
  const list = await obj.sset.getAll();
  expect(list.length).toBe(2);
  expect(obj.sset.contains('two')).resolves.toEqual(true);
  expect(obj.sset.remove('one')).resolves.toEqual(1);
  expect(obj.sset.contains('one')).resolves.toEqual(false);
  expect(obj.sset.add('three', 3)).resolves.toEqual(2);
  expect(obj.sset.getScore('two')).resolves.toEqual(2);

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
  expect(rFilter.get()).resolves.toEqual(['five', 'four', 'three', 'two']);
  rFilter.start(5).end(3);
  expect(rFilter.get()).resolves.toEqual(['five', 'four', 'three']);
  rFilter.start(5, false).end(3);
  expect(rFilter.get()).resolves.toEqual(['four', 'three']);
  rFilter.start(5).end(3, false);
  expect(rFilter.get()).resolves.toEqual(['five', 'four']);
});

function expectValidationError(res) {
  return res.then(() => {
    throw new Error('Result not expected');
  }).catch(err => (
    expect(err.message).toMatch(/Doesn't exist or is not a hash/)
  ));
}

test('Check Redis with TTL', async () => {
  const obj = await Cache.CacheWithAll.create('1', { name: 'all' });
  obj.list.add(1);
  obj.set.add(1);
  obj.set.add(2);
  obj.sset.add('one', 1);
  obj.sset.add('two', 2);
  obj.map.set('f1', 1);

  // Expect all values to exist before the TTL
  return Promise.all([
    new Promise((resolve) => {
      setTimeout(() => {
        resolve(Promise.all([
          expect(obj.list.size()).resolves.toEqual(1),
          expect(obj.set.size()).resolves.toEqual(2),
          expect(obj.sset.size()).resolves.toEqual(2),
          expect(obj.map.size()).resolves.toEqual(1),
          expect(Cache.CacheWithAll.validate('1')).resolves.toMatchObject({ id: '1' }),
        ]));
      }, 500);
    }),
    new Promise((resolve) => {
      setTimeout(() => {
        resolve(Promise.all([
          expect(obj.list.size()).resolves.toEqual(0),
          expect(obj.set.size()).resolves.toEqual(0),
          expect(obj.sset.size()).resolves.toEqual(0),
          expect(obj.map.size()).resolves.toEqual(0),
          expectValidationError(Cache.CacheWithAll.validate('1')),
        ]));
      }, 1000);
    }),
  ]);
});

