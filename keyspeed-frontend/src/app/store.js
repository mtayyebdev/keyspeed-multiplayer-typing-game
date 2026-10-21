import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from './baseApi';
import { socketMiddleware } from './socketMiddleware';
import authReducer from '../features/auth/authSlice';
import soloReducer from '../features/solo/soloSlice';
import raceReducer from '../features/race/raceSlice';
import themeReducer from '../features/theme/themeSlice';

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
    solo: soloReducer,
    race: raceReducer,
    theme: themeReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware, socketMiddleware),
});

