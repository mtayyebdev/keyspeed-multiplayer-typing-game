import { baseApi } from '../../../app/baseApi';

export const adminSettingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminSettings: builder.query({
      query: () => '/admin/settings',
      providesTags: ['AdminSettings'],
    }),

    getPublicSettings: builder.query({
      query: () => '/settings/public',
    }),

    updateAdminSettings: builder.mutation({
      query: (body) => ({
        url: '/admin/settings',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['AdminSettings', 'AdminOverview', 'AdminAudit'],
    }),

    resetAdminSettings: builder.mutation({
      query: () => ({
        url: '/admin/settings/reset',
        method: 'POST',
      }),
      invalidatesTags: ['AdminSettings', 'AdminOverview', 'AdminAudit'],
    }),
  }),
});

export const {
  useGetAdminSettingsQuery,
  useGetPublicSettingsQuery,
  useUpdateAdminSettingsMutation,
  useResetAdminSettingsMutation,
} = adminSettingsApi;

