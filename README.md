<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/target.svg" alt="Logo" width="80" height="80">
  <h1 align="center">Git-Integrated Project Manager</h1>
  <p align="center">
    A premium, full-stack project management tool with Kanban boards, real-time GitHub integration, and dynamic analytics.
    <br />
    <a href="#features"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/yourusername/git-project-manager">View Demo</a>
    ·
    <a href="https://github.com/yourusername/git-project-manager/issues">Report Bug</a>
    ·
    <a href="https://github.com/yourusername/git-project-manager/issues">Request Feature</a>
  </p>
</div>

<!-- ABOUT THE PROJECT -->
## ✨ About The Project

This is a **Git-Integrated Project Manager** built to bridge the gap between task tracking and version control. With a stunning glassmorphism UI, interactive drag-and-drop Kanban boards, and live GitHub commit feeds, this application operates as a single pane of glass for developer productivity.

### 🔥 Key Features
* 🛡️ **Secure Authentication** - JWT-based auth with credential hashing.
* 📋 **Dynamic Kanban Boards** - Drag and drop tasks seamlessly across To Do, In Progress, and Done, or use quick action buttons.
* 🐙 **GitHub Integration** - Automatically fetches and displays live public repository commits and issues via the sidebar.
* 📊 **Insight Analytics** - Visualizes task priorities, statuses, and performance distribution via Recharts.
* 🎨 **Premium UI/UX** - Tailwind CSS, custom scrollbars, animated mesh gradients, and beautiful glassmorphism styling.

---

## 🛠️ Built With

* **Frontend:** React, Vite, Tailwind CSS, Lucide Icons, @hello-pangea/dnd, Recharts
* **Backend:** Python, Flask, SQLite, PyJWT, SQLAlchemy
* **APIs:** GitHub REST API

---

## 📂 Project Structure

```text
git-project-manager/
├── backend/                  # Flask REST API Service
│   ├── app.py                # Main application entry point
│   ├── models.py             # SQLAlchemy database models (User, Project)
│   ├── requirements.txt      # Python dependencies
│   ├── routes/               # Modular route blueprints
│   │   ├── auth.py           # JWT Login/Register logic 
│   │   ├── github.py         # GitHub API interaction
│   │   ├── projects.py       # Project CRUD operations
│   │   └── tasks.py          # Task management & Kanban data
│   └── venv/                 # Python Virtual Environment
│
└── frontend/                 # React Frontend Application
    ├── index.html            # Vite entry point
    ├── package.json          # Node dependencies
    ├── tailwind.config.js    # Tailwind configuration
    ├── vite.config.js        # Vite bundler parameters
    └── src/                  # React Source Code
        ├── App.jsx           # Main React Router setup
        ├── index.css         # Global aesthetic styles & animations
        ├── main.jsx          # React DOM entry
        ├── components/       # Reusable UI (Navbar, Modals)
        ├── pages/            # Full views (Auth, Dashboard, ProjectDetail)
        └── services/         # Axios API bindings
```

---

## 🚀 Getting Started

Follow these simple steps to get a local development copy up and running!

### Prerequisites

* Node.js (v18+)
* Python (3.9+)

### Installation

1. **Clone the repository**
   ```sh
   git clone https://github.com/yourusername/git-project-manager.git
   cd git-project-manager
   ```

2. **Setup the Backend**
   ```sh
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python app.py
   ```
   > The Flask backend will start on `http://127.0.0.1:5001`. The database (`project_manager.db`) automatically initializes on first run.

3. **Setup the Frontend**
   Open a new terminal window:
   ```sh
   cd frontend
   npm install
   npm run dev
   ```
   > The React app will run via Vite on `http://localhost:5173`.

---

## 💡 Usage

1. Open `http://localhost:5173` in your browser.
2. Complete the registration via the **Sign Up** page.
3. Access your **Dashboard** and click `+ New Project`.
4. Link a GitHub repository (e.g., `facebook/react`) to track remote commits.
5. Create tasks and manage them on your **Kanban Board** by dragging cards.
6. Check your **Analytics** tab for high-level project visibility.

---
<p align="center">Made with ❤️ for Developer Productivity</p>
