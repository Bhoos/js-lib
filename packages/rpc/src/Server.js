import { ERROR, CALLBACK, REQUEST, RESPONSE, CALLBACK_VALIDATOR } from './constants';

export default function configureServer(WebSocketServer) {
  return {
    bind(apis, implementations) {
      this.apis = Object.keys(apis).reduce((res, apiName) => ({
        ...res,
        [apiName]: {
          fn: (...args) => implementations[apiName](...args),
          signature: apis[apiName](),
        },
      }), {});
    },

    start(port) {
      const wss = new WebSocketServer({ port });
      wss.on('connection', (ws) => {
        const sendError = (id, name, error) => {
          ws.send(JSON.stringify({
            id,
            name,
            type: ERROR,
            error,
          }));
        };

        const sendResponse = (id, name, response) => {
          ws.send(JSON.stringify({
            id,
            name,
            type: RESPONSE,
            res: response,
          }));
        };

        ws.on('message', (data) => {
          const msg = JSON.parse(data);
          if (msg.type === REQUEST) {
            const api = this.apis[msg.name];
            if (!api) {
              sendError(msg.id, msg.name, 'API not found on server');
              return;
            }

            const args = this.processArgs(msg.args, api, ws);
            // Execute the method
            Promise.resolve(api.fn.apply(null, args)).then((res) => {
              sendResponse(msg.id, msg.name, res);
            }).catch((err) => {
              sendError(msg.id, msg.name, err.message);
            });
          } else {
            sendError(msg.id, msg.name, `Server can't handle message of type ${msg.type}`);
          }
        });
      });

      return () => {
        wss.close();
      };
    },

    processArgs(args, api, ws) {
      return args.map((arg, index) => {
        const validator = api.signature.args[index];
        if (validator === CALLBACK_VALIDATOR) {
          return (...callbackArgs) => {
            ws.send(JSON.stringify({
              id: arg,
              type: CALLBACK,
              args: callbackArgs,
            }));
          };
        }

        return arg;
      });
    },
  };
}
