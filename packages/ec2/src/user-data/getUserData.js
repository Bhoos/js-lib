const request = require('request');

export default function getUserData() {
  return new Promise((resolve, reject) => {
    request.get(`http://169.254.169.254/latest/user-data`, (err, response, body) => {
      if (err) {
        return reject(err);
      }

      return resolve(body);
    });
  });
}
