/**
  *
  * Library for storing and editing data.
  *
  * Author: Leonardo Da Costa
  * Date: 08/05/18
  * License: MIT
  *
  **/

// Dependencies
const fs   = require('fs'),
      path = require('path'),
      helpers = require('./helpers');

// Container for the module (to be exported)
let lib = {};

// Base directory of the data folder
lib.baseDir = path.join(__dirname, '/../.data/');

// Write data to a file
lib.create = function (dir, file, data, callback) {
  // Open the file for writing
  fs.open(lib.baseDir + dir + '/' + file + '.json', 'wx', function (e, fileDescriptor) {
    if (!e && fileDescriptor) {
      // Convert data to string
      const stringData = JSON.stringify(data);

      // Write to file and close it
      fs.writeFile(fileDescriptor, stringData, function (e) {
        if (!e) {
          fs.close(fileDescriptor, e => {
            if (!e) {
              callback(false);
            } else {
              callback('Error closing new file.');
            }
          });
        } else {
          callback('Error writing to new file.');
        }
      });
    } else {
      callback('Could not create new file, it may already exist.');
    }
  });
};

// Read data from a file
lib.read = function (dir, file, callback) {
  fs.readFile(lib.baseDir+dir+'/'+file+'.json', 'utf8', (e, data) => {
    if (!e && data) {
      const parsedData = helpers.parseJsonToObject(data);
      callback(false, parsedData);
    } else {
      callback(e, data);
    }
  });
};

// Update data inside a file
lib.update = function (dir, file, data, callback) {
  // Open the file for writing
  fs.open(lib.baseDir + dir + '/' + file + '.json', 'r+', (e, fileDescriptor) => {
    if (!e && fileDescriptor) {
      // Convert data to string
      const stringData = JSON.stringify(data);

      // Truncate the file
      fs.truncate(fileDescriptor, e => {
        if (!e) {
          // Write to the file and close it
          fs.writeFile(fileDescriptor, stringData, e => {
            if (!e) {
              fs.close(fileDescriptor, e => {
                if (!e) {
                  callback(false);
                } else {
                  callback('Error closing existing file.');
                }
              });
            } else {
              callback('Error writing to existing file.');
            }
          });
        } else {
          callback('Error truncating file.');
        }
      });
    } else {
      callback('Coulrd not open the file for updating, it may no exist yet.');
    }
  });
};

// Delete a file
lib.delete = function (dir, file, callback) {
  // Unlink the file
  fs.unlink(lib.baseDir + dir + '/' + file + '.json', e => {
    if (!e) {
      callback(false);
    } else {
      callback('Error deleting file.');
    }
  });
}

// Export the module
module.exports = lib;
