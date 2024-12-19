import { useLocation, useNavigate } from 'react-router-dom';

export default function useRefresh() {
  const location = useLocation();
  const navigate = useNavigate();

  return () => {
    navigate('/refresh', {
      state: location.pathname + location.hash
    });
  };
}
