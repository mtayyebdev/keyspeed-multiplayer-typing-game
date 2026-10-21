import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { router } from './routes';
import { useGetMeQuery } from './features/auth/authApi';

export default function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, isInitialized } = useSelector((state) => state.auth);
  const theme = useSelector((state) => state.theme?.current || 'midnight');

  // Verify auth session via HTTP-only cookie on load
  useGetMeQuery();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch({ type: 'socket/connect' });
    } else if (isInitialized) {
      dispatch({ type: 'socket/disconnect' });
    }
  }, [isAuthenticated, isInitialized, dispatch]);

  return <RouterProvider router={router} />;
}
