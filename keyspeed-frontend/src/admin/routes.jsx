import React from 'react';
import OverviewPage from './modules/overview/OverviewPage';
import UsersListPage from './modules/users/UsersListPage';
import UserDetailPage from './modules/users/UserDetailPage';
import RacesListPage from './modules/races/RacesListPage';
import FlaggedListPage from './modules/flagged/FlaggedListPage';
import TextsListPage from './modules/texts/TextsListPage';
import AdminLeaderboardPage from './modules/leaderboard/AdminLeaderboardPage';
import LiveMonitoringPage from './modules/live/LiveMonitoringPage';
import AdminSettingsPage from './modules/settings/AdminSettingsPage';
import AnnouncementsPage from './modules/announcements/AnnouncementsPage';
import AuditLogPage from './modules/audit/AuditLogPage';

export const adminRoutes = [
  { index: true, element: <OverviewPage /> },
  { path: 'users', element: <UsersListPage /> },
  { path: 'users/:id', element: <UserDetailPage /> },
  { path: 'races', element: <RacesListPage /> },
  { path: 'flagged', element: <FlaggedListPage /> },
  { path: 'texts', element: <TextsListPage /> },
  { path: 'leaderboard', element: <AdminLeaderboardPage /> },
  { path: 'live', element: <LiveMonitoringPage /> },
  { path: 'settings', element: <AdminSettingsPage /> },
  { path: 'announcements', element: <AnnouncementsPage /> },
  { path: 'audit', element: <AuditLogPage /> },
];

