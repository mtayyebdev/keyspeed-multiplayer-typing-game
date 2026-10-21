import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminLayout from './layout/AdminLayout';
import { adminRoutes } from './routes';

export default function AdminApp() {
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        {adminRoutes.map((r, idx) =>
          r.index ? (
            <Route key="index" index element={r.element} />
          ) : (
            <Route key={r.path || idx} path={r.path} element={r.element} />
          ),
        )}
      </Route>
    </Routes>
  );
}

