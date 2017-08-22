import RPC, { validator } from '../src';

const WebSocket = require('ws');

const apis = {
  add: () => ({
    name: 'add',
    args: [validator.number(), validator.number()],
    returns: validator.number(),
  }),

  addC: () => ({
    name: 'addC',
    args: [validator.number(), validator.number(), validator.callback()],
  }),
};

const implementations = {
  add: (a, b) => (a + b),
  addC: (a, b, callback) => {
    callback(a + b);
  },
};

const Server = RPC.Server(WebSocket.Server);
const Client = RPC.Client(WebSocket);

const api = Client.bind(apis);

Server.bind(apis, implementations);

Client.onClose = () => {
  // noop
};

let stop = null;
beforeAll(() => {
  // Start the server
  stop = Server.start(8080);

  // Make sure the client is connected
  return new Promise((resolve) => {
    Client.onOpen = () => {
      resolve();
    };
    Client.connect('ws://localhost:8080');
  });
});

afterAll(() => {
  stop();
});

test('Check remote calls', () => {
  return api.add(1, 5).then((res) => {
    expect(res).toBe(6);
  });
});

test('Check remote calls with callback', () => {
  return new Promise((resolve) => {
    api.addC(1, 5, (res) => {
      resolve(res);
    });
  }).then((res) => {
    expect(res).toBe(6);
  });
});
