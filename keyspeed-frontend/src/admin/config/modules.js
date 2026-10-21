import {
  LayoutDashboard,
  Users,
  Trophy,
  ShieldAlert,
  FileText,
  Medal,
  Radio,
  Sliders,
  Megaphone,
  History,
} from 'lucide-react';

/**
 * Single source of truth for Admin modules.
 * Adding a new feature only requires adding one entry here.
 */
export const ADMIN_MODULES = [
  {
    id: 'overview',
    label: 'Overview',
    path: '',
    fullPath: '/admin',
    icon: LayoutDashboard,
    description: 'System overview, metrics, and live trends',
  },
  {
    id: 'users',
    label: 'Users',
    path: 'users',
    fullPath: '/admin/users',
    icon: Users,
    description: 'Manage racers, roles, bans, and statistics',
  },
  {
    id: 'races',
    label: 'Races',
    path: 'races',
    fullPath: '/admin/races',
    icon: Trophy,
    description: 'Live and solo race logs, results, and stats',
  },
  {
    id: 'flagged',
    label: 'Flagged Results',
    path: 'flagged',
    fullPath: '/admin/flagged',
    icon: ShieldAlert,
    description: 'Anti-cheat detections and moderation queue',
  },
  {
    id: 'texts',
    label: 'Texts Library',
    path: 'texts',
    fullPath: '/admin/texts',
    icon: FileText,
    description: 'Typing paragraphs, difficulties, and imports',
  },
  {
    id: 'leaderboard',
    label: 'Leaderboard',
    path: 'leaderboard',
    fullPath: '/admin/leaderboard',
    icon: Medal,
    description: 'All-time & daily rankings and recalculations',
  },
  {
    id: 'live',
    label: 'Live Monitoring',
    path: 'live',
    fullPath: '/admin/live',
    icon: Radio,
    description: 'Real-time room supervision and socket controls',
  },
  {
    id: 'settings',
    label: 'Game Settings',
    path: 'settings',
    fullPath: '/admin/settings',
    icon: Sliders,
    description: 'Countdown, timeouts, anti-cheat, and maintenance',
  },
  {
    id: 'announcements',
    label: 'Announcements',
    path: 'announcements',
    fullPath: '/admin/announcements',
    icon: Megaphone,
    description: 'Global site banners and notices',
  },
  {
    id: 'audit',
    label: 'Audit Log',
    path: 'audit',
    fullPath: '/admin/audit',
    icon: History,
    description: 'Immutable record of all admin modifications',
  },
];

