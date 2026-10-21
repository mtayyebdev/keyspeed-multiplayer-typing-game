import React, { useState } from 'react';
import {
  Radio,
  Play,
  Users,
  XCircle,
  Bot,
  UserX,
} from 'lucide-react';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import ConfirmModal from '../../components/ConfirmModal';
import { useToast } from '../../components/ToastContext';
import { useAdminSocket } from '../../hooks/useAdminSocket';
import {
  useGetLiveSummaryQuery,
  useCloseRoomMutation,
  useDisconnectLiveUserMutation,
} from './adminLiveApi';
import { formatNumber } from '../../lib/formatters';

export default function LiveMonitoringPage() {
  const toast = useToast();

  // Socket stream with fallback to periodic REST polling
  const { liveData: socketData, isConnected } = useAdminSocket();
  const { data: restData, isLoading } = useGetLiveSummaryQuery(undefined, {
    pollingInterval: isConnected ? 0 : 3500,
  });

  const [closeRoom] = useCloseRoomMutation();
  const [disconnectUser] = useDisconnectLiveUserMutation();

  const [modalState, setModalState] = useState({
    type: null, // 'closeRoom' | 'disconnectUser'
    targetId: null,
    targetName: null,
    isLoading: false,
  });

  const activeSummary = socketData || restData || {
    onlineUsers: 0,
    activeRoomsCount: 0,
    queueSize: 0,
    rooms: [],
  };

  const handleExecuteModalAction = async () => {
    setModalState((prev) => ({ ...prev, isLoading: true }));
    try {
      if (modalState.type === 'closeRoom') {
        const res = await closeRoom(modalState.targetId).unwrap();
        toast.success(res.message);
      } else if (modalState.type === 'disconnectUser') {
        const res = await disconnectUser(modalState.targetId).unwrap();
        toast.success(res.message);
      }
      setModalState({ type: null, targetId: null, targetName: null, isLoading: false });
    } catch (err) {
      toast.error(err.data?.message || err.message || 'Action failed');
      setModalState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Socket Connection Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-fg tracking-tight">Live Platform Monitoring</h2>
          <p className="text-xs text-fg/60 mt-0.5">
            Supervise ongoing multiplayer races, spectator rooms, and matchmaking queues in real-time
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              isConnected
                ? 'bg-accent-soft text-accent border-accent/30'
                : 'bg-surface text-fg/60 border-border'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-accent animate-pulse' : 'bg-fg/40'
              }`}
            />
            <span>{isConnected ? 'Live Socket Stream' : 'Auto-Polling'}</span>
          </span>
        </div>
      </div>

      {/* Counters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Online Racers"
          value={formatNumber(activeSummary.onlineUsers)}
          subtitle="Currently active in races"
          icon={Radio}
        />
        <StatCard
          title="Active Race Rooms"
          value={formatNumber(activeSummary.activeRoomsCount)}
          subtitle="Lobbies and in-progress races"
          icon={Play}
        />
        <StatCard
          title="Matchmaking Queue"
          value={formatNumber(activeSummary.queueSize)}
          subtitle="Players waiting for matchmaking"
          icon={Users}
        />
      </div>

      {/* Active Rooms Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-fg tracking-tight">
            Active Rooms ({activeSummary.rooms?.length || 0})
          </h3>
          <span className="text-xs text-fg/50">Auto-refreshed live</span>
        </div>

        {isLoading && !activeSummary.rooms?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-48 bg-surface rounded-2xl border border-border animate-pulse" />
            <div className="h-48 bg-surface rounded-2xl border border-border animate-pulse" />
          </div>
        ) : activeSummary.rooms?.length === 0 ? (
          <div className="card p-10 text-center text-fg/50 text-xs">
            No race rooms are currently active on the server.
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {activeSummary.rooms.map((room) => (
              <div
                key={room.roomId}
                className="p-5 rounded-2xl bg-surface border border-border shadow-card flex flex-col justify-between space-y-4"
              >
                {/* Room Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-sm text-fg">
                        Room: {room.roomId.slice(-8)}
                      </span>
                      <StatusBadge status={room.status} />
                      {room.isPrivate && (
                        <span className="text-[10px] font-mono uppercase bg-fg/10 text-fg px-1.5 py-0.5 rounded border border-border">
                          Private: {room.roomCode}
                        </span>
                      )}
                    </div>
                    {room.textPreview && (
                      <p className="text-xs text-fg/60 font-mono mt-1.5 truncate max-w-sm">
                        {room.textPreview}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() =>
                      setModalState({
                        type: 'closeRoom',
                        targetId: room.roomId,
                        targetName: room.roomId,
                        isLoading: false,
                      })
                    }
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-danger-soft text-danger border border-danger/30 hover:bg-danger hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                    title="Close this room and terminate race"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Close Room</span>
                  </button>
                </div>

                {/* Players List with Progress Bars */}
                <div className="space-y-2.5 pt-2 border-t border-border/50">
                  {room.players.map((p, idx) => {
                    const isLeader = idx === 0 && p.progress > 0;
                    return (
                      <div key={p.id || idx} className="space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {p.isBot ? (
                              <Bot className="w-3.5 h-3.5 text-fg/50" />
                            ) : (
                              <Users className="w-3.5 h-3.5 text-accent" />
                            )}
                            <span className="font-semibold text-fg">
                              {p.isBot ? `🤖 ${p.username}` : `@${p.username}`}
                            </span>
                            {p.flagged && (
                              <span className="text-[10px] bg-danger-soft text-danger px-1 rounded font-bold">
                                Flagged
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-mono text-accent font-semibold">
                              {p.wpm} WPM
                            </span>
                            <span className="text-fg/50">{p.progress}%</span>

                            {/* Disconnect button for human racers */}
                            {!p.isBot && p.userId && (
                              <button
                                onClick={() =>
                                  setModalState({
                                    type: 'disconnectUser',
                                    targetId: p.userId,
                                    targetName: p.username,
                                    isLoading: false,
                                  })
                                }
                                title="Disconnect user from socket"
                                aria-label="Disconnect user"
                                className="p-1 text-fg/40 hover:text-danger hover:bg-danger-soft rounded cursor-pointer transition-colors"
                              >
                                <UserX className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Progress track */}
                        <div className="w-full h-1.5 bg-bg rounded-full overflow-hidden border border-border/40">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isLeader ? 'bg-accent' : 'bg-fg/50'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, p.progress))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={modalState.type === 'closeRoom'}
        onClose={() => setModalState({ type: null, targetId: null, targetName: null, isLoading: false })}
        onConfirm={handleExecuteModalAction}
        title="Close Active Race Room?"
        description="All participants will be immediately disconnected from the session and the room destroyed."
        confirmText="Close Room"
        isDestructive={true}
        isLoading={modalState.isLoading}
      />

      <ConfirmModal
        isOpen={modalState.type === 'disconnectUser'}
        onClose={() => setModalState({ type: null, targetId: null, targetName: null, isLoading: false })}
        onConfirm={handleExecuteModalAction}
        title={`Disconnect @${modalState.targetName}?`}
        description="Forces immediate termination of the racer's active socket connection."
        confirmText="Disconnect User"
        isDestructive={true}
        isLoading={modalState.isLoading}
      />
    </div>
  );
}
