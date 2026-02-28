import { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
} from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import CreateStaffPage from './pages/admin/CreateStaffPage.jsx';
import DepartmentsPage from './pages/admin/DepartmentsPage.jsx';
import ChatPage from './pages/student/ChatPage.jsx';
import NewComplaintPage from './pages/student/NewComplaintPage.jsx';
import StudentComplaintDetail from './pages/student/StudentComplaintDetail.jsx';
import StudentDashboard from './pages/student/StudentDashboard.jsx';
import StudentNotificationsPage from './pages/student/StudentNotificationsPage.jsx';
import StaffComplaintDetail from './pages/staff/StaffComplaintDetail.jsx';
import StaffDashboard from './pages/staff/StaffDashboard.jsx';
import apiFetch from './api/client.js';

const navByRole = {
  student: [
    { to: '/dashboard', label: 'My Complaints' },
    { to: '/student/new', label: 'New Complaint' },
    { to: '/student/chat', label: 'AI Helper' },
    { to: '/student/notifications', label: 'Notifications' },
  ],
  staff: [
    { to: '/dashboard', label: 'Queue Overview' },
    { to: '/staff/complaints', label: 'Complaint Queue' },
  ],
  admin: [
    { to: '/dashboard', label: 'Analytics' },
    { to: '/admin/departments', label: 'Departments' },
    { to: '/admin/staff', label: 'Create Staff' },
  ],
};

function useAuth() {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('astu_token');
    const userData = localStorage.getItem('astu_user');

    if (token && userData) {
      try {
        return JSON.parse(userData);
      } catch {
        localStorage.removeItem('astu_token');
        localStorage.removeItem('astu_user');
      }
    }
    return null;
  });

  const logout = () => {
    localStorage.removeItem('astu_token');
    localStorage.removeItem('astu_user');
    setUser(null);
  };

  return { user, setUser, logout };
}

function ProtectedRoute({ user }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

function RequireRole({ roles, user }) {
  if (!roles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}

function DashboardHome({ user }) {
  if (user?.role === 'student') {
    return <StudentDashboard />;
  }
  if (user?.role === 'staff') {
    return <StaffDashboard />;
  }
  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }
  return <Navigate to="/login" replace />;
}

function Layout({ onLogout, user }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const roleNavItems = navByRole[user?.role] || [];

  useEffect(() => {
    let intervalId = null;

    async function loadUnreadCount() {
      if (user?.role !== 'student') {
        return;
      }
      try {
        const data = await apiFetch('/api/student/notifications/unread-count');
        setUnreadCount(data.count ?? 0);
      } catch {
        setUnreadCount(0);
      }
    }

    loadUnreadCount();
    if (user?.role === 'student') {
      intervalId = setInterval(loadUnreadCount, 30000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [user?.role]);

  return (
    <div className="layout-container">
      <header className="mobile-header">
        <button
          type="button"
          className="mobile-menu-button"
          onClick={() => setMobileNavOpen((open) => !open)}
        >
          Menu
        </button>
        <div className="mobile-brand">ASTU Complaint System</div>
      </header>

      {mobileNavOpen && (
        <button
          type="button"
          className="mobile-backdrop"
          aria-label="Close menu"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <aside className={`nav-luxury ${mobileNavOpen ? 'is-open' : ''}`}>
        <div className="nav-logo-section">
          <div className="nav-logo">A</div>
          <div className="nav-brand">
            <h1 className="nav-brand-title">ASTU</h1>
            <p className="nav-brand-subtitle">Complaint System</p>
          </div>
        </div>

        <nav className="nav-menu">
          {roleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileNavOpen(false)}
              className={({ isActive }) =>
                `nav-item-luxury ${isActive ? 'nav-item-luxury-active' : ''}`
              }
            >
              <span>{item.label}</span>
              {item.to === '/student/notifications' && unreadCount > 0 && (
                <span className="nav-pill">{unreadCount}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="nav-profile">
          <div className="nav-profile-info">
            <div className="nav-avatar">
              <span className="nav-avatar-text">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="nav-user-details">
              <div className="nav-user-name">{user?.name}</div>
              <div className="nav-user-role">{user?.role}</div>
            </div>
          </div>
          <button onClick={onLogout} className="btn-luxury-secondary nav-logout-btn">
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  const { user, setUser, logout } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            user ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={setUser} />
          }
        />
        <Route
          path="/register"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <RegisterPage onRegister={setUser} />
            )
          }
        />

        <Route element={<ProtectedRoute user={user} />}>
          <Route element={<Layout user={user} onLogout={logout} />}>
            <Route path="/dashboard" element={<DashboardHome user={user} />} />

            <Route element={<RequireRole roles={['student']} user={user} />}>
              <Route path="/student/new" element={<NewComplaintPage />} />
              <Route path="/student/chat" element={<ChatPage />} />
              <Route path="/student/notifications" element={<StudentNotificationsPage />} />
              <Route path="/student/complaints/:id" element={<StudentComplaintDetail />} />
            </Route>

            <Route element={<RequireRole roles={['staff']} user={user} />}>
              <Route path="/staff/complaints" element={<StaffDashboard />} />
              <Route path="/staff/complaints/:id" element={<StaffComplaintDetail />} />
            </Route>

            <Route element={<RequireRole roles={['admin']} user={user} />}>
              <Route path="/admin/departments" element={<DepartmentsPage />} />
              <Route path="/admin/staff" element={<CreateStaffPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
        <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
