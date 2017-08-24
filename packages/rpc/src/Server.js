import { ERROR, CALLBACK, REQUEST, RESPONSE, CALLBACK_VALIDATOR } from './constants';

export default function configureServer(WebSocketServer) {
  return {
    bind(apis, implementations) {
      this.apis = Object.keys(apis).reduce((res, apiName) => {
        // Make sure there is an implementation
        const implementation = implementations[apiName];
        if (typeof implementation !== 'function') {
          throw new Error(`Implementation not found for api "${apiName}"`);
        }

        return {
          ...res,
          [apiName]: {
            fn: (...args) => implementation(...args),
            signature: apis[apiName](),
          },
        };
      }, {});
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

        const parseResponse = (data) => {
          try {
            const msg = JSON.parse(data);
            return msg;
          } catch (e) {
            sendError('', '', 'Invalid request data. Expected JSON');
            return false;
          }
        };

        ws.on('message', (data) => {
          const msg = parseResponse(data);
          if (msg !== false) {
            if (msg.type === REQUEST) {
              const api = this.apis[msg.name];
              if (!api) {
                sendError(msg.id, msg.name, 'API not found on server');
                return;
              }

              // Validate the arguments (It should either be nothing or an array)
              if (msg.args !== undefined && !Array.isArray(msg.args)) {
                sendError(msg.id, msg.name, 'Invalid argument');
                return;
              }

              // Process the arguments (specially for callbacks)
              const args = msg.args && this.processArgs(msg.args, api, ws);

              // Execute the method
              try {
                Promise.resolve(api.fn.apply(null, args)).then((res) => {
                  sendResponse(msg.id, msg.name, res);
                });
              } catch (err) {
                sendError(msg.id, msg.name, err.message);
              }
            } else {
              sendError(msg.id, msg.name, `Server can't handle message of type ${msg.type}`);
            }
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
