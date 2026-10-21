import { baseApi } from '../../../app/baseApi';

export const adminOverviewApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOverviewStats: builder.query({
      query: () => '/admin/stats/overview',
      providesTags: ['AdminOverview'],
    }),
    getOverviewCharts: builder.query({
      query: (range = 30) => `/admin/stats/charts?range=${range}`,
      providesTags: ['AdminOverview'],
    }),
  }),
});

export const {
  useGetOverviewStatsQuery,
  useGetOverviewChartsQuery,
} = adminOverviewApi;

