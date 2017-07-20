jest.mock('aws-sdk');

const { generateModel } = require('../src');
const mockedAWS = require('aws-sdk');

describe('check get/put/query/update/delete', () => {
  const Book = generateModel('Book', 'isbn');
  const Movies = generateModel('Movies', 'year', 'id');

  const mockedDoc = mockedAWS.getMockedDocClient();

  test('get params with single key', () => {
    mockedDoc.setResponse({ Item: null });
    return Book.get('title', 1234).then(() => {
      const params = mockedDoc.getParams();
      expect(params).toMatchObject({
        TableName: 'Book',
        Key: { isbn: 1234 },
        AttributesToGet: ['title'],
      });
    });
  });

  test('get params with multiple keys and multiple attributes', () => {
    mockedDoc.setResponse({ Item: 2 });
    return Movies.get('title, year', 2017, '12').then((res) => {
      expect(res).toBe(2);
      const params = mockedDoc.getParams();
      expect(params).toMatchObject({
        TableName: 'Movies',
        Key: { year: 2017, id: '12' },
        AttributesToGet: ['title', 'year'],
      });
    });
  });

  test('get handling error', () => {
    mockedDoc.setError('mock-error');
    return Book.get('isbn, author', 1234).then(() => {
      throw new Error('Not expected to be called');
    }).catch((err) => {
      expect(err).toBe('mock-error');
    });
  });

  test('get key error', () => {
    expect(() => Movies.get('year, title', 2017)).toThrow();
  });

  test('put params', () => {
    mockedDoc.setResponse(true);
    const item = { isbn: 1232, author: 'John Doe' };
    return Book.put(item).then((res) => {
      expect(res).toBe(true);
      const params = mockedDoc.getParams();
      expect(params).toMatchObject({
        TableName: 'Book',
        Item: item,
      });
    });
  });

  test('put handling error', () => {
    mockedDoc.setError('mock-error');
    const item = { isbn: 1232, author: 'John Doe' };
    return Book.put(item).then(() => {
      throw new Error('Not expected to be called');
    }).catch((err) => {
      expect(err).toBe('mock-error');
    });
  });

  test('update params', () => {
    mockedDoc.setResponse({});
    return Book.update('set price = :price', 'author = :author', null, { price: 10, author: 'John Doe' }, 1234).then((res) => {
      expect(res).toBe(true);
      const params = mockedDoc.getParams();
      expect(params).toMatchObject({
        TableName: 'Book',
        Key: { isbn: 1234 },
        UpdateExpression: 'set price = :price',
        ConditionExpression: 'author = :author',
        ExpressionAttributeValues: { ':price': 10, ':author': 'John Doe' },
      });
    });
  });

  test('update params with condition fail error', () => {
    mockedDoc.setError({ code: 'ConditionalCheckFailedException' });
    return Book.update('set price = :price', 'author = :author', null, { price: 10, author: 'John Doe' }, 1234).then((res) => {
      expect(res).toBe(false);
      const params = mockedDoc.getParams();
      expect(params).toMatchObject({
        TableName: 'Book',
        Key: { isbn: 1234 },
        UpdateExpression: 'set price = :price',
        ConditionExpression: 'author = :author',
        ExpressionAttributeValues: { ':price': 10, ':author': 'John Doe' },
      });
    });
  });

  test('update params with unexpected error', () => {
    mockedDoc.setError({ code: 'Unexpected - error' });
    Book.update('set price = :price', 'author = :author', null, { price: 10, author: 'John Doe' }, 1234).then(() => {
      throw new Error('Not expected to be called');
    }).catch((err) => {
      expect(err).toMatchObject({ code: 'Unexpected - error' });
      const params = mockedDoc.getParams();
      expect(params).toMatchObject({
        TableName: 'Book',
        Key: { isbn: 1234 },
        UpdateExpression: 'set price = :price',
        ConditionExpression: 'author = :author',
        ExpressionAttributeValues: { ':price': 10, ':author': 'John Doe' },
      });
    });
  });

  test('update key error', () => {
    expect(() => {
      Movies.update('', '', null, null, 1234);
    }).toThrow();
  });

  test('delete params', () => {
    mockedDoc.setResponse(true);
    return Book.delete(1234).then(() => {
      const params = mockedDoc.getParams();
      expect(params).toMatchObject({
        TableName: 'Book',
        Key: { isbn: 1234 },
      });
    });
  });

  test('delete params error', () => {
    mockedDoc.setError(true);
    return Book.delete(1234).then(() => {
      throw new Error('Not expected to be called');
    }).catch((err) => {
      expect(err).toBe(true);
    });
  });

  test('delete throws error', () => {
    expect(() => {
      Movies.delete(1234);
    }).toThrow();
  });

  test('query params', () => {
    mockedDoc.setResponse({});
    return Book.query(1234, '', 'title, isbn', null, null).then(() => {
      const params = mockedDoc.getParams();
      expect(params).toMatchObject({
        TableName: 'Book',
        KeyConditionExpression: '#__PKEY__ = :__PVALUE__',
        ProjectionExpression: '#title,#isbn',
        FilterExpression: null,
        ExpressionAttributeNames: { '#__PKEY__': 'isbn', '#title': 'title', '#isbn': 'isbn' },
        ExpressionAttributeValues: { ':__PVALUE__': 1234 },
      });
    });
  });

  test('query params error', () => {
    mockedDoc.setError('mock-error');
    return Book.query(1234, '', 'title, isbn', null, null).then(() => {
      throw new Error('Not expected to be called');
    }).catch((err) => {
      expect(err).toBe('mock-error');
    });
  });
});

