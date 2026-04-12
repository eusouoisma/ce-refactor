import React from 'react';
import { Navigate } from 'react-router-dom';
import { useStore } from '../../Store';
import { getToken } from '../../../utils/storage';

export default function PrivateRoute({ children, permissions }) {
  const { userPermissions } = useStore();
  const token = getToken();

  if (!token) return <Navigate to="/login" replace />;
  if (!userPermissions) return null; // loading

  const perm = parseInt(userPermissions);
  if (permissions && !permissions.includes(perm)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
