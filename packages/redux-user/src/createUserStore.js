import { createStore, combineReducers } from 'redux';

const createUserStore = (reducer, preloadedState, enchancer) => {
  const store = createStore(reducer, preloadedState, enchancer);

  const user = {};

  return {
    getState: store.getState,
    dispatch: async (action) => {
      if (!action.server) {
        return store.dispatch(action);
      }

        const transformedAction = user.dispatch(action);
      }

      store.dispatch(action);
    },
    connect: (userId, anotherStore) => {
      user.userId = userId;
      user.connectedStore = anotherStore;
    }
  }
};

const userStore = createUserStore();

userStore.connect(id, anotherStore);


// By some way intercept the action being sent
const action = '...action...';

if (action.remote) {
  // See if there is a remote end point available,
  if (action.local) {
    endPoint.dispatch(action);
    return action;
  }

  const newAction = await endPoint.dispatch(action);
  return newAction;
}

// deck is never available on client side
const pickDeck = (dispatch, getState, { deck }) => {
  const card = deck ? deck.pickCard() : null;

  dispatch({
    type: 'PICK_DECK',
    payload: { card },
  });
};

// The arrange action needs to be sent to the server,
// but no need to wait for the response
const arrange = () => ({
  type: 'ARRANGE',
  remote: true,
  local: true,
});


export default createUserStore;
