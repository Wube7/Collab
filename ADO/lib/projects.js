const { getConnection } = require('./connection');

/**
 * Get list of all projects
 * @returns {Array} List of projects
 */
async function getProjects() {
  try {
    const connection = await getConnection();
    const coreApi = await connection.getCoreApi();
    
    const projects = await coreApi.getProjects();
    return projects;
  } catch (error) {
    throw new Error(`Failed to get projects: ${error.message}`);
  }
}

/**
 * Get project by name or ID
 * @param {string} projectNameOrId - Project name or ID
 * @returns {Object} Project details
 */
async function getProject(projectNameOrId) {
  try {
    const connection = await getConnection();
    const coreApi = await connection.getCoreApi();
    
    const project = await coreApi.getProject(projectNameOrId);
    return project;
  } catch (error) {
    throw new Error(`Failed to get project ${projectNameOrId}: ${error.message}`);
  }
}

/**
 * Get teams for a project
 * @param {string} projectNameOrId - Project name or ID
 * @returns {Array} List of teams
 */
async function getTeams(projectNameOrId) {
  try {
    const connection = await getConnection();
    const coreApi = await connection.getCoreApi();
    
    const teams = await coreApi.getTeams(projectNameOrId);
    return teams;
  } catch (error) {
    throw new Error(`Failed to get teams for project ${projectNameOrId}: ${error.message}`);
  }
}

/**
 * Get team members
 * @param {string} projectNameOrId - Project name or ID
 * @param {string} teamId - Team ID
 * @returns {Array} List of team members
 */
async function getTeamMembers(projectNameOrId, teamId) {
  try {
    const connection = await getConnection();
    const coreApi = await connection.getCoreApi();
    
    const members = await coreApi.getTeamMembers(projectNameOrId, teamId);
    return members;
  } catch (error) {
    throw new Error(`Failed to get team members: ${error.message}`);
  }
}

/**
 * Update project description
 * @param {string} projectNameOrId - Project name or ID
 * @param {string} description - New project description
 * @returns {Object} Updated project
 */
async function updateProjectDescription(projectNameOrId, description) {
  try {
    const connection = await getConnection();
    const coreApi = await connection.getCoreApi();
    
    // First get the project to get current values
    const project = await coreApi.getProject(projectNameOrId);
    
    // Create a proper update document for project description
    const updatedProject = {
      description: description
    };
    
    // Update the project with correct parameter order
    const result = await coreApi.updateProject(updatedProject, project.id);
    return result;
  } catch (error) {
    console.error('Error details:', error);
    throw new Error(`Failed to update project description: ${error.message}`);
  }
}

module.exports = {
  getProjects,
  getProject,
  getTeams,
  getTeamMembers,
  updateProjectDescription
};