import { baseApi } from '../../../app/baseApi';

export const adminLeaderboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminLeaderboard: builder.query({
      query: (scope = 'alltime') => `/admin/leaderboard?scope=${scope}`,
      providesTags: ['AdminLeaderboard'],
    }),

    removeLeaderboardEntry: builder.mutation({
      query: (resultId) => ({
        url: `/admin/leaderboard/${resultId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminLeaderboard', 'AdminOverview', 'AdminUsers', 'AdminAudit'],
    }),

    resetDailyLeaderboard: builder.mutation({
      query: () => ({
        url: '/admin/leaderboard/reset-daily',
        method: 'POST',
      }),
      invalidatesTags: ['AdminLeaderboard', 'AdminAudit'],
    }),

    recalculateLeaderboard: builder.mutation({
      query: () => ({
        url: '/admin/leaderboard/recalculate',
        method: 'POST',
      }),
      invalidatesTags: ['AdminLeaderboard', 'AdminOverview', 'AdminUsers', 'AdminAudit'],
    }),
  }),
});

export const {
  useGetAdminLeaderboardQuery,
  useRemoveLeaderboardEntryMutation,
  useResetDailyLeaderboardMutation,
  useRecalculateLeaderboardMutation,
} = adminLeaderboardApi;

