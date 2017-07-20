jest.mock('aws-sdk');

const mockedAWS = require('aws-sdk');
const { createTable, Key } = require('../src/');

describe('check if the params are set correctly', () => {
  test('create table with primary and sort key', () => (
    createTable('Book', Key.Number('isbn'), Key.String('author'), 10, 5).then((res) => {
      expect(res).toBe(true);
      // Make sure the params where set correctly
      const params = mockedAWS.getCreateParams();
      expect(params.TableName).toBe('Book');
      expect(params.AttributeDefinitions.length).toBe(2);
      expect(params.AttributeDefinitions[0]).toMatchObject({
        AttributeName: 'isbn',
        AttributeType: 'N',
      });
      expect(params.AttributeDefinitions[1]).toMatchObject({
        AttributeName: 'author',
        AttributeType: 'S',
      });
      expect(params.ProvisionedThroughput).toMatchObject({
        ReadCapacityUnits: 10,
        WriteCapacityUnits: 5,
      });
    })
  ));

  test('create table with single key', () => (
    createTable('Author', Key.String('name'), null, 5, 5).then((res) => {
      expect(res).toBe(true);

      const params = mockedAWS.getCreateParams();
      expect(params.TableName).toBe('Author');
      expect(params.AttributeDefinitions.length).toBe(1);
      expect(params.AttributeDefinitions[0]).toMatchObject({
        AttributeName: 'name',
        AttributeType: 'S',
      });
    })
  ));

  test('create table handling error', () => {
    mockedAWS.getMockedDB().mockError = 'Some Error';
    return createTable('Publisher', Key.String('name'), null, 10, 5).then(() => {
      throw new Error('Not expected to be called');
    }).catch((err) => {
      expect(err).toBe('Some Error');
      mockedAWS.getMockedDB().mockError = null;
    });
  });
});
