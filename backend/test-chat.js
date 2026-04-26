const http = require('http');

const testChatRequest = () => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      message: "hello"
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/ai/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(postData);
    req.end();
  });
};

testChatRequest()
  .then(result => {
    console.log('CHAT TEST SUCCESS:', result);
  })
  .catch(error => {
    console.log('CHAT TEST ERROR:', error.message);
  });
