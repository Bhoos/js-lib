jest.unmock('aws-sdk');

const { createTable, generateModel, Key } = require('../src/');

const dbServer = require('aws-db');

let shutDown = null;

const User = generateModel('User', 'id');
const Game = generateModel('Game', 'id');
const GameServer = generateModel('GameServer', 'game', 'instance');

beforeAll(() => {
  shutDown = dbServer();
});

afterAll(() => {
  shutDown();
});

// Test table creation specification
// Creating table requires just the name and the key specification
test('Create', () => Promise.all([
  createTable('User', Key.String('id')),
  createTable('Game', Key.String('id')),
  createTable('GameServer', Key.String('game'), Key.String('instance')),
]));

// Test the data insertion syntax, both with existing and non existing keys
test('Put', () => Promise.all([
  User.put({
    id: 'u1',
    name: 'John Doe',
    version: 1,
  }),
  Game.put({
    id: 'MRG',
    name: 'Marriage P',
    ami: 'ami-another',
    version: 1,
  }),
  GameServer.put({
    game: 'MRG',
    instance: '1',
    ip: '192.168.0.1',
  }),
  GameServer.put({
    game: 'MRG',
    instance: '2',
    ip: '192.168.0.2',
  }),
]));

test('Put fails for same key', () => {
  return Game.put({
    id: 'MRG',
    name: 'Not important',
  }).then(() => {
    throw new Error('Not expected to be called');
  }).catch((err) => {
    expect(err.code).toBe('ConditionalCheckFailedException');
  });
});

test('Get', () => Promise.all([
  User.get('id, name, version', 'u1').then((res) => {
    expect(res).toMatchObject({ id: 'u1', name: 'John Doe', version: 1 });
  }),
  Game.get('id, name, ami, version', 'MRG').then((res) => {
    expect(res).toMatchObject({ id: 'MRG', name: 'Marriage P', ami: 'ami-another', version: 1 });
  }),
  GameServer.get('ip', 'MRG', '2').then((res) => {
    expect(res).toMatchObject({ ip: '192.168.0.2' });
  }),
]));

test('Simple Update', () => Promise.all([
  // A simple set with a mapped object
  User.update('SET marriage=:data', null, null, {
    data: { chips: 0, coins: 0 },
  }, 'u1').then(() => User.get('marriage', 'u1')).then((user) => {
    expect(user.marriage).toMatchObject({ chips: 0, coins: 0 });
  }),
]));

test('Conditional Update Success', () => Promise.all([
  // A conditional set with success
  User.update('SET marriage=:data, version=:version', 'version=:old', null, {
    data: { chips: 2500, coins: 0 },
    version: 2,
    old: 1,
  }, 'u1').then((updateRes) => {
    expect(updateRes).toBeTruthy();
    return User.get('marriage, version', 'u1');
  }).then((user) => {
    expect(user.marriage).toMatchObject({ chips: 2500, coins: 0 });
    expect(user.version).toBe(2);
  }),
]));

test('Conditional Update Failure', () => Promise.all([
  // A condition set with failure
  Game.update('SET version=:version', 'version=:old', null, {
    version: 3,
    old: 2,
  }, 'MRG').then((res) => {
    expect(res).toBe(false);
    return Game.get('version', 'MRG');
  }).then((game) => {
    expect(game.version).toBe(1);
  }),
]));

test('Conditional Update with Increment', () => Promise.all([
  Game.update('SET #version=#version+:incr', '#version=:old',
    { version: 'version' }, { old: 1, incr: 1 }, 'MRG'
  ).then((res) => {
    expect(res).toBeTruthy();
    return Game.get('version', 'MRG');
  }).then((game) => {
    expect(game.version).toBe(2);
  }),
]));

test('Query with pimary key only', () => Promise.all([
  Game.query('MRG', null, 'id, #name, ami, version', null, { name: 'name' }).then((res) => {
    expect(res.length).toBe(1);
    expect(res[0]).toMatchObject({
      id: 'MRG', name: 'Marriage P', ami: 'ami-another', version: 2,
    });
  }),
]));

test('Query with sort key', () => Promise.all([
  GameServer.query('MRG', null, 'game, instance, ip').then((res) => {
    expect(res.length).toBe(2);
  }),
]));

test('Query with sort key condition', () => Promise.all([
  GameServer.query('MRG', 'instance > :tmp', 'game, instance, ip', null, null, { tmp: '1' }).then((res) => {
    expect(res.length).toBe(1);
    expect(res[0].instance).toBe('2');
  }),
]));

test('Query with sort key and filter condition', () => Promise.all([
  GameServer.query('MRG', null, 'instance', '#ip = :ip', { ip: 'ip' }, { ip: '192.168.0.2' }).then((res) => {
    expect(res.length).toBe(1);
  }),
]));

test('Delete', () => Promise.all([
  Game.delete('MRG'),
  GameServer.delete('MRG', '1'),
]).then(() => Game.get('id', 'MRG').then((res) => {
  expect(res).toBe(null);
})));
