import Model from './Model';
import createTable from './createTable';
import Attribute from './Attribute';

const AWS = require('aws-sdk');

const REGION = process.env.AWS_REGION;

// use an endpoint if provided otherwise compute from the REGION string
// The endpoint needs to be provided only in case of local database (http://localhost:8000)
// otherwise the region based end points work pretty well
const ENDPOINT = process.env.AWS_DYNAMODB || `https://dynamodb.${REGION}.amazonaws.com`;

AWS.config.update({
  region: REGION,
});

const DB = new AWS.DynamoDB({
  apiVersion: '2012-08-10',
  endpoint: ENDPOINT,
});

const DynamoDB = new AWS.DynamoDB.DocumentClient({
  apiVersion: '2012-08-10',
  endpoint: ENDPOINT,
});

const generateModel = Model(DynamoDB);

const Key = {
  String(name) {
    return new Attribute('S', name);
  },
  Number(name) {
    return new Attribute('N', name);
  },
};

const DynamoDBExports = {
  createTable: createTable(DB),
  Key,
  generateModel,
};

module.exports = DynamoDBExports;
export default DynamoDBExports;
