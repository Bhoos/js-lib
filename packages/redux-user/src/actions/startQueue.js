import ActionTypes from '../ActionTypes';

export default function startQueue() {
  return ({
    type: ActionTypes.QUEUE,
  });
}