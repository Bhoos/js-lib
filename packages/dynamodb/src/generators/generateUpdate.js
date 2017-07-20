const invariant = require('invariant');

export default function generateUpdate(DB, tableName, key) {
  return (updateExpression, condition, names, values, primaryValue, sortValue) => {
    const Key = {
      [key.primary]: primaryValue,
    };

    if (key.sort) {
      invariant(sortValue !== undefined, `Sort attribute has been defined for ${tableName} but not provided during update`);
      Key[key.sort] = sortValue;
    }

    const params = {
      TableName: tableName,
      Key,
      UpdateExpression: updateExpression,
    };

    if (condition) {
      params.ConditionExpression = condition;
    }

    if (names) {
      params.ExpressionAttributeNames = Object.keys(names).reduce((res, name) => {
        res[`#${name}`] = names[name];
        return res;
      }, {});
    }

    if (values) {
      params.ExpressionAttributeValues = Object.keys(values).reduce((res, name) => {
        res[`:${name}`] = values[name];
        return res;
      }, {});
    }

    return new Promise((resolve, reject) => {
      DB.update(params, (err) => {
        if (err) {
          if (err.code === 'ConditionalCheckFailedException') {
            return resolve(false);
          }

          return reject(err);
        }

        return resolve(true);
      });
    });
  };
}
