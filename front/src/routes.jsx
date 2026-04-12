import React from 'react';
import { Navigate } from 'react-router-dom';
import QuickSearch from './pages/QuickSearch';

const routes = [
    {
        path: '/quick-search',
        element: <QuickSearch />
    },
];

export default routes; 