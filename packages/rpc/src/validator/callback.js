export const CALLBACK_VALIDATOR = value => typeof value !== 'function';

export default function validateCallback() {
  return CALLBACK_VALIDATOR;
}

