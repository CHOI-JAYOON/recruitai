import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import MyPage from './pages/MyPage';
import ResumePage from './pages/ResumePage';
import CoverLetterPage from './pages/CoverLetterPage';
import InterviewPage from './pages/InterviewPage';
import CareerDescPage from './pages/CareerDescPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';

function ProtectedRoute() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Layout><Outlet /></Layout>;
}

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/privacy', element: <PrivacyPolicyPage /> },
  { path: '/oauth/callback/:provider', element: <OAuthCallbackPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/mypage', element: <MyPage /> },
      { path: '/resume', element: <ResumePage /> },
      { path: '/cover-letter', element: <CoverLetterPage /> },
      { path: '/interview', element: <InterviewPage /> },
      { path: '/career-description', element: <CareerDescPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
