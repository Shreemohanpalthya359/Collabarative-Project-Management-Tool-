import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProjectDetail from './pages/ProjectDetail';
import Analytics from './pages/Analytics';
import TeamSettings from './pages/TeamSettings';
import Sprints from './pages/Sprints';
import Profile from './pages/Profile';
import About from './pages/About';
import RecycleBin from './pages/RecycleBin';
import Landing from './pages/Landing';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

const AuthRoute = () => {
  const token = localStorage.getItem('token');
  return token ? <Navigate to="/dashboard" /> : <Landing />;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/about" element={<About />} />
          <Route path="/home" element={<Landing />} />
          <Route path="/recycle-bin" element={<PrivateRoute><RecycleBin /></PrivateRoute>} />
          <Route path="/" element={<AuthRoute />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/project/:id"
            element={
              <PrivateRoute>
                <ProjectDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/project/:id/team"
            element={
              <PrivateRoute>
                <TeamSettings />
              </PrivateRoute>
            }
          />
          <Route
            path="/project/:id/sprints"
            element={
              <PrivateRoute>
                <Sprints />
              </PrivateRoute>
            }
          />
          <Route
            path="/project/:id/analytics"
            element={
              <PrivateRoute>
                <Analytics />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
