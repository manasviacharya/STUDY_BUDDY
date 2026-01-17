const http = require('http');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';

const verifySession = async (cookieHeader) => {
  return new Promise((resolve, reject) => {
    const url = new URL(USER_SERVICE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 3001,
      path: '/api/users/me',
      method: 'GET',
      headers: {
        'Cookie': cookieHeader || ''
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const user = JSON.parse(data).data;
            resolve(user);
          } catch (e) {
            reject(new Error('Invalid response'));
          }
        } else {
          reject(new Error('Unauthorized'));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.end();
  });
};

module.exports = { verifySession };

