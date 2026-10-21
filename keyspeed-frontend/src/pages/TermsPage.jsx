import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Scale, ShieldAlert, Award, FileText, UserCheck, AlertOctagon, ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  const lastUpdated = 'October 21, 2026';

  const sections = [
    {
      icon: Scale,
      title: '1. Acceptance of Terms',
      content: [
        'By accessing or using KeySpeed ("the Platform"), including visiting public leaderboards, practicing in solo mode, or competing in live multiplayer races, you agree to be bound by these Terms and Conditions.',
        'If you do not agree to these terms, you must discontinue using KeySpeed immediately.',
        'We reserve the right to revise or modify these Terms at any time. Material changes will be communicated via our system announcement banner.',
      ],
    },
    {
      icon: ShieldAlert,
      title: '2. Fair Play & Strict Anti-Cheat Policy',
      content: [
        'Pure Human Skill: KeySpeed is a competitive platform dedicated to authentic typing performance. Any use of automated scripts, typing macros, text injection browser extensions, bots, paste hacks, or hardware macros is strictly prohibited.',
        'Heuristic Anti-Cheat Enforcement: All keystrokes and progress updates are analyzed server-side. Runs exceeding 250 WPM sustained speed or displaying abnormal leaps exceeding 15 characters between consecutive socket events are automatically flagged for review.',
        'Consequences of Cheating: Flagged runs are automatically excluded from public and daily leaderboards. Accounts found engaging in automation are subject to immediate disqualification, statistics wipe, and permanent IP/account bans without notice.',
      ],
    },
    {
      icon: UserCheck,
      title: '3. Racer Accounts & Conduct',
      content: [
        'Registration Integrity: You agree to provide accurate information when registering and to keep your credentials secure. You are solely responsible for all activity conducted under your account.',
        'Acceptable Usernames: Usernames must not contain abusive, obscene, sexually explicit, hateful, defamatory, or harassing language.',
        'Single Identity: Creating multiple smurf or duplicate accounts to manipulate rankings, artificially inflate win rates, or bypass bans is a direct violation of our rules.',
      ],
    },
    {
      icon: Award,
      title: '4. Multiplayer Races & Leaderboards',
      content: [
        'Synchronized Starts: Racers participate in rooms with server-synchronized epoch timestamps and a countdown sequence. Intentionally disconnecting to evade match losses is tracked and recorded as an uncompleted race.',
        'Simulated AI Racers: When fewer than the required racers join a public lobby within the configured matchmaking window, KeySpeed may backfill open lanes with simulated AI racers calibrated to average player speeds.',
        'Leaderboard Accuracy: Our administration team reserves the right to audit and remove suspicious or fraudulent entries from all-time and daily leaderboards at any time.',
      ],
    },
    {
      icon: FileText,
      title: '5. Intellectual Property & Texts Library',
      content: [
        'Platform Assets: The KeySpeed interface, code, game engine, and brand assets are the property of KeySpeed.',
        'Typing Passages: Practice texts in our library consist of curated public domain passages, historical literature, open-source texts, and original writing. These texts are provided exclusively for educational and typing practice purposes.',
      ],
    },
    {
      icon: AlertOctagon,
      title: '6. Limitation of Liability & Termination',
      content: [
        'Service "As Is": KeySpeed is provided on an "as is" and "as available" basis without warranties of any kind regarding server uptime, latency, or connection stability.',
        'Maintenance & Outages: Multiplayer matchmaking and socket connections may be temporarily paused for routine server maintenance, database updates, or game balancing.',
        'Termination: We reserve the right to suspend or terminate accounts that breach these Terms, tamper with game mechanics, or disrupt the community experience.',
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
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-fg tracking-tight">
              Terms & <span className="text-accent">Conditions</span>
            </h1>
            <p className="text-xs text-fg/60 mt-1">
              Last updated: <span className="font-medium text-fg/80">{lastUpdated}</span> • Fair Play & Community Rules
            </p>
          </div>
        </div>
      </div>

      {/* Overview Notice */}
      <div className="p-6 rounded-2xl bg-surface border border-border shadow-card text-xs text-fg/80 leading-relaxed space-y-3">
        <p>
          Welcome to <strong className="text-fg font-semibold">KeySpeed</strong>. These Terms and Conditions govern your access to and use of our competitive typing platform, real-time multiplayer servers, and leaderboard ranking services.
        </p>
        <p>
          Our priority is maintaining an authentic, lightning-fast, and cheat-free environment for typists worldwide. By racing on KeySpeed, you commit to our fair play standards.
        </p>
      </div>

      {/* Sections */}
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

      {/* Action Footer */}
      <div className="p-6 rounded-2xl bg-surface-hover/30 border border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div>
          <p className="font-bold text-fg">Ready to test your typing speed?</p>
          <p className="text-fg/60 mt-0.5">Compete against live racers or practice solo on original paragraphs.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/privacy"
            className="px-4 py-2 rounded-xl font-semibold bg-surface border border-border-strong text-fg hover:bg-surface-hover transition-all cursor-pointer"
          >
            Read Privacy Policy
          </Link>
          <Link
            to="/solo"
            className="px-4 py-2 rounded-xl font-semibold bg-accent text-bg hover:opacity-90 transition-all cursor-pointer"
          >
            Solo Practice
          </Link>
        </div>
      </div>
    </div>
  );
}

