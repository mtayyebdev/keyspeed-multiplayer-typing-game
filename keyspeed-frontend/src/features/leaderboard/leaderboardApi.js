import { baseApi } from '../../app/baseApi';

export const leaderboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLeaderboard: builder.query({
      query: (arg = 'alltime') => {
        const scope = typeof arg === 'string' ? arg : arg?.scope || 'alltime';
        const gameId = typeof arg === 'object' && arg?.gameId ? arg.gameId : 'classic-race';
        return `/leaderboard?scope=${scope}&gameId=${gameId}`;
      },
      providesTags: ['Leaderboard'],
    }),
  }),
});

export const { useGetLeaderboardQuery } = leaderboardApi;

