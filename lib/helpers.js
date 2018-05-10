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

// Create a string of random alphanumerical character, of a given length
helpers.createRandomString = function (strLength) {
  strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;

  if (strLength) {
    // Define all the possible characters that could go into a string
    const possibleCharacters = 'abcdefghijklomnpqrstuwxyz0123456789';

    // Start the final string
    let str = '';

    for (i = 1; i <= strLength; i++) {
      // Get a random character from the possibleCharacters string
      const randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
      // Append this character to the final string
      str += randomCharacter;
    }

    // Return the final string
    return str;
  } else {
    return false;
  }
};

// Export the module
module.exports = helpers;
