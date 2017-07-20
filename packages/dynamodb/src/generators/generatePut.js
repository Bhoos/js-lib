export default function generatePut(DB, tableName, key) {
  return (item) => {
    const params = {
      TableName: tableName,
      Item: item,
      ConditionExpression: `attribute_not_exists(${key.primary})`,
    };

    return new Promise((resolve, reject) => {
      DB.put(params, (err) => {
        if (err) {
          return reject(err);
        }

        return resolve(true);
      });
    });
  };
}
