/**
  *
  *
  *
  *
  **/

// Dependencies
const path    = require('path'),
      fs      = require('fs'),
      _data   = require('./data'),
      https   = require('https'),
      http    = require('http'),
      helpers = require('./helpers'),
      url     = require('url'),
      _logs    = require('./logs');

// Instantiate the worker object
let workers = {};

// Lookup all checks, get their data, send to a validator
workers.gatherAllChecks = function () {
  // Get all the checks
  _data.list('checks', (e, checks) => {
    if (!e && checks && checks.length > 0) {
      checks.forEach((checks) => {
        // Read in the check data
        _data.read('checks', checks, (e, originalCheckData) => {
          if (!e && originalCheckData) {
            // Pass it to the check validator, and let that function continue
            workers.validateCheckData(originalCheckData);
          } else {
            console.log('Error reading one of the check\'s data.');
          }
        });
      });
    } else {
      console.log('Error: Could not find any checks to process.');
    }
  });
};

// Sanity-checking the check data
workers.validateCheckData = function (originalCheckData) {
  originalCheckData = typeof(originalCheckData) == 'object' && originalCheckData !== null ? originalCheckData : {};
  originalCheckData.id = typeof(originalCheckData.id) == 'string' && originalCheckData.id.trim().length == 10 ? originalCheckData.id.trim() : false ;
  originalCheckData.userPhone = typeof(originalCheckData.userPhone) == 'string' && originalCheckData.userPhone.trim().length == 10 ? originalCheckData.userPhone.trim() : false;
  originalCheckData.protocol = typeof(originalCheckData.protocol) == 'string' && ['http', 'https'].indexOf(originalCheckData.protocol) > -1 ?  originalCheckData.protocol : false;
  originalCheckData.url = typeof(originalCheckData.url) == 'string' && originalCheckData.url.trim().length > 0 ? originalCheckData.url.trim() : false;
  originalCheckData.method = typeof(originalCheckData.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(originalCheckData.method) > -1 ?  originalCheckData.method : false;
  originalCheckData.successCodes = typeof(originalCheckData.successCodes) == 'object' && originalCheckData.successCodes instanceof Array && originalCheckData.successCodes.length > 0 ? originalCheckData.successCodes : false;
  originalCheckData.timeoutSeconds = typeof(originalCheckData.timeoutSeconds) == 'number' && originalCheckData.timeoutSeconds % 1 === 0 && originalCheckData.timeoutSeconds >= 1 && originalCheckData.timeoutSeconds <= 5 ?  originalCheckData.timeoutSeconds : false;

  // Set the keys that may not be set (if the workers have never seen this check before)
  originalCheckData.state = typeof(originalCheckData.state) == 'string' && ['up', 'down'].indexOf(originalCheckData.state) > -1 ?  originalCheckData.state : 'down';
  originalCheckData.lastChecked = typeof(originalCheckData.lastChecked) == 'number' && originalCheckData.lastChecked > 0 ? originalCheckData.lastChecked : false;

  // If all the checks pass, pass the data along to the next step in the process
  if (originalCheckData.id &&
      originalCheckData.userPhone &&
      originalCheckData.protocol &&
      originalCheckData.url &&
      originalCheckData.method &&
      originalCheckData.successCodes &&
      originalCheckData.timeoutSeconds) {
    // Perform check
    worker.performCheck(originalCheckData);
  } else {
    console.log('Error: One of the checks is not properly formatted. Skipping it.');
  }
};

// Perform the check, send the originalCheckData and the outcome of the check process
workers.performCheck = function (originalCheckData) {
  // Prepare the initial check outcome
  let checkOutcome = {
    'error': false,
    'response': false
  };

  // Mark that the outcome has not been set yet
  let outcomeSent = false;

  // Parse the hostname and the path out of the original check data
  const parsedUrl = url.parse(originalCheckData.protocol + '://' + originalCheckData.url, true);
  const hostName = parsedUrl.hostName;
  const path = parsedUrl.path; // Using path and not "pathname" because we want the query string

  // Constructing the request
  let requestDetails = {
    'protocol': originalCheckData.protocol + ':',
    'hostname': hostName,
    'method': originalCheckData.method.toUpperCase(),
    'path': path,
    'timeout': originalCheckData.timeoutSeconds * 1000
  };

  // Instantiate the request obejct (using wither the http or https module)
  const _moduleToUse = originalCheckData.protocol == 'http' ? http : https;

  const req = _moduleToUse.request(requestDetails, (res) => {
    // Grab the status of the send request
    const status = res.statusCode;

    // Update the checkOutcome and pass the data along
    checkOutcome.responseCode = status;

    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  // Bind to the error event so it doesnt get thrown
  req.on('error', (e) => {
    // Update the checkOutcome and pass the data along
    checkOutcome.error = {
      'error': true,
      'value': e
    };

    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  // Bind to the timeout event
  req.on('timeout', (e) => {
    // Update the checkOutcome and pass the data along
    checkOutcome.error = {
      'error': true,
      'value': 'timeout'
    };

    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  // End the request
  req.end();
};

// Process the check outcome and update the check data as needed, trigger an alert to the user if needed
// Special logic for accomadting a check that has never been tested before
workers.processCheckOutcome = function (originalCheckData, checkOutcome) {
  // Decide if the check if considered up or down
  const state = !checkOutcome.error && checkOutcome.responseCode && checkOutcome.successCodes.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down';

  // Decide if an alert is warranted
  const alertWarrented = originalCheckData.lastChecked && originalCheckData.state !== state ? true : false;

  // Log the outcome of the check
  const timeOfCheck = Date.now();
  workers.log(originalCheckData, checkOutcome, state, alertWarrented, timeOfCheck);

  // Update the check data
  let newCheckData = originalCheckData;
  newCheckData.state = state;
  newCheckData.lastChecked = timeOfCheck;

  // Save the update
  _data.update('checks', newCheckData.id, newCheckData, (e) => {
    if (!e) {
      // Send the new check data to the next phase in the process if needed
      if (alertWarrented) {
        workers.alertUserToStatusChange(newCheckData);
      } else {
        console.log('Check outcome has not changed, no alert needed.');
      }
    } else {
      console.log('Error trying to save update to one of the checks.');
    }
  });
};

// Alert the user as to a change to their check status
workers.alertUserToStatusChange = function (newCheckData) {
  const msg = 'Alert: Your check for ' + newCheckData.method.toUpperCase() + newCheckData.protocol + '://' + newCheckData.url + ' is currently' + newCheckData.state;

  helpers.sendTwilioSms(newCheckData.userPhone, msg, (e) => {
    if (!e) {
      console.log('Success: User was alerted to a status change in their check via sms.', msg);
    } else {
      console.log('Error: Could not send sms alert to user who had a state change in their check.');
    }
  });
};

workers.log = function (originalCheckData, checkOutcome, state, alertWarrented, timeOfCheck) {
  // Form the log data
  let logData = {
    'check': originalCheckData,
    'outcome': checkOutcome,
    'state': state,
    'alert': alertWarrented,
    'time': timeOfCheck
  };

  // Convert data to a string
  const logString = JSON.stringify(logData);

  // Determine the name of the log file
  const logFileName = originalCheckData.id;

  // Append the log string to the file
  _logs.append(logFileName, logString, (e) => {
    if (!e) {
      console.log('Logging to file succeded');
    } else {
      console.log('Logging to file failed.');
    }
  });
};

// Timer to execute the worker-process once per minute
workers.loop = function () {
  setInterval(function () {
      workers.gatherAllChecks();
  }, 1000 * 60);
};

// Rotate (compress) the log files
workers.rotateLogs = function () {
  // List all the (non compressed log files)
  _logs.list(false, (e, logs) => {
    if (!e && logs && logs.length > 0) {
      logs.forEach((logName) => {
        // Compress the data to a different file
        const logId = logName.replace('.log', '');
        const newFileId = logId + '-' + Date.now();

        _logs.compress(logId, newFileId, (e) => {
            if (!e) {
              // Truncating the log
              _logs.truncate(logId, (e) => {
                if (!e) {
                  console.log('Success truncating logFile.');
                } else {
                  console.log('Error truncating logFile.');
                }
              });
            } else {
              console.log('Error compressing one of the log files', e);
            }
        });
      });
    } else {
      console.log('Error: Could not find any logs to rotate.');
    }
  });
};
workers.rotateLogs();

// Timer to execute the log-roration process once per day
workers.logRotationLoop = function () {
  setInterval(function () {
      workers.rotateLogs();
  }, 1000 * 60 * 60 * 24);
};

// Init script
workers.init = function () {
  // Execute all the checks immediately
  workers.gatherAllChecks();

  // Call the loop so the checks will execute later on
  workers.loop();

  // Compress all the logs immediately
  workers.rotateLogs();

  // Call the compression loop so logs will be compressed later on
  workers.logRotationLoop();
};

// Export the module
module.exports = workers;
