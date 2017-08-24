export default function getFactory(s3) {
  return function get(bucket, key) {
    const params = {
      Bucket: bucket,
      Key: key,
    };

    return new Promise((resolve, reject) => {
      s3.getObject(params, (err, data) => {
        if (err) {
          return reject(err);
        }

        return resolve(data.Body);
      });
    });
  };
}
