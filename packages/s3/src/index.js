import getFactory from './get';
import putFactory from './put';

const AWS = require('aws-sdk');

const s3 = new AWS.S3();

const get = getFactory(s3);
const put = putFactory(s3);

const exports = {
  get, put,
};

module.exports = exports;
export default exports;
