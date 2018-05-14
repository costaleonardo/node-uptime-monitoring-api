/**
  * Uptime Monitoring RESTful API.
  *
  * Author: Leonardo Da Costa
  * Date: 09/05/18
  * License: MIT
  *
  **/

// Dependencies
const server  = require('./lib/server'),
      workers = require('./lib/workers');

// Declare the app
let app = {};

// Init function
app.init = function () {
  // Start the server
  server.init();

  // Start the workers
  workers.init();
};

// Execute
app.init();

// Export the app
module.exports = app;
