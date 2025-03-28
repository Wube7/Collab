const { getConnection } = require('./connection');

/**
 * Get work items by query
 * @param {string} query - WIQL query string
 * @returns {Array} List of work items
 */
async function getWorkItemsByQuery(query) {
  try {
    const connection = await getConnection();
    const workItemTrackingApi = await connection.getWorkItemTrackingApi();
    const projectName = process.env.ADO_PROJECT;
    
    // Create WIQL query object
    const wiqlQuery = {
      query: query || `SELECT [System.Id], [System.Title], [System.State], [System.WorkItemType]
                      FROM WorkItems 
                      WHERE [System.TeamProject] = '${projectName}'
                      ORDER BY [System.ChangedDate] DESC`
    };
    
    // Execute the query
    const queryResult = await workItemTrackingApi.queryByWiql(wiqlQuery, { project: projectName });
    
    if (!queryResult.workItems || queryResult.workItems.length === 0) {
      return [];
    }

    // Get work item IDs from the query results
    const workItemIds = queryResult.workItems.map(wi => wi.id);
    
    // Get detailed work items
    const workItems = await workItemTrackingApi.getWorkItems(workItemIds);
    return workItems;
  } catch (error) {
    throw new Error(`Failed to get work items: ${error.message}`);
  }
}

/**
 * Create a new work item
 * @param {string} type - Work item type (e.g., 'Task', 'User Story', 'Bug')
 * @param {string} title - Title of the work item
 * @param {string} description - Description of the work item
 * @returns {Object} Created work item
 */
async function createWorkItem(type, title, description) {
  try {
    const connection = await getConnection();
    const workItemTrackingApi = await connection.getWorkItemTrackingApi();
    const projectName = process.env.ADO_PROJECT;

    // Define the patch document for work item creation
    const patchDocument = [
      {
        op: 'add',
        path: '/fields/System.Title',
        value: title
      },
      {
        op: 'add',
        path: '/fields/System.Description',
        value: description
      }
    ];

    // Create the work item
    const createdWorkItem = await workItemTrackingApi.createWorkItem(
      null, 
      patchDocument, 
      projectName, 
      type
    );

    return createdWorkItem;
  } catch (error) {
    throw new Error(`Failed to create work item: ${error.message}`);
  }
}

/**
 * Update a work item
 * @param {number} id - Work item ID
 * @param {Array} updates - Array of patch operations
 * @returns {Object} Updated work item
 */
async function updateWorkItem(id, updates) {
  try {
    const connection = await getConnection();
    const workItemTrackingApi = await connection.getWorkItemTrackingApi();

    // Update the work item
    const updatedWorkItem = await workItemTrackingApi.updateWorkItem(
      null,
      updates,
      id
    );

    return updatedWorkItem;
  } catch (error) {
    throw new Error(`Failed to update work item: ${error.message}`);
  }
}

module.exports = {
  getWorkItemsByQuery,
  createWorkItem,
  updateWorkItem
};