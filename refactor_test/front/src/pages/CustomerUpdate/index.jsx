import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CustomerUpdate() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/listar-clientes', { replace: true }); }, [navigate]);
  return null;
}
