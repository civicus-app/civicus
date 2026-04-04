import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';

const AdminLayout = lazy(() => import('./components/layouts/AdminLayout'));
const CitizenLayout = lazy(() => import('./components/layouts/CitizenLayout'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminPolicies = lazy(() => import('./pages/admin/Policies'));
const PolicyEditor = lazy(() => import('./pages/admin/PolicyEditor'));
const PolicyPreview = lazy(() => import('./pages/admin/PolicyPreview'));
const Analytics = lazy(() => import('./pages/admin/Analytics'));
const Users = lazy(() => import('./pages/admin/Users'));
const Settings = lazy(() => import('./pages/admin/Settings'));
const Login = lazy(() => import('./pages/auth/Login'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const Signup = lazy(() => import('./pages/auth/Signup'));
const Home = lazy(() => import('./pages/citizen/Home'));
const Policies = lazy(() => import('./pages/citizen/Policies'));
const Profile = lazy(() => import('./pages/citizen/Profile'));
const PolicyDetailPage = lazy(() => import('./pages/citizen/PolicyDetailPage'));
const NotFound = lazy(() => import('./pages/NotFound'));
const TopicSelectionPage = lazy(() => import('./pages/citizen/flow/TopicSelectionPage'));
const TopicOverviewPage = lazy(() => import('./pages/citizen/flow/TopicOverviewPage'));
const AiChatPage = lazy(() => import('./pages/citizen/flow/AiChatPage'));
const ExtractSummaryPage = lazy(() => import('./pages/citizen/flow/ExtractSummaryPage'));
const VerificationGatePage = lazy(() => import('./pages/citizen/flow/VerificationGatePage'));
const VerificationCallbackPage = lazy(() => import('./pages/citizen/flow/VerificationCallbackPage'));
const FeedbackSentimentPage = lazy(() => import('./pages/citizen/flow/FeedbackSentimentPage'));
const SubmissionSuccessPage = lazy(() => import('./pages/citizen/flow/SubmissionSuccessPage'));
const VotesSnapshotPage = lazy(() => import('./pages/citizen/snapshots/VotesSnapshotPage'));
const ProfileProgressSnapshotPage = lazy(() => import('./pages/citizen/snapshots/ProfileProgressSnapshotPage'));
const CommunityPulseSnapshotPage = lazy(() => import('./pages/citizen/snapshots/CommunityPulseSnapshotPage'));

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f3f6fb]">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#d7e2f0] border-t-[#2f70ba]" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
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
          <Route path="/home" element={<Home />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/policies/:id" element={<PolicyDetailPage />} />
          <Route path="/policies/:id/utforsk" element={<TopicSelectionPage />} />
          <Route path="/policies/:id/topic/:topic" element={<TopicOverviewPage />} />
          <Route path="/policies/:id/topic/:topic/chat" element={<AiChatPage />} />
          <Route path="/policies/:id/topic/:topic/utdrag" element={<ExtractSummaryPage />} />
          <Route path="/policies/:id/verifisering" element={<VerificationGatePage />} />
          <Route path="/policies/:id/tilbakemelding" element={<FeedbackSentimentPage />} />
          <Route path="/policies/:id/suksess" element={<SubmissionSuccessPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/innsikt/stemmer" element={<VotesSnapshotPage />} />
          <Route path="/innsikt/profil" element={<ProfileProgressSnapshotPage />} />
          <Route path="/innsikt/puls" element={<CommunityPulseSnapshotPage />} />
          <Route path="/verifisering/callback" element={<VerificationCallbackPage />} />
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
          <Route path="/admin/policies/new" element={<PolicyEditor />} />
          <Route path="/admin/policies/:id/edit" element={<PolicyEditor />} />
          <Route path="/admin/policies/:id/preview" element={<PolicyPreview />} />
          <Route path="/admin/analytics" element={<Analytics />} />
          <Route path="/admin/users" element={<Users />} />
          <Route path="/admin/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
