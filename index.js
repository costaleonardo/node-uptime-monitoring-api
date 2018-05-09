/**
  * Uptime Monitoring RESTful API.
  *
  * Author: Leonardo Da Costa
  * Date: 09/05/18
  * License: MIT
  *
  **/

// Dependencies
const http = require('http');

// The server should responde to all requests with a string
const server = http.createServer((req, res) => {
  res.end('Hello World\n');
});

// Start the server, and have it listen on port 3000
server.listen(3000, () => {
  console.log('The server is listening on port 3000...');
});
