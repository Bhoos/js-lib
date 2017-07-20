export default function generateUpdate(DB, tableName) {
  return (
    key, updateExpression,
    condition, names, values
  ) => new Promise((resolve, reject) => {
    const params = {
      TableName: tableName,
      Key: key,
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
}
