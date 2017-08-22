import { REQUEST, RESPONSE, ERROR, CALLBACK } from './constants';

const TIMEOUT = 5000;


export default function configureClient(WebSocket, timeout = TIMEOUT) {
  class Client {
    constructor() {
      this.uniqueId = 0;
      this.calls = {};
      this.callbacks = {};

      this.processArg = this.processArg.bind(this);
    }

    generateUniqueId() {
      this.uniqueId += 1;
      return this.uniqueId;
    }

    connect(endPoint, onOpen, onClose) {
      // If another socket is already connected
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }

      const ws = new WebSocket(endPoint);

      ws.on('open', () => {
        // Start with a clean slate
        this.calls = {};
        this.callbacks = {};
        this.ws = ws;
        onOpen();
      });

      ws.on('close', () => {
        this.ws = null;
        onClose();
      });

      ws.on('message', (data) => {
        const msg = JSON.parse(data);
        if (msg.type === RESPONSE) {
          this.resolve(msg.id, msg.res);
        } else if (msg.type === ERROR) {
          this.error(msg.id, msg.error);
        } else if (msg.type === CALLBACK) {
          const callback = this.callbacks[msg.id];
          callback(...msg.args);
        }
      });
    }

    call(name, args, validator, resolve, reject) {
      if (!this.ws) {
        throw new Error('Not connected to remote RPC server');
      }

      const id = this.generateUniqueId();

      const blob = {
        id,
        type: REQUEST,
        name,
        args: args.map(this.processArg),
      };

      this.calls[id] = {
        resolve,
        reject,
        timeout: setTimeout(() => {
          this.error(id, 'Response timed out');
        }, timeout),
      };

      this.ws.send(JSON.stringify(blob), (err) => {
        if (err) {
          this.error(id, err);
        }
      });
    }

    processArg(arg) {
      if (typeof arg === 'function') {
        const id = this.generateUniqueId();
        this.callbacks[id] = arg;
        return id;
      }

      return arg;
    }

    resolve(id, response) {
      if (this.calls[id]) {
        const call = this.calls[id];
        delete this.calls[id];
        call.resolve(response);
      }
    }

    error(id, err) {
      if (this.calls[id]) {
        const call = this.calls[id];
        delete this.calls[id];
        call.reject(err);
      }
    }
  }

  const client = new Client(WebSocket);

  return {
    bind(apis) {
      return Object.keys(apis).reduce((res, apiName) => {
        const validator = apis[apiName]();
        return {
          ...res,
          [apiName]: (...args) => new Promise((resolve, reject) => {
            client.call(apiName, args, validator, resolve, reject);
          }),
        };
      }, {});
    },

    connect(endPoint) {
      return client.connect(endPoint, this.onOpen, this.onClose);
    },
  };
}
