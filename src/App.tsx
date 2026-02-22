import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminLayout from './components/layouts/AdminLayout';
import CitizenLayout from './components/layouts/CitizenLayout';
import Dashboard from './pages/admin/Dashboard';
import AdminPolicies from './pages/admin/Policies';
import Analytics from './pages/admin/Analytics';
import Users from './pages/admin/Users';
import Settings from './pages/admin/Settings';
import Login from './pages/auth/Login';
import ResetPassword from './pages/auth/ResetPassword';
import Signup from './pages/auth/Signup';
import Home from './pages/citizen/Home';
import Policies from './pages/citizen/Policies';
import PolicyDetailPage from './pages/citizen/PolicyDetailPage';
import Profile from './pages/citizen/Profile';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route
        element={
          <ProtectedRoute>
            <CitizenLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/policies" element={<Policies />} />
        <Route path="/policies/:id" element={<PolicyDetailPage />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/admin/policies" element={<AdminPolicies />} />
        <Route path="/admin/analytics" element={<Analytics />} />
        <Route path="/admin/users" element={<Users />} />
        <Route path="/admin/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
