let mockedDB = null;

const mockDynamoDB = class DynamoDB {
  constructor() {
    if (mockedDB !== null) {
      throw new Error('More than one database initialization attempt');
    }
    mockedDB = this;
  }

  createTable(params, callback) {
    this.createParams = params;
    if (this.mockError) {
      callback(this.mockError);
    } else {
      callback(null);
    }
  }
};

mockDynamoDB.DocumentClient = jest.fn();

const AWS = {
  config: {
    update: jest.fn(),
  },
  DynamoDB: mockDynamoDB,
};

AWS.getMockedDB = () => mockedDB;
AWS.getCreateParams = () => mockedDB.createParams;

module.exports = AWS;
