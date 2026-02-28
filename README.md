# Hackathon Project Management System

## Tech Stack
- Frontend: React
- Backend: Flask
- Database: SQLite
- Testing: PyTest
- Version Control: GitHub

## Features
- User authentication
- Project management (create, update, delete projects)
- Task management (create, update, delete tasks)
- GitHub repository tracking
- Responsive UI
- Unit testing

## Backend Setup
1. Navigate to backend folder:
```bash
cd backend

pip install -r requirements.txt

python app.py


---

### **Step 6 — Add Frontend Setup**
- Explain how to run the frontend React app:  
```markdown
## Frontend Setup
1. Navigate to frontend folder:
```bash
cd frontend

npm install
npm start


---

### **Step 7 — Add API Endpoints**
- Include all backend APIs with their routes:  
```markdown
## API Endpoints

### Projects
- GET /api/projects → Fetch all projects
- POST /api/projects → Create a new project
- PUT /api/projects/<id> → Update project
- DELETE /api/projects/<id> → Delete project

### Tasks
- GET /api/tasks/project/<project_id> → Fetch tasks for a project
- POST /api/tasks → Create a new task
- PUT /api/tasks/<id> → Update task
- DELETE /api/tasks/<id> → Delete task

### GitHub Integration
- GET /api/github/repos → Fetch user repositories
- GET /api/github/commits → Fetch commits

## Testing
Run unit tests using PyTest:
```bash
cd backend
pytest


---

### **Step 9 — Add Architecture Diagram**
- Include a visual or text diagram of your system:  

**ASCII Diagram Example:**
```text
React Frontend
      |
      | REST API
      v
Flask Backend
      |
      v
SQLite Database
      |
      v
GitHub API Integration


