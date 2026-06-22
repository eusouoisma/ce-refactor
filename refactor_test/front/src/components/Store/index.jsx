import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_URL } from '../../utils/env';
import { apiFetch } from '../../utils/api';
import { getToken, setToken, getPermissions, setPermissions, getUserName, setUserName, clearStorage } from '../../utils/storage';

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [userName, setUserNameState] = useState(getUserName() || '');
  const [userUsername, setUserUsernameState] = useState('');
  const [userPermissions, setUserPermissionsState] = useState(getPermissions() || '');
  const [currentYear, setCurrentYear] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(`${API_URL}/users/getUser?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          clearStorage();
          setUserNameState('');
          setUserUsernameState('');
          setUserPermissionsState('');
        } else {
          setUserNameState(data.name);
          setUserUsernameState(data.username);
          setUserPermissionsState(data.permissions);
          setUserName(data.name);
          setPermissions(data.permissions);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    apiFetch('/settings/current-year')
      .then(r => r.json())
      .then(val => setCurrentYear(val || ''))
      .catch(() => {});
  }, []);

  function login(token, permissions, name) {
    setToken(token);
    setPermissions(permissions);
    setUserName(name);
    setUserNameState(name);
    setUserPermissionsState(permissions);
  }

  function updateName(name) {
    setUserName(name);
    setUserNameState(name);
  }

  function logout() {
    clearStorage();
    setUserNameState('');
    setUserUsernameState('');
    setUserPermissionsState('');
  }

  return (
    <StoreContext.Provider value={{ userName, userUsername, userPermissions, currentYear, setCurrentYear, login, updateName, logout, loading }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
