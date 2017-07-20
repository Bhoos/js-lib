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

let mockedDocClient = null;

mockDynamoDB.DocumentClient = class DocumentClient {
  constructor() {
    if (mockedDocClient !== null) {
      throw new Error('More than one DocumentClient initialization attempt');
    }
    mockedDocClient = this;

    this.mockError = null;
    this.lastParams = null;

    this.fn = (params, callback) => {
      this.lastParams = params;

      if (this.mockError) {
        callback(this.mockError);
        this.mockError = null;
      }

      callback(null, this.mockData);
      this.mockData = null;
    };

    this.get = this.fn;
    this.put = this.fn;
    this.update = this.fn;
    this.delete = this.fn;
    this.query = this.fn;
  }

  setResponse(data) {
    this.mockError = null;
    this.mockData = data;
  }

  setError(err) {
    this.mockData = null;
    this.mockError = err;
  }

  getParams() {
    return this.lastParams;
  }
};

const AWS = {
  config: {
    update: jest.fn(),
  },
  DynamoDB: mockDynamoDB,
};

AWS.getMockedDB = () => mockedDB;
AWS.getMockedDocClient = () => mockedDocClient;
AWS.getCreateParams = () => mockedDB.createParams;

module.exports = AWS;
