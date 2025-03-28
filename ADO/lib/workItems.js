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

/**
 * Add a GitHub commit link to a work item
 * @param {number} id - Work item ID
 * @param {string} commitHash - GitHub commit hash
 * @param {string} comment - Comment to add with the link
 * @param {string} repoUrl - GitHub repository URL (optional, defaults to repository in .env)
 * @returns {Object} Updated work item
 */
async function addGitHubCommitLink(id, commitHash, comment, repoUrl) {
  try {
    const connection = await getConnection();
    const workItemTrackingApi = await connection.getWorkItemTrackingApi();
    const projectName = process.env.ADO_PROJECT;
    
    // Use the provided repo URL or construct from environment variables
    const gitHubRepo = repoUrl || process.env.GITHUB_REPO || 'https://github.com/Wube7/Collab';
    
    // Create the full commit URL
    const commitUrl = `${gitHubRepo}/commit/${commitHash}`;
    
    // Get the current work item to make sure it exists
    const workItem = await workItemTrackingApi.getWorkItem(id);
    
    console.log(`Linking GitHub commit ${commitHash} to work item #${id} (${workItem.fields['System.Title']})`);
    
    // Instead of trying to directly manipulate relations, which may have permission issues,
    // let's add a comment that includes the commit link. This will be more reliable.
    const commentText = `<a href="${commitUrl}" target="_blank">GitHub Commit ${commitHash}</a>: ${comment}`;
    
    // Update the work item description to include the commit link
    const description = workItem.fields['System.Description'] || '';
    const updatedDescription = description + '<br><br>' + commentText;
    
    const patchDocument = [
      {
        op: 'add',
        path: '/fields/System.Description',
        value: updatedDescription
      }
    ];
    
    console.log('Using patch document:', JSON.stringify(patchDocument, null, 2));
    
    // Update the work item
    const updatedWorkItem = await workItemTrackingApi.updateWorkItem(
      null,
      patchDocument,
      id
    );
    
    return updatedWorkItem;
  } catch (error) {
    // Log the full error for debugging
    console.error('Error details:', error);
    if (error.serverError) {
      console.error('Server error:', error.serverError);
    }
    if (error.message) {
      console.error('Error message:', error.message);
    }
    throw new Error(`Failed to add GitHub commit link: ${error.message}`);
  }
}

/**
 * Get a single work item by ID
 * @param {number} id - Work item ID
 * @param {boolean} includeRelations - Whether to include relations in the result
 * @returns {Object} Work item
 */
async function getWorkItem(id, includeRelations = true) {
  try {
    const connection = await getConnection();
    const workItemTrackingApi = await connection.getWorkItemTrackingApi();
    
    // Define expand options to include relations if requested
    const expandOptions = includeRelations ? { 
      $expand: 'Relations'
    } : undefined;
    
    // Get the work item with the specified ID
    const workItem = await workItemTrackingApi.getWorkItem(id, undefined, undefined, expandOptions);
    return workItem;
  } catch (error) {
    throw new Error(`Failed to get work item ${id}: ${error.message}`);
  }
}

module.exports = {
  getWorkItemsByQuery,
  createWorkItem,
  updateWorkItem,
  addGitHubCommitLink,
  getWorkItem
};