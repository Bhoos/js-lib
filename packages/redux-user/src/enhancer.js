import ActionTypes from './ActionTypes';

class Connector {

}

class ClientManager {
  addClient({ id }) {

  }
}

class Server {

  join(userId, clientStore) {
    return function userDispatch(action) {
      const userAction = userActions[action.type](userId);
      dispatch(userAction(action.payload));
    }
  }
}

const table = new LocalTable();
table.join(me, store);


function userServer(userActions) {
  return (createStore) => (reducer, preloadedState, enchancer) => {
    const store = createStore(reducer, preloadedState, enchancer);

    const dispatch = store.dispatch;
    const clientManager = {};

    return {
      ...store,

      dispatch: async (action) => {
        // If its a user action, search for a mapping and run it via that
        if (userActions[action.type]) {
          dispatch(userActions[action.type](action.user));
        } else {
          dispatch(action);
        }

        const result = dispatch(action);

        if (action.type === ActionTypes.JOIN) {
          clientManager.addClient(action.payload);
        } else if (action.type === ActionTypes.LEAVE) {
          clientManager.removeClient(action.payload);
        }

        // dispatch the action to all the clients
        clientManager.dispatch(action);

        // Save the actions for playing it back when a user joins in
        clientManager.save(action);
      }
    }
  }
}

export default function userClient() {
  return (createStore) => (reducer, preloadedState, enchancer) => {
    const store = createStore(reducer, preloadedState, enchancer);

    const dispatch = store.dispatch;
    const connector = new Connector();

    return {
      ...store,

      dispatch: async (action) => {
        if (action.type === ActionTypes.JOIN) {
          // Special command to connect with the server side store
          const serverDispatch = action.server;
        }

        if (action.server) {
          const res = await serverDispatch({
            type: action.type,
            client: dispatch,
            marker: action.marker,
          });
        }

        try {
          const centralAction = await connector.dispatch(action);
          dispatch(centralAction);
        } catch(err) {
          dispatch({
            type: CENTRAL_ERROR,
            payload: {
              message: err.message,
            },
          });
        }
      },
    }
  }
}

startGame() {
  dispatch(enableCaching());

}


export default userEnhancer;

const pickDeck = () => {
  // TODO: use deck to pick a card
  const card = '2H/1';

  return {
    type: 'PICK_DECK',
    payload: card,
  };
};

const pickDeck = (user) => ({
  type: 'PICK_DECK',
  payload: null,
});

const throwCard = card => ({
  type: 'THROW',
  payload: card,
});
