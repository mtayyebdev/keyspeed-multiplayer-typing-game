import React, { useState } from 'react';
import { useGetActiveAnnouncementsQuery } from '../../admin/modules/announcements/adminAnnouncementsApi';
import { AlertTriangle, Info, X } from 'lucide-react';

export default function AnnouncementBanner() {
  const { data: activeList = [] } = useGetActiveAnnouncementsQuery(undefined, {
    pollingInterval: 15000,
    refetchOnMountOrArgChange: true,
  });
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      return JSON.parse(
        sessionStorage.getItem('keyspeed_dismissed_banners') ||
          sessionStorage.getItem('typearena_dismissed_banners') ||
          '[]',
      );
    } catch {
      return [];
    }
  });

  const handleDismiss = (id) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    try {
      sessionStorage.setItem('keyspeed_dismissed_banners', JSON.stringify(updated));
    } catch {
      // Ignored
    }
  };

  const visibleAnnouncements = Array.isArray(activeList)
    ? activeList.filter((a) => !dismissedIds.includes(a._id))
    : [];

  if (!visibleAnnouncements.length) return null;

  return (
    <div className="w-full flex flex-col z-40">
      {visibleAnnouncements.map((ann) => (
        <div
          key={ann._id}
          className={`px-4 py-2 text-xs font-medium border-b flex items-center justify-between gap-3 ${
            ann.type === 'warning'
              ? 'bg-danger-soft text-danger border-danger/30'
              : 'bg-accent-soft text-accent border-accent/30'
          }`}
        >
          <div className="max-w-7xl mx-auto flex items-center gap-2 flex-1 justify-center text-center">
            {ann.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <Info className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{ann.message}</span>
          </div>

          <button
            onClick={() => handleDismiss(ann._id)}
            className="p-1 rounded hover:bg-current/10 cursor-pointer transition-colors flex-shrink-0"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

