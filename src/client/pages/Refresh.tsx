import { Navigate, useLocation } from 'react-router-dom';

export default function Refresh() {
  const location = useLocation();
  return <Navigate to={location.state || '/'} replace />;
}
