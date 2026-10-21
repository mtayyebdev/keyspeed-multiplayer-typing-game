import { baseApi } from '../../app/baseApi';
import { setCredentials, setUser, setUnauthenticated, logout as logoutAction } from './authSlice';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation({
      query: (credentials) => ({
        url: '/auth/register',
        method: 'POST',
        body: credentials,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data));
        } catch (err) {
          // Handled in UI
        }
      },
      invalidatesTags: ['User'],
    }),
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data));
        } catch (err) {
          // Handled in UI
        }
      },
      invalidatesTags: ['User'],
    }),
    logout: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          dispatch(logoutAction());
          dispatch(baseApi.util.resetApiState());
        }
      },
    }),
    getMe: builder.query({
      query: () => '/users/me',
      providesTags: ['User'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setUser(data));
        } catch (err) {
          dispatch(setUnauthenticated());
        }
      },
    }),
    getUserProfile: builder.query({
      query: (username) => `/users/${username}`,
      providesTags: (result, error, username) => [{ type: 'User', id: username }],
    }),
    getMyResults: builder.query({
      query: () => '/users/me/results',
      providesTags: ['SoloResult', 'RaceResult'],
    }),
    changePassword: builder.mutation({
      query: (body) => ({
        url: '/users/change-password',
        method: 'PUT',
        body,
      }),
    }),
    deleteAccount: builder.mutation({
      query: () => ({
        url: '/users/me',
        method: 'DELETE',
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          dispatch(logoutAction());
          dispatch(baseApi.util.resetApiState());
        }
      },
      invalidatesTags: ['User', 'Leaderboard', 'SoloResult', 'RaceResult'],
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
  useGetUserProfileQuery,
  useGetMyResultsQuery,
  useChangePasswordMutation,
  useDeleteAccountMutation,
} = authApi;

