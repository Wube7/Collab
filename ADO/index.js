#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const dotenv = require('dotenv');
const path = require('path');
const { getWorkItemsByQuery, createWorkItem, updateWorkItem, addGitHubCommitLink } = require('./lib/workItems');
const { getProjects, getProject, getTeams, getTeamMembers, updateProjectDescription, createProject } = require('./lib/projects');

// Load environment variables
dotenv.config();

// Check for required environment variables
if (!process.env.ADO_ORGANIZATION_URL || !process.env.ADO_TOKEN || !process.env.ADO_PROJECT) {
  console.error(chalk.red('Error: Missing environment variables. Please check your .env file.'));
  console.log(chalk.yellow('Make sure you have created a .env file from the .env.example template.'));
  process.exit(1);
}

// Set up the CLI
program
  .name('ado-client')
  .description('CLI tool to connect with Azure DevOps')
  .version('1.0.0');

// Projects commands
program
  .command('projects')
  .description('List all projects')
  .action(async () => {
    try {
      const projects = await getProjects();
      console.log(chalk.green('\nProjects:'));
      projects.forEach(project => {
        console.log(chalk.cyan(`- ${project.name} (${project.id})`));
      });
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
    }
  });

program
  .command('project <projectNameOrId>')
  .description('Get project details')
  .action(async (projectNameOrId) => {
    try {
      const project = await getProject(projectNameOrId);
      console.log(chalk.green('\nProject Details:'));
      console.log(chalk.cyan(`Name: ${project.name}`));
      console.log(chalk.cyan(`ID: ${project.id}`));
      console.log(chalk.cyan(`Description: ${project.description || 'N/A'}`));
      console.log(chalk.cyan(`URL: ${project.url}`));
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
    }
  });

// New command to update project description
program
  .command('update-project-description <projectNameOrId> <description>')
  .description('Update project description')
  .action(async (projectNameOrId, description) => {
    try {
      const project = await updateProjectDescription(projectNameOrId, description);
      console.log(chalk.green('\nProject Description Updated:'));
      console.log(chalk.cyan(`Name: ${project.name}`));
      console.log(chalk.cyan(`ID: ${project.id}`));
      console.log(chalk.cyan(`New Description: ${project.description || 'N/A'}`));
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
    }
  });

// Add command to create a new project
program
  .command('create-project <name>')
  .description('Create a new project')
  .option('-d, --description <description>', 'Project description', 'Created with ADO CLI')
  .action(async (name, options) => {
    try {
      console.log(chalk.yellow(`Creating project '${name}'...`));
      const result = await createProject(name, options.description);
      console.log(chalk.green(`\nProject Creation Initiated:`));
      console.log(chalk.cyan(`Operation ID: ${result.id}`));
      console.log(chalk.cyan(`Status: ${result.status}`));
      console.log(chalk.cyan(`Message: ${result.message}`));
      console.log(chalk.yellow(`Note: Project creation may take a few minutes to complete.`));
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
    }
  });

program
  .command('teams <projectNameOrId>')
  .description('Get teams for a project')
  .action(async (projectNameOrId) => {
    try {
      const teams = await getTeams(projectNameOrId);
      console.log(chalk.green(`\nTeams for project ${projectNameOrId}:`));
      teams.forEach(team => {
        console.log(chalk.cyan(`- ${team.name} (${team.id})`));
      });
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
    }
  });

program
  .command('members <projectNameOrId> <teamId>')
  .description('Get team members')
  .action(async (projectNameOrId, teamId) => {
    try {
      const members = await getTeamMembers(projectNameOrId, teamId);
      console.log(chalk.green(`\nMembers for team ${teamId} in project ${projectNameOrId}:`));
      members.forEach(member => {
        console.log(chalk.cyan(`- ${member.identity.displayName} (${member.identity.id})`));
      });
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
    }
  });

// Work Items commands
program
  .command('work-items')
  .description('List recent work items')
  .option('-l, --limit <number>', 'Limit the number of results', 10)
  .action(async (options) => {
    try {
      const query = `SELECT TOP ${options.limit} [System.Id], [System.Title], [System.State], [System.WorkItemType] 
                    FROM WorkItems 
                    WHERE [System.TeamProject] = '${process.env.ADO_PROJECT}'
                    ORDER BY [System.ChangedDate] DESC`;
      
      const workItems = await getWorkItemsByQuery(query);
      console.log(chalk.green('\nRecent Work Items:'));
      
      workItems.forEach(item => {
        const id = item.id;
        const title = item.fields['System.Title'];
        const state = item.fields['System.State'];
        const type = item.fields['System.WorkItemType'];
        
        console.log(chalk.cyan(`[${type}] #${id}: ${title} (${state})`));
      });
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
    }
  });

program
  .command('create-work-item <type> <title>')
  .description('Create a new work item')
  .option('-d, --description <description>', 'Work item description', '')
  .action(async (type, title, options) => {
    try {
      const workItem = await createWorkItem(type, title, options.description);
      console.log(chalk.green(`\nWork Item Created:`));
      console.log(chalk.cyan(`ID: ${workItem.id}`));
      console.log(chalk.cyan(`Title: ${workItem.fields['System.Title']}`));
      console.log(chalk.cyan(`Type: ${workItem.fields['System.WorkItemType']}`));
      console.log(chalk.cyan(`URL: ${workItem.url}`));
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
    }
  });

program
  .command('update-work-item <id>')
  .description('Update a work item')
  .option('-t, --title <title>', 'New title')
  .option('-s, --state <state>', 'New state')
  .option('-d, --description <description>', 'New description')
  .action(async (id, options) => {
    try {
      const updates = [];
      
      if (options.title) {
        updates.push({
          op: 'add',
          path: '/fields/System.Title',
          value: options.title
        });
      }
      
      if (options.state) {
        updates.push({
          op: 'add',
          path: '/fields/System.State',
          value: options.state
        });
      }
      
      if (options.description) {
        updates.push({
          op: 'add',
          path: '/fields/System.Description',
          value: options.description
        });
      }
      
      if (updates.length === 0) {
        console.log(chalk.yellow('No updates provided. Use options like --title, --state, or --description'));
        return;
      }
      
      const workItem = await updateWorkItem(id, updates);
      console.log(chalk.green(`\nWork Item #${id} Updated:`));
      console.log(chalk.cyan(`Title: ${workItem.fields['System.Title']}`));
      console.log(chalk.cyan(`State: ${workItem.fields['System.State']}`));
      console.log(chalk.cyan(`Type: ${workItem.fields['System.WorkItemType']}`));
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
    }
  });

program
  .command('link-commit <workItemId> <commitHash>')
  .description('Link a GitHub commit to a work item')
  .option('-c, --comment <comment>', 'Comment to add with the link', 'Associated with this commit')
  .option('-r, --repo <repoUrl>', 'GitHub repository URL (optional)')
  .action(async (workItemId, commitHash, options) => {
    try {
      const workItem = await addGitHubCommitLink(
        workItemId, 
        commitHash, 
        options.comment, 
        options.repo
      );
      
      console.log(chalk.green(`\nGitHub Commit Linked to Work Item #${workItemId}:`));
      console.log(chalk.cyan(`Commit: ${commitHash}`));
      console.log(chalk.cyan(`Comment: ${options.comment}`));
      console.log(chalk.cyan(`Work Item Type: ${workItem.fields['System.WorkItemType']}`));
      console.log(chalk.cyan(`Work Item Title: ${workItem.fields['System.Title']}`));
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
    }
  });

// Parse command line arguments
program.parse();

// If no arguments, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}