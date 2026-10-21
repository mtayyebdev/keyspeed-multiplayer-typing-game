import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import HomePage from '../pages/HomePage';
import SoloPage from '../pages/SoloPage';
import LobbyPage from '../pages/LobbyPage';
import RaceRoomPage from '../pages/RaceRoomPage';
import LeaderboardPage from '../pages/LeaderboardPage';
import ProfilePage from '../pages/ProfilePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import SettingsPage from '../pages/SettingsPage';
import PrivacyPolicyPage from '../pages/PrivacyPolicyPage';
import TermsPage from '../pages/TermsPage';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from '../admin/guards/AdminRoute';

const AdminApp = React.lazy(() => import('../admin/AdminApp'));

export const router = createBrowserRouter([
  {
    path: '/admin/*',
    element: (
      <AdminRoute>
        <React.Suspense
          fallback={
            <div className="min-h-screen bg-bg text-fg flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            </div>
          }
        >
          <AdminApp />
        </React.Suspense>
      </AdminRoute>
    ),
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'solo', element: <SoloPage /> },
      {
        path: 'lobby',
        element: (
          <ProtectedRoute>
            <LobbyPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'race',
        element: (
          <ProtectedRoute>
            <RaceRoomPage />
          </ProtectedRoute>
        ),
      },
      { path: 'leaderboard', element: <LeaderboardPage /> },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      { path: 'profile/:username', element: <ProfilePage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'privacy', element: <PrivacyPolicyPage /> },
      { path: 'privacy-policy', element: <PrivacyPolicyPage /> },
      { path: 'terms', element: <TermsPage /> },
      { path: 'terms-and-conditions', element: <TermsPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
    ],
  },
]);

