export function getToken() {
  return localStorage.getItem('ce_token');
}

export function setToken(token) {
  localStorage.setItem('ce_token', token);
}

export function getPermissions() {
  return localStorage.getItem('ce_permissions');
}

export function setPermissions(permissions) {
  localStorage.setItem('ce_permissions', permissions);
}

export function getUserName() {
  return localStorage.getItem('ce_username');
}

export function setUserName(name) {
  localStorage.setItem('ce_username', name);
}

export function clearStorage() {
  localStorage.removeItem('ce_token');
  localStorage.removeItem('ce_permissions');
  localStorage.removeItem('ce_username');
}
