import { RoomService, HumanPlayer } from './room.service';

describe('RoomService - Player Removal and Live Updates', () => {
  let roomService: RoomService;

  beforeEach(() => {
    roomService = new RoomService();
  });

  const createMockPlayer = (id: string, username: string, isHost: boolean): HumanPlayer => ({
    id,
    userId: `user_${id}`,
    username,
    avgWpm: 60,
    isBot: false,
    isHost,
    progress: 0,
    wpm: 0,
    accuracy: 100,
    errors: 0,
    flagged: false,
    finished: false,
  });

  it('removes a guest player and preserves the host', () => {
    const host = createMockPlayer('socket_1', 'HostRacer', true);
    const guest = createMockPlayer('socket_2', 'GuestRacer', false);

    const room = roomService.createRoom('room_1', host, 'text_1', 'Sample text', true, 'ABC123');
    room.players.set(guest.id, guest);

    expect(room.players.size).toBe(2);

    const result = roomService.removePlayer('socket_2', 'room_1');
    expect(result.emptied).toBe(false);
    expect(result.wasHost).toBe(false);
    expect(room.players.size).toBe(1);
    expect(room.players.has('socket_2')).toBe(false);
    expect(room.players.has('socket_1')).toBe(true);
    expect(room.hostId).toBe('socket_1');
  });

  it('reassigns host to remaining human player when host leaves', () => {
    const host = createMockPlayer('socket_1', 'HostRacer', true);
    const guest = createMockPlayer('socket_2', 'GuestRacer', false);

    const room = roomService.createRoom('room_1', host, 'text_1', 'Sample text', true, 'ABC123');
    room.players.set(guest.id, guest);

    const result = roomService.removePlayer('socket_1', 'room_1');
    expect(result.emptied).toBe(false);
    expect(result.wasHost).toBe(true);
    expect(room.players.size).toBe(1);
    expect(room.players.has('socket_1')).toBe(false);
    expect(room.players.has('socket_2')).toBe(true);
    expect(room.hostId).toBe('socket_2');

    const newHost = room.players.get('socket_2') as HumanPlayer;
    expect(newHost.isHost).toBe(true);
  });

  it('destroys room and marks emptied when the last player leaves', () => {
    const host = createMockPlayer('socket_1', 'SoloRacer', true);
    const room = roomService.createRoom('room_1', host, 'text_1', 'Sample text', true, 'ABC123');

    const result = roomService.removePlayer('socket_1', 'room_1');
    expect(result.emptied).toBe(true);
    expect(result.wasHost).toBe(true);
    expect(roomService.getRoom('room_1')).toBeUndefined();
  });

  it('finds and removes player by roomCode and userId if socketId changed', () => {
    const host = createMockPlayer('socket_old', 'ReconnectingRacer', true);
    roomService.createRoom('room_1', host, 'text_1', 'Sample text', true, 'XYZ789');

    const result = roomService.removePlayer(
      'socket_different',
      undefined,
      'user_socket_old',
      'XYZ789',
    );

    expect(result.emptied).toBe(true);
    expect(roomService.getRoom('room_1')).toBeUndefined();
  });
});

