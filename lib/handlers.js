/**
  * Request handlers.
  *
  * Author: Leonardo Da Costa
  * Date: 09/05/18
  * License: MIT
  *
  **/

// Dependencies
const _data   = require('./data'),
      helpers = require('./helpers');

// Define the handlers
let handlers = {};

// Users handler
handlers.users = function (data, callback) {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];

  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for the users submethods
handlers._users = {};

// Users - POST
// Required data: firstName, lastName, phone, password, tosAgreement
handlers._users.post = function (data, callback) {
  // Check that all required fields are filled out
  const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  const tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

  if (firstName && lastName && phone && password && tosAgreement) {
    // Make sure that the user doesnt already exist
    _data.read('users', phone, (e, data) => {
      if (e) {
        // Hash the password
        const hashedPassword = helpers.hash(password);

        // Create the user object
        let userObject = {
          'firstName': firstName,
          'lastName': lastName,
          'phone': phone,
          'hashedPassword': hashedPassword,
          'tosAgreement': tosAgreement
        };

        // Store the user
        _data.create('users', phone, userObject, e => {
          if (!e) {
            callback(200);
          } else {
            console.log(e);
            callback(500, { 'Error': 'Could not create the new user.'});
          }
        });
      } else {
        // User already exists
        callback(400, {'Error': 'A user with that phone number already exists.'});
      }
    });
  } else {
    callback(400, { 'Error': 'Missing required fields.' });
  }
};

// Users - GET
// Required data: phone
// Optional data: none
// @TODO Only let an authenticated user access their object. Don't let them access anyone elses.
handlers._users.get = function (data, callback) {
  // Check that the phone number is valid
  const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;

  if (phone) {
    // Lookup the user
    _data.read('users', phone, (e, data) => {
      if (!e && data) {
        // Remove the hashed password from the user obejct before returning it to the request
        delete data.hashedPassword;
        callback(200, data);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { 'Error': 'Missing required field.' });
  }
};

// Users - PUT
// Required data: phone
// Optional data: firstName, lastName, password (at least one mush be specified)
// @TODO Only let an authenticated user to update their own object, don't let them update anyone elses.
handlers._users.put = function (data, callback) {
  // Check for the required field
  const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

  // Check for the optional fields
  const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  // Error if the phone is invalid
  if (phone) {
    // Check if nothing is sent to update
    if (firstName || lastName || password) {
      // Lookup the user
      _data.read('users', phone, (e, userData) => {
        if (!e && userData) {
          // Update the fields necessary
          if (firstName) {
            userData.firstName = firstName;
          }
          if (lastName) {
            userData.lastName = lastName;
          }
          if (password) {
            userData.hashedPassword = helpers.hash(password);
          }

          // Store the new updates
          _data.update('users', phone, userData, e => {
            if (!e) {
              callback(200);
            } else {
              console.log(e);
              callback(500, { 'Error': 'Could not update the user.' });
            }
          });

        } else {
          callback(400, { 'Error': 'The specified user does not exist.' });
        }
      });
    }
  } else {
    callback(400, { 'Error': 'Missing required field.' });
  }

};

// Users - DELETE
// Required field: phone
// @TODO Only let an authenticated user to update their own object, don't let them update anyone elses.
// @TODO Cleanup (delete any other data files associated with this user)
handlers._users.delete = function (data, callback) {
  // Check that the phone number is valid
  const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;

  if (phone) {
    // Lookup the user
    _data.read('users', phone, (e, data) => {
      if (!e && data) {
        _data.delete('users', phone, e => {
          if (!e) {
            callback(200);
          } else {
            callback(500, { 'Error': 'Could not delete the specified user.' });
          }
        });
      } else {
        callback(400, { 'Error': 'Could not find the specified user.' });
      }
    });
  } else {
    callback(400, { 'Error': 'Missing required field.' });
  }
};

// Ping handler
handlers.ping = function (data, callback) {
  callback(200);
};

// Not found handler
handlers.notFound = function (data, callback) {
  callback(404);
};

// Export the module
module.exports = handlers;
