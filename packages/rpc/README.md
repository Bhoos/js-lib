# RPC Library
A WebSocket based RPC library

# Installation
> `$ npm install --save @bhoos/rpc`

# Usage
The rpc library is based on the WebSocket but doesn't stick to a specific
WebSocket library. We recommend using https://github.com/websockets/ws 
for node (both client as well as server side) and the standard WebSocket 
available with the browser. But any WebSocket library could be used as 
long as they follow the standard.

# Example
## Server
```javascript
import RPC, { validator } from '@bhoos/rpc';

const WebSocket = require('ws');

// Your API signature (common for both client and server)
const apis = {
  getSomething() { 
    return {
      name: 'getSomething',
      args: [],
      res: validator.string(),
    }
  },
  doSomething() {
    return {
      name: 'doSomething',
      args: [validator.callback()],
    }
  },
}

// Your API implementations
const implementations = {
  getSomething() {
    return 'Something';
  },

  doSomething(callback) {
    callback('something done');
  },
}

// Create the server instance with the WebSocket server
const server = RPC.Server(WebSocket.Server);

// Bind the api with the implementations
server.bind(apis, implementations);

// Start the server at a TCP port
server.start(8080);
```

## Client
```javascript
import RPC from '@bhoos/rpc';

const WebSocket = require('ws');

const client = RPC.Client(WebSocket);
const api = client.bind(apis);

client.onClose = () => {
  // Event callback when a connection to the server is closed
  // This might be a good place to reattempt connection so
  // that the api is always available
}

client.onOpen = (err) => {
  // Event callback when a connection to the server is established
  // or an error occurs while trying to connect
  // This might be a good place to start initiate requests like registrations
}

client.connect('ws://<serverIp>:<port>');

export default api;
```

**A pratical example with reconnection attempts**

```javascript
import RPC from '@bhoos/rpc';

const WebSocket = require('ws');

const client = RPC.Client(WebSocket);
const api = client.bind(apis);

const connect = () => {
  const serverUrl = getServerUrl();
  client.connect(serverUrl);
}

client.onClose = () => {
  setTimeout(connect, 5000);
}

client.onOpen = (err) => {
  if (err) {
    // try to reconnect after some time
    setTimeout(connect, 1000);
    return;
  }

  // A connection has been established, may be perform a registration via the api
  api.register(() => {
    // Callback called via server
  });
}

// Try to connect
connect();

export default api;
```
