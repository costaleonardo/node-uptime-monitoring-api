/**
  *
  * Create and export config variables
  *
  **/

// Container for all the environments
let environments = {};

// Staging (default) environment
environments.staging = {
  'port': 3000,
  "envName": 'staging'
};

// Production environment
environments.production = {
  'port': 5000,
  'envName': 'production'
};

// Determin which environment was passed as a command-line argument
const currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one the environment above, if not, default to stating
const environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

// Export the module
module.exports = environmentToExport;
