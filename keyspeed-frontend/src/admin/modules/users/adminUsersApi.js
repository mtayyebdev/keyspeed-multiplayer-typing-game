import { baseApi } from '../../../app/baseApi';

export const adminUsersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.set('page', params.page);
        if (params.limit) searchParams.set('limit', params.limit);
        if (params.search) searchParams.set('search', params.search);
        if (params.role && params.role !== 'all') searchParams.set('role', params.role);
        if (params.status && params.status !== 'all') searchParams.set('status', params.status);
        if (params.startDate) searchParams.set('startDate', params.startDate);
        if (params.endDate) searchParams.set('endDate', params.endDate);
        if (params.sortField) searchParams.set('sortField', params.sortField);
        if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
        return `/admin/users?${searchParams.toString()}`;
      },
      providesTags: ['AdminUsers'],
    }),

    getUserDetail: builder.query({
      query: (id) => `/admin/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'AdminUsers', id }],
    }),

    updateUser: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/users/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id }) => ['AdminUsers', { type: 'AdminUsers', id }, 'AdminOverview'],
    }),

    changeUserRole: builder.mutation({
      query: ({ id, role }) => ({
        url: `/admin/users/${id}/role`,
        method: 'PATCH',
        body: { role },
      }),
      invalidatesTags: (result, error, { id }) => ['AdminUsers', { type: 'AdminUsers', id }, 'AdminOverview', 'AdminAudit'],
    }),

    banUser: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/admin/users/${id}/ban`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (result, error, { id }) => ['AdminUsers', { type: 'AdminUsers', id }, 'AdminOverview', 'AdminAudit'],
    }),

    unbanUser: builder.mutation({
      query: (id) => ({
        url: `/admin/users/${id}/unban`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => ['AdminUsers', { type: 'AdminUsers', id }, 'AdminOverview', 'AdminAudit'],
    }),

    resetUserStats: builder.mutation({
      query: (id) => ({
        url: `/admin/users/${id}/reset-stats`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => ['AdminUsers', { type: 'AdminUsers', id }, 'AdminOverview', 'AdminLeaderboard'],
    }),

    forceLogoutUser: builder.mutation({
      query: (id) => ({
        url: `/admin/users/${id}/force-logout`,
        method: 'POST',
      }),
      invalidatesTags: ['AdminUsers', 'AdminAudit'],
    }),

    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/admin/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminUsers', 'AdminOverview', 'AdminLeaderboard', 'AdminAudit'],
    }),

    bulkUserAction: builder.mutation({
      query: (body) => ({
        url: '/admin/users/bulk',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AdminUsers', 'AdminOverview', 'AdminAudit'],
    }),

    exportUsersData: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.role) searchParams.set('role', params.role);
        if (params.status) searchParams.set('status', params.status);
        return `/admin/users/export?${searchParams.toString()}`;
      },
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserDetailQuery,
  useUpdateUserMutation,
  useChangeUserRoleMutation,
  useBanUserMutation,
  useUnbanUserMutation,
  useResetUserStatsMutation,
  useForceLogoutUserMutation,
  useDeleteUserMutation,
  useBulkUserActionMutation,
  useLazyExportUsersDataQuery,
} = adminUsersApi;

