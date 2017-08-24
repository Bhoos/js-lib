export default function putFactory(s3) {
  return function put(bucket, key, content) {
    const params = {
      Bucket: bucket,
      Key: key,
      Body: content,
    };

    return new Promise((resolve, reject) => {
      s3.putObject(params, (err) => {
        if (err) {
          return reject(err);
        }

        return resolve(content.toString());
      });
    });
  };
}
