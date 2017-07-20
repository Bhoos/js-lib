export default function generateDelete(DB, tableName) {
  return key => new Promise((resolve, reject) => {
    const params = {
      TableName: tableName,
      Key: key,
    };

    DB.delete(params, (err, data) => {
      if (err) {
        return reject(err);
      }

      return resolve(data.Attributes);
    });
  });
}
