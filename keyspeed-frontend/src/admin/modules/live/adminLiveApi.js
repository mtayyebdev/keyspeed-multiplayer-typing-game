import { baseApi } from '../../../app/baseApi';

export const adminLiveApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLiveSummary: builder.query({
      query: () => '/admin/live/summary',
      providesTags: ['AdminLive'],
    }),

    closeRoom: builder.mutation({
      query: (roomId) => ({
        url: `/admin/live/rooms/${roomId}/close`,
        method: 'POST',
      }),
      invalidatesTags: ['AdminLive', 'AdminOverview', 'AdminAudit'],
    }),

    disconnectLiveUser: builder.mutation({
      query: (userId) => ({
        url: `/admin/live/users/${userId}/disconnect`,
        method: 'POST',
      }),
      invalidatesTags: ['AdminLive', 'AdminOverview', 'AdminAudit'],
    }),
  }),
});

export const {
  useGetLiveSummaryQuery,
  useCloseRoomMutation,
  useDisconnectLiveUserMutation,
} = adminLiveApi;

