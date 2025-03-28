const azdev = require('azure-devops-node-api');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

/**
 * Initialize and return an Azure DevOps connection
 * @returns {Object} ADO connection object
 */
async function getConnection() {
  const orgUrl = process.env.ADO_ORGANIZATION_URL;
  const token = process.env.ADO_TOKEN;

  if (!orgUrl || !token) {
    throw new Error(
      'Missing ADO credentials. Please create a .env file based on .env.example'
    );
  }

  try {
    // Create an authentication handler using personal access token
    const authHandler = azdev.getPersonalAccessTokenHandler(token);
    
    // Create a connection to Azure DevOps Services
    const connection = new azdev.WebApi(orgUrl, authHandler);
    
    // Test the connection by getting the project API client
    await connection.getCoreApi();
    return connection;
  } catch (error) {
    throw new Error(`Failed to connect to Azure DevOps: ${error.message}`);
  }
}

module.exports = { getConnection };