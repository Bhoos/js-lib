const PKEY = '#__PKEY__';
const PVALUE = ':__PVALUE__';

export default function generateQuery(DB, tableName, key) {
  return (primaryKey, sortCondition, attributes, filter, names, values) => {
    const attributeNames = {
      [PKEY]: key.primary,
    };

    const attributeValues = {
      [PVALUE]: primaryKey,
    };

    // Convert given attributes to projection expression
    const projection = attributes.split(/\s*,\s*/).map((name) => {
      // Use as is if the name starts with '#'
      if (name[0] === '#') {
        return name;
      }

      const hashed = `#${name}`;
      attributeNames[hashed] = name;
      return hashed;
    }).join(',');

    const keyCondition = `${PKEY} = ${PVALUE} ${(sortCondition ? ` AND ${sortCondition}` : '')}`;

    // The names overrides the automatically generated pounded names
    if (names) {
      Object.keys(names).reduce((res, name) => {
        res[`#${name}`] = names[name];
        return res;
      }, attributeNames);
    }

    if (values) {
      Object.keys(values).reduce((res, name) => {
        res[`:${name}`] = values[name];
        return res;
      }, attributeValues);
    }

    const params = {
      TableName: tableName,
      ProjectionExpression: projection,
      KeyConditionExpression: keyCondition,
      FilterExpression: filter,
      ExpressionAttributeNames: attributeNames,
      ExpressionAttributeValues: attributeValues,
    };

    return new Promise((resolve, reject) => {
      DB.query(params, (err, data) => {
        if (err) {
          return reject(err);
        }

        return resolve(data.Items);
      });
    });
  };
}
