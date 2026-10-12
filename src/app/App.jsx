import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import HomePage from '../pages/HomePage';
import RecoveryPage from '../pages/RecoveryPage';
import NotFoundPage from '../pages/NotFoundPage';
import EscalationsPage from '../pages/EscalationsPage';
import FamilyPage from '../pages/FamilyPage';
import FamilyAcceptPage from '../pages/FamilyAcceptPage';
import RemindersPage from '../pages/RemindersPage';
import ForumPage from '../pages/ForumPage';
import AdminPage from '../pages/AdminPage';
import LactationPage from '../pages/LactationPage';
import AuthPage from '../pages/AuthPage';
import PrivacyPage from '../pages/PrivacyPage';
import BabyLogsPage from '../pages/BabyLogsPage';
import ProtectedRoute from '../components/ProtectedRoute';

const DashboardPage = lazy(() => import('../pages/DashboardPage'));

function protect(element, roles) {
  return <ProtectedRoute roles={roles}>{element}</ProtectedRoute>;
}

function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/dashboard"
          element={
            protect(
              <Suspense fallback={<p role="status">Loading analytics dashboard...</p>}>
                <DashboardPage />
              </Suspense>,
              ['mother']
            )
          }
        />
        <Route path="/recovery" element={protect(<RecoveryPage />, ['mother'])} />
        <Route path="/babies" element={protect(<BabyLogsPage />, ['mother'])} />
        <Route path="/screening" element={<Navigate to="/#screening" replace />} />
        <Route path="/escalations" element={protect(<EscalationsPage />, ['mother', 'doctor'])} />
        <Route path="/family" element={protect(<FamilyPage />, ['mother', 'family'])} />
        <Route path="/family/accept" element={<FamilyAcceptPage />} />
        <Route path="/reminders" element={protect(<RemindersPage />, ['mother'])} />
        <Route path="/forum" element={protect(<ForumPage />, ['mother', 'family', 'doctor', 'admin'])} />
        <Route path="/admin" element={protect(<AdminPage />, ['admin'])} />
        <Route path="/lactation" element={protect(<LactationPage />, ['mother'])} />
        <Route path="/account" element={<AuthPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppLayout>
  );
}

export default App;
