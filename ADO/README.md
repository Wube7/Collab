# ADO Client Tool

A command-line tool to connect with Azure DevOps (ADO) for managing projects and story boards.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file from the template:

```bash
cp .env.example .env
```

3. Edit the `.env` file and add your Azure DevOps credentials:
   - `ADO_ORGANIZATION_URL`: Your Azure DevOps organization URL (e.g., https://dev.azure.com/your-organization)
   - `ADO_TOKEN`: Your personal access token (Generate this in ADO under User Settings > Personal access tokens)
   - `ADO_PROJECT`: Your default project name

4. Make the CLI executable:

```bash
chmod +x index.js
```

## Usage

### Projects

List all projects:
```bash
node index.js projects
```

Get project details:
```bash
node index.js project <projectNameOrId>
```

List teams for a project:
```bash
node index.js teams <projectNameOrId>
```

List team members:
```bash
node index.js members <projectNameOrId> <teamId>
```

### Work Items

List recent work items (default limit: 10):
```bash
node index.js work-items
```

List with custom limit:
```bash
node index.js work-items --limit 20
```

Create a new work item:
```bash
node index.js create-work-item "User Story" "Implement login feature" --description "As a user, I want to log in to the system"
```

Update a work item:
```bash
node index.js update-work-item 123 --title "Updated title" --state "In Progress" --description "Updated description"
```

## Available Work Item Types

Common Azure DevOps work item types include:
- User Story
- Task
- Bug
- Feature
- Epic

The actual available types depend on your Azure DevOps process template (Agile, Scrum, CMMI, etc.).