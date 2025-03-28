# Standard Operating Procedure (SOP) for Feature Development and Bug Fixes

## Overview
This document outlines the standard process to follow when developing new features or fixing bugs in our projects.

## Process Steps

### 1. Create Work Item in Azure DevOps (ADO)
- For new features: Create a User Story in ADO
- For bugs: Create a Bug work item in ADO
- Assign the work item to yourself
- Change the state to "Active"

### 2. Development
- Implement the feature or fix the bug according to requirements
- Ensure code follows project standards and best practices
- Test your implementation thoroughly

### 3. Version Control
- Commit your changes with a descriptive message
- Push the code back to GitHub

### 4. Update Work Item Status
- Link your GitHub commit to the work item in ADO using:
  ```
  cd /path/to/ADO && node index.js link-commit [ID] [COMMIT_HASH] "Brief description of changes"
  ```
- Update the work item state to "Resolved"
  ```
  cd /path/to/ADO && node index.js update-work-item [ID] -s "Resolved"
  ```
- **Note**: GitHub commit links will be added to the Description field of the work item for traceability.

## Example Commands

### Creating a User Story
```
cd /path/to/ADO && node index.js create-work-item "User Story" "As a user, I want to..." -d "Detailed description of the feature"
```

### Creating a Bug
```
cd /path/to/ADO && node index.js create-work-item "Bug" "Bug title" -d "Bug description and steps to reproduce"
```

### Linking GitHub Commits
```
cd /path/to/ADO && node index.js link-commit [ID] [COMMIT_HASH] "Implemented feature X"
```

### Updating Work Item State
```
cd /path/to/ADO && node index.js update-work-item [ID] -s "Active"
cd /path/to/ADO && node index.js update-work-item [ID] -d "Additional details about implementation"
cd /path/to/ADO && node index.js update-work-item [ID] -s "Resolved" -d "Resolution details"
```

### Git Commands
```
git add .
git commit -m "Descriptive message about changes"
git push
```