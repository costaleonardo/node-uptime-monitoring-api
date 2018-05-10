/**
  * Helpers for various tasks.
  *
  * Author: Leonardo Da Costa
  * Date: 09/05/18
  * License: MIT
  *
  **/

// Dependencies
const crypto = require('crypto'),
      config = require('./config');

// Container for all the helpers
let helpers = {};

// Create a SHA256
helpers.hash = function (str) {
  if (typeof(str) == 'string' && str.length > 0) {
    const hash = crypto.createHmac('sha256', config.hashingSecret).update('str').digest('hex');

    return hash;
  } else {
    return false;
  }
};

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = function (str) {
  try {
    const obj = JSON.parse(str);

    return obj;
  } catch (e) {
    return {};
  }
};

// Export the module
module.exports = helpers;
