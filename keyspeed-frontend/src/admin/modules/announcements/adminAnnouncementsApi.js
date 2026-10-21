import { baseApi } from '../../../app/baseApi';

export const adminAnnouncementsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAnnouncements: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.set('page', params.page);
        if (params.limit) searchParams.set('limit', params.limit);
        return `/admin/announcements?${searchParams.toString()}`;
      },
      providesTags: ['AdminAnnouncements'],
    }),

    getActiveAnnouncements: builder.query({
      query: () => '/announcements/active',
      providesTags: ['AdminAnnouncements'],
    }),

    createAnnouncement: builder.mutation({
      query: (body) => ({
        url: '/admin/announcements',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AdminAnnouncements', 'AdminAudit'],
    }),

    updateAnnouncement: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/announcements/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['AdminAnnouncements', 'AdminAudit'],
    }),

    deleteAnnouncement: builder.mutation({
      query: (id) => ({
        url: `/admin/announcements/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminAnnouncements', 'AdminAudit'],
    }),
  }),
});

export const {
  useGetAnnouncementsQuery,
  useGetActiveAnnouncementsQuery,
  useCreateAnnouncementMutation,
  useUpdateAnnouncementMutation,
  useDeleteAnnouncementMutation,
} = adminAnnouncementsApi;

