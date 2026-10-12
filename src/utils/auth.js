const roles = new Set(['mother', 'family', 'doctor', 'admin']);

export function getAccessTokenPayload() {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;
  try {
    const encodedPayload = token.split('.')[1];
    const base64Payload = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(
      atob(base64Payload.padEnd(base64Payload.length + ((4 - base64Payload.length % 4) % 4), '='))
    );
    return typeof payload.sub === 'string' && roles.has(payload.role) ? payload : null;
  } catch {
    return null;
  }
}

export function saveAccessToken(token) {
  localStorage.setItem('accessToken', token);
  window.dispatchEvent(new Event('auth:changed'));
}

export function clearAccessToken() {
  localStorage.removeItem('accessToken');
  window.dispatchEvent(new Event('auth:changed'));
}

export function homePathForRole(role) {
  if (role === 'family') return '/family';
  if (role === 'doctor') return '/escalations';
  if (role === 'admin') return '/admin';
  return '/dashboard';
}
