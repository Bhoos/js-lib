export default function generatePut(DB, tableName) {
  return (item) => {
    const params = {
      TableName: tableName,
      Item: item,
    };

    return new Promise((resolve, reject) => {
      DB.put(params, (err, data) => {
        if (err) {
          return reject(err);
        }

        return resolve(data.Attributes);
      });
    });
  };
}
