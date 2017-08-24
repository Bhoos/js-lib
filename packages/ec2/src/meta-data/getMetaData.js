const request = require('request');

export default function getMetaData(name) {
  return new Promise((resolve, reject) => {
    request.get(`http://169.254.169.254/latest/meta-data/${name}`, (err, response, body) => {
      if (err) {
        return reject(err);
      }

      return resolve(body);
    });
  });
}
