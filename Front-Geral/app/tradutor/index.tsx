import {
  Redirect,
  useLocalSearchParams,
} from 'expo-router';

import { useEffect } from 'react';

import { tradutores } from '@/data/tradutores';

import { useTradutor } from '@/context/TradutorContext';

export default function TradutorIndex() {
  const params = useLocalSearchParams<{
    id?: string;
  }>();

  const { entrarComoTradutor } = useTradutor();

  const id = Number(params.id);

  const tradutor = tradutores.find(
    (item) => item.id === id
  );

  useEffect(() => {
    if (tradutor) {
      entrarComoTradutor(tradutor.id);
    }
  }, [tradutor]);

  if (!tradutor) {
    return <Redirect href="/" />;
  }

  if (tradutor.status === 'aguardando_perfil') {
    return (
      <Redirect
        href={`/tradutor/completar-perfil?id=${id}`}
      />
    );
  }

  if (tradutor.status === 'aguardando_aprovacao') {
    return (
      <Redirect
        href={`/tradutor/completar-perfil?id=${id}`}
      />
    );
  }

  if (tradutor.status === 'autorizado') {
    return (
      <Redirect
        href={`/tradutor/servicos?id=${id}`}
      />
    );
  }

  return <Redirect href="/" />;
}