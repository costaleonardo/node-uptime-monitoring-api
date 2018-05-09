/**
  * Uptime Monitoring RESTful API.
  *
  * Author: Leonardo Da Costa
  * Date: 09/05/18
  * License: MIT
  *
  **/

// Dependencies
const http = require('http'),
      url  = require('url');

// The server should responde to all requests with a string
const server = http.createServer((req, res) => {
  // Get the URL and parse it
  const parsedUrl = url.parse(req.url, true);
  // Get the path
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // Send the response
  res.end('Hello World\n');
  // Log the request path
  console.log(`Request Recieved on path: ${trimmedPath}`);
});

// Start the server, and have it listen on port 3000
server.listen(3000, () => {
  console.log('The server is listening on port 3000...');
});
