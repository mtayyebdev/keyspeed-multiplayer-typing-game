import { baseApi } from '../../app/baseApi';

export const soloApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRandomText: builder.query({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.difficulty && params.difficulty !== 'all') {
          queryParams.append('difficulty', params.difficulty);
        }
        if (params?.length && params.length !== 'all') {
          queryParams.append('length', params.length);
        }
        const qs = queryParams.toString();
        return qs ? `/texts/random?${qs}` : '/texts/random';
      },
      keepUnusedDataFor: 0, // Always fetch fresh text on request
    }),
    submitSolo: builder.mutation({
      query: (body) => ({
        url: '/solo/submit',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User', 'Leaderboard', 'SoloResult'],
    }),
  }),
});

export const { useGetRandomTextQuery, useLazyGetRandomTextQuery, useSubmitSoloMutation } =
  soloApi;

