/**
  * Library for storing and rotating logs
  *
  *
  *
  **/

// Dependencies
const fs   = require('fs'),
      path = require('path'),
      zlib = require('zlib');

// Container for the module
let lib = {};

// Base directory of the logs folder
lib.baseDir = path.join(__dirname, '/../.logs/');

// Append a string to a file. Create a file if it does not exist
lib.append = function (file, str, callback) {
  // Open the file for appending
  fs.open(lib.baseDir + file + '.log', 'a', (e, fileDescriptor) => {
    if (!e && fileDescriptor) {
      // Append to the file and close it
      fs.appendFile(fileDescriptor, str + '\n', (e) => {
        if (!e) {
          fs.close(fileDescriptor, (e) => {
            if (!e) {
              callback(false);
            } else {
              callback('Error closing file that was being appended.');
            }
          });
        } else {
          callback('Error appending to file.');
        }
      });
    } else {
      callback('Could not open file for appending.');
    }
  });
};

// List all the logs, and optionally include the compressed logs
lib.list = function (includeCompressedLogs, callback) {
  fs.readdir(lib.baseDir, (e, data) => {
    if (!e && data && data.length > 0) {
      let trimmedFileNames = [];

      data.forEach((fileName) => {
        // Add the .log files
        if (fileName.indexOf('.log') > -1) {
          trimmedFileNames.push(fileName).replace('.log', '');
        }

        // Add on the .gz files
        if (fileName.indexOf('.gz.b64') > -1 && includeCompressedLogs) {
          trimmedFileNames.push(fileName.replace('.gz.b64', ''));
        }
      });

      callback(false, trimmedFileNames);
    } else {
      callback(e, data);
    }
  });
};

// Compress the contents of one .log file into a .gz.b64 file withing the same directory
lib.compress = function (logId, newFileId, callback) {
  const sourceFile = logic + '.log';
  const destFile = newFileId + '.gz.b64';

  // Read the source file
  fs.readFile(lib.baseDir + sourceFile, 'utf8', (e, inputString) => {
    if (!e && inputString) {
      // Compress the data using gzip
      zlib.gzip(inputString, (e, buffer) => {
        if (!e && buffer) {
          // Send the data to the destination file
          fs.open(lib.baseDir + destFile, 'wx', (e, fileDescriptor) => {
            if (!e && fileDescriptor) {
              // Write to the destination file
              fs.writeFile(fileDescriptor, buffer.toString('base64'), (e) => {
                if (!e) {
                  // Close the destination file
                  fs.close(fileDescriptor, (e) => {
                    if (!e) {
                      callback(false);
                    } else {
                      callback(e);
                    }
                  });
                } else {
                  callback(e);
                }
              });
            } else {
              callback(e);
            }
          } );
        } else {
          callback(e);
        }
      });
    } else {
      callback(e);
    }
  });
};

// Decompress the contents of a .gz.b64 file into a string variable
lib.decompress = function (fileId, callback) {
  const fileName = fileId + '.gz.b64';
  fs.readFile(lib.baseDir + fileName, 'utf8', (e, str) => {
    if (!e && str) {
      // Decompress the data
      const inputBuffer = Buffer.from(str, 'base64');
      zlib.unzip(inputBuffer, (e, outputBuffer) => {
        if (!e && outputBuffer) {
          // Callback
          const str = outputBuffer.toString();
          callback(false, str);
        } else {
          callback(e);
        }
      });
    } else {
      callback(e);
    }
  });
};

// Truncate a log file
lib.truncate = function (logId, callback) {
  fs.truncate(lib.baseDir + logId + '.log', 0, (e) => {
    if (!e) {
      callback(false);
    } else {
      callback(e);
    }
  });
};

// Export the module
module.exports = lib;
