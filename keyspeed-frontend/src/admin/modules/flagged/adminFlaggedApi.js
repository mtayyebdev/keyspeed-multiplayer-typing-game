import { baseApi } from '../../../app/baseApi';

export const adminFlaggedApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFlagged: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.set('page', params.page);
        if (params.limit) searchParams.set('limit', params.limit);
        if (params.status && params.status !== 'all') searchParams.set('status', params.status);
        if (params.gameId && params.gameId !== 'all') searchParams.set('gameId', params.gameId);
        return `/admin/flagged?${searchParams.toString()}`;
      },
      providesTags: ['AdminFlagged'],
    }),

    approveFlagged: builder.mutation({
      query: (resultId) => ({
        url: `/admin/flagged/${resultId}/approve`,
        method: 'POST',
      }),
      invalidatesTags: ['AdminFlagged', 'AdminOverview', 'AdminLeaderboard', 'AdminUsers', 'AdminAudit'],
    }),

    rejectFlagged: builder.mutation({
      query: (resultId) => ({
        url: `/admin/flagged/${resultId}/reject`,
        method: 'POST',
      }),
      invalidatesTags: ['AdminFlagged', 'AdminOverview', 'AdminAudit'],
    }),

    rejectAndBan: builder.mutation({
      query: ({ resultId, reason }) => ({
        url: `/admin/flagged/${resultId}/reject-and-ban`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['AdminFlagged', 'AdminOverview', 'AdminUsers', 'AdminAudit'],
    }),
  }),
});

export const {
  useGetFlaggedQuery,
  useApproveFlaggedMutation,
  useRejectFlaggedMutation,
  useRejectAndBanMutation,
} = adminFlaggedApi;

