const invariant = require('invariant');

export default function generateGet(DB, tableName, key) {
  return (attributes, primaryValue, sortValue) => {
    const Key = {
      [key.primary]: primaryValue,
    };

    if (key.sort) {
      invariant(sortValue !== undefined, `Sort attribute has been defined for ${tableName} but not provided during get`);
      Key[key.sort] = sortValue;
    }

    const params = {
      TableName: tableName,
      Key,
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
