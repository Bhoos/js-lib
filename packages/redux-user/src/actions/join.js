import ActionTypes from '../ActionTypes';

/**
 * Client side action for connecting a client side store
 * with the server side store.
 *
 * @param {*} userId
 * @param {*} dispatch
 */
export default function join(token, server) {
  return ({
    type: ActionTypes.JOIN,
    server,
    token,
  });
}
