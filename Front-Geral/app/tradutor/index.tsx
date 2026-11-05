import { Redirect } from 'expo-router';

import { useAuth } from '@/context/AuthContext';

export default function TradutorIndex() {
  const { employee } = useAuth();

  if (!employee) {
    return <Redirect href="/login" />;
  }

  return employee.status === 'pending'
    ? <Redirect href="/tradutor/completar-perfil" />
    : <Redirect href="/tradutor/servicos" />;
}
