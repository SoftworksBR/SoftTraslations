import {
  Redirect,
  useLocalSearchParams,
} from 'expo-router';

import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

import { tradutores } from '@/data/tradutores';

export default function Servicos() {

  const params = useLocalSearchParams<{
    id?: string;
  }>();

  const id = Number(params.id);

  const tradutor = tradutores.find(
    (item) => item.id === id
  );

  if (!tradutor) {
    return <Redirect href="/" />;
  }

  if (tradutor.status !== 'autorizado') {
    return (
      <Redirect
        href={`/tradutor/completar-perfil?id=${id}`}
      />
    );
  }

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        Serviços
      </Text>

      <Text style={styles.vazio}>
        Nenhum serviço disponível no momento.
      </Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
  },

  vazio: {
    fontSize: 16,
    color: '#666',
  },
});