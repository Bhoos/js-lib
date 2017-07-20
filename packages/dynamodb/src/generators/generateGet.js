export default function generateGet(DB, tableName) {
  return (key, attributes) => {
    const params = {
      TableName: tableName,
      Key: key,
      AttributesToGet: attributes.split(/\s*,\s*/),
    };

    return new Promise((resolve, reject) => DB.get(params, (err, data) => {
      if (err) {
        return reject(err);
      }

      return resolve(data.Item || null);
    }));
  };
}
