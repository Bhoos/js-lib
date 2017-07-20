export default function createTable(DB) {
  return (name, primary, sort = null, readUnits = 5, writeUnits = 1) => {
    const params = {
      TableName: name,
      AttributeDefinitions: [
        {
          AttributeName: primary.name,
          AttributeType: primary.type,
        },
      ],
      KeySchema: [
        {
          AttributeName: primary.name,
          KeyType: 'HASH',
        },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: readUnits,
        WriteCapacityUnits: writeUnits,
      },
    };

    if (sort) {
      params.AttributeDefinitions.push({
        AttributeName: sort.name,
        AttributeType: sort.type,
      });
      params.KeySchema.push({
        AttributeName: sort.name,
        KeyType: 'RANGE',
      });
    }

    // Execute the aws function via promise
    return new Promise((resolve, reject) => {
      DB.createTable(params, (err) => {
        if (err) {
          return reject(err);
        }

        return resolve(true);
      });
    });
  };
}
