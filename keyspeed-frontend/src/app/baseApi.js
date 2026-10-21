import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = getState()?.auth?.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: [
    'User',
    'Leaderboard',
    'SoloResult',
    'RaceResult',
    'AdminOverview',
    'AdminUsers',
    'AdminRaces',
    'AdminFlagged',
    'AdminTexts',
    'AdminLeaderboard',
    'AdminLive',
    'AdminSettings',
    'AdminAnnouncements',
    'AdminAudit',
  ],
  endpoints: () => ({}),
});

