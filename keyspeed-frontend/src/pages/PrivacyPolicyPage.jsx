import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Database, Cookie, Trash2, ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const lastUpdated = 'October 21, 2026';

  const sections = [
    {
      icon: Database,
      title: '1. Information We Collect',
      content: [
        'Account Credentials: When registering for KeySpeed, we collect your username, email address, and an encrypted password hash. Passwords are never stored in plain text and are salted using bcrypt.',
        'Typing & Gameplay Metrics: To power live multiplayer matchmaking and leaderboards, our servers calculate and store your typing speed (WPM), accuracy percentage, keystroke timing intervals, completed race texts, and win/loss records.',
        'Security & Heuristic Telemetry: For anti-cheat enforcement and account security, we temporarily log client IP addresses, session socket IDs, and progress update deltas.',
        'Client Preferences: We store your chosen theme (Midnight, Light, Terminal, Sand) and keyboard sound settings locally on your device for instant rendering.',
      ],
    },
    {
      icon: Eye,
      title: '2. How We Use Your Information',
      content: [
        'Multiplayer Matchmaking: Synchronizing race start times, real-time racer position updates, and dynamic bot backfill.',
        'Competitive Ranking: Computing global all-time and daily Top 20 leaderboards, racer percentiles, and profile stat cards.',
        'Anti-Cheat Verification: Detecting unauthorized automation scripts, paste injections, and abnormal keystroke burst frequencies (>250 WPM or >15 character leaps).',
        'Account Authentication: Generating secure JWT tokens and maintaining authenticated sessions with httpOnly cookies.',
      ],
    },
    {
      icon: Cookie,
      title: '3. Cookies & Local Storage',
      content: [
        'Authentication Cookies: We use secure, httpOnly cookies with withCredentials protection to authenticate API requests and maintain seamless login sessions.',
        'Local Storage: Used strictly on your client device to store theme preference (midnight/light/terminal/sand) and mechanical sound volume/type.',
        'Session Storage: Temporary storage for dismissed announcement banners during your active browsing session.',
        'No Third-Party Tracking: KeySpeed does not use third-party advertising cookies or behavioral tracking trackers.',
      ],
    },
    {
      icon: Lock,
      title: '4. Data Sharing & Public Information',
      content: [
        'Public Racer Profile: Your username, average WPM, top WPM, total races completed, and public leaderboard entries are visible to other players.',
        'Private Data: Your email address, IP address, password hash, and private match records are strictly private and never made public.',
        'No Commercial Resale: We will never sell, rent, monetize, or trade your personal information with data brokers or advertisers.',
      ],
    },
    {
      icon: Trash2,
      title: '5. Your Rights & Account Deletion',
      content: [
        'Access & Export: You may view your complete racing history and performance telemetry directly on your racer Profile page.',
        'Account Deletion (Danger Zone): You have the full right to delete your account at any time. Navigating to Settings > Danger Zone allows you to permanently wipe your user credentials, personal profile, and associated records from our database.',
        'Data Rectification: You can update your account password at any time from your user Settings page.',
      ],
    },
    {
      icon: Shield,
      title: '6. Security & Infrastructure Safeguards',
      content: [
        'Industry-Standard Encryption: All communication between your browser and KeySpeed is encrypted over TLS/HTTPS and Secure WebSockets (WSS).',
        'Server-Side Validation: Race results and typing metrics are verified on our NestJS backend; client-reported WPM is never blindly trusted.',
        'Administrative Audit Logs: All administrative operations (such as user role updates or moderation actions) are recorded in an append-only audit log for full accountability.',
      ],
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto py-4 space-y-8">
      {/* Back button & Header */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-fg/60 hover:text-accent transition-colors mb-4 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to KeySpeed</span>
        </Link>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-accent-soft border border-accent/30 flex items-center justify-center text-accent flex-shrink-0 shadow-sm">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-fg tracking-tight">
              Privacy <span className="text-accent">Policy</span>
            </h1>
            <p className="text-xs text-fg/60 mt-1">
              Last updated: <span className="font-medium text-fg/80">{lastUpdated}</span> • KeySpeed Player Privacy Protection
            </p>
          </div>
        </div>
      </div>

      {/* Introduction Card */}
      <div className="p-6 rounded-2xl bg-surface border border-border shadow-card text-xs text-fg/80 leading-relaxed space-y-3">
        <p>
          At <strong className="text-fg font-semibold">KeySpeed</strong>, we take racer privacy seriously. We believe in transparency, minimal data collection, and putting you in total control of your gaming identity.
        </p>
        <p>
          This policy details what data we collect when you participate in solo typing practice or multiplayer live races, how that information is utilized to ensure fair play, and your rights to manage or delete your data.
        </p>
      </div>

      {/* Detailed Sections */}
      <div className="space-y-6">
        {sections.map((section, idx) => {
          const Icon = section.icon;
          return (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.04 }}
              className="p-6 rounded-2xl bg-surface border border-border shadow-card space-y-4"
            >
              <div className="flex items-center gap-2.5 pb-3 border-b border-border">
                <Icon className="w-4 h-4 text-accent" />
                <h2 className="text-sm font-bold text-fg tracking-tight">{section.title}</h2>
              </div>

              <ul className="space-y-2.5 text-xs text-fg/70 leading-relaxed">
                {section.content.map((point, pIdx) => (
                  <li key={pIdx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          );
        })}
      </div>

      {/* Contact & Questions footer card */}
      <div className="p-6 rounded-2xl bg-surface-hover/30 border border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div>
          <p className="font-bold text-fg">Have questions about your privacy?</p>
          <p className="text-fg/60 mt-0.5">Contact our data protection team or manage your settings anytime.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/settings"
            className="px-4 py-2 rounded-xl font-semibold bg-surface border border-border-strong text-fg hover:bg-surface-hover transition-all cursor-pointer"
          >
            Manage Settings
          </Link>
          <Link
            to="/"
            className="px-4 py-2 rounded-xl font-semibold bg-accent text-bg hover:opacity-90 transition-all cursor-pointer"
          >
            Start Racing
          </Link>
        </div>
      </div>
    </div>
  );
}

