import { baseApi } from '../../../app/baseApi';

export const adminTextsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTexts: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.set('page', params.page);
        if (params.limit) searchParams.set('limit', params.limit);
        if (params.search) searchParams.set('search', params.search);
        if (params.difficulty && params.difficulty !== 'all') searchParams.set('difficulty', params.difficulty);
        if (params.language && params.language !== 'all') searchParams.set('language', params.language);
        if (params.status && params.status !== 'all') searchParams.set('status', params.status);
        return `/admin/texts?${searchParams.toString()}`;
      },
      providesTags: ['AdminTexts'],
    }),

    createText: builder.mutation({
      query: (body) => ({
        url: '/admin/texts',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AdminTexts', 'AdminOverview', 'AdminAudit'],
    }),

    updateText: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/texts/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['AdminTexts', 'AdminOverview', 'AdminAudit'],
    }),

    deleteText: builder.mutation({
      query: (id) => ({
        url: `/admin/texts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminTexts', 'AdminOverview', 'AdminAudit'],
    }),

    importTexts: builder.mutation({
      query: (items) => ({
        url: '/admin/texts/import',
        method: 'POST',
        body: { items },
      }),
      invalidatesTags: ['AdminTexts', 'AdminOverview', 'AdminAudit'],
    }),
  }),
});

export const {
  useGetTextsQuery,
  useCreateTextMutation,
  useUpdateTextMutation,
  useDeleteTextMutation,
  useImportTextsMutation,
} = adminTextsApi;

