import { baseApi } from '../../../app/baseApi';

export const adminRacesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRaces: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.set('page', params.page);
        if (params.limit) searchParams.set('limit', params.limit);
        if (params.mode && params.mode !== 'all') searchParams.set('mode', params.mode);
        if (params.startDate) searchParams.set('startDate', params.startDate);
        if (params.endDate) searchParams.set('endDate', params.endDate);
        if (params.isPrivate !== undefined && params.isPrivate !== 'all') {
          searchParams.set('isPrivate', params.isPrivate);
        }
        if (params.hasBots === true) searchParams.set('hasBots', 'true');
        if (params.hasFlagged === true) searchParams.set('hasFlagged', 'true');
        return `/admin/races?${searchParams.toString()}`;
      },
      providesTags: ['AdminRaces'],
    }),

    getRaceDetail: builder.query({
      query: (id) => `/admin/races/${id}`,
      providesTags: (result, error, id) => [{ type: 'AdminRaces', id }],
    }),

    deleteRace: builder.mutation({
      query: (id) => ({
        url: `/admin/races/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminRaces', 'AdminOverview', 'AdminUsers', 'AdminLeaderboard'],
    }),
  }),
});

export const {
  useGetRacesQuery,
  useGetRaceDetailQuery,
  useDeleteRaceMutation,
} = adminRacesApi;

