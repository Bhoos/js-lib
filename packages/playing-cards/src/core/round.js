/**
 * Convert a floating point number to its integer part.
 * Only support 32bit integer value only at the moment
 * @param {*} number
 */
export default function round(number) {
  // eslint-disable-next-line no-bitwise
  return ~~number;
}
