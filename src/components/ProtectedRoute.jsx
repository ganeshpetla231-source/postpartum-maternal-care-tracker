import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import { getAccessTokenPayload, homePathForRole } from '../utils/auth';

function ProtectedRoute({ children, roles }) {
  const location = useLocation();
  const [role, setRole] = useState(() => getAccessTokenPayload()?.role || null);

  useEffect(() => {
    const updateRole = () => setRole(getAccessTokenPayload()?.role || null);
    window.addEventListener('auth:changed', updateRole);
    window.addEventListener('auth:expired', updateRole);
    return () => {
      window.removeEventListener('auth:changed', updateRole);
      window.removeEventListener('auth:expired', updateRole);
    };
  }, []);

  if (!role) {
    return <Navigate to="/account" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }
  if (roles && !roles.includes(role)) {
    return <Navigate to={homePathForRole(role)} replace />;
  }
  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  roles: PropTypes.arrayOf(PropTypes.string)
};

export default ProtectedRoute;
