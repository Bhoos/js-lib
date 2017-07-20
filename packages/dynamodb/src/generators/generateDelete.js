const invariant = require('invariant');

export default function generateDelete(DB, tableName, key) {
  return (primaryValue, sortValue) => {
    const Key = {
      [key.primary]: primaryValue,
    };

    if (key.sort) {
      invariant(sortValue !== undefined, `Sort attribute has been defined for ${tableName} but not provided during delete`);
      Key[key.sort] = sortValue;
    }

    const params = {
      TableName: tableName,
      Key,
    };

    return new Promise((resolve, reject) => {
      DB.delete(params, (err) => {
        if (err) {
          return reject(err);
        }

        return resolve(true);
      });
    });
  };
}
