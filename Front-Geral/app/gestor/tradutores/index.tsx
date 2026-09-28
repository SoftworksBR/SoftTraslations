import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { getEmployees, type Employee } from '@/services/employees';

import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
} from 'react-native';

export default function Tradutores() {
  const [tradutores, setTradutores] = useState<Employee[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const carregarTradutores = useCallback(async () => {
    setCarregando(true);
    try {
      const employees = await getEmployees();
      setTradutores(
        employees.filter((employee) => employee.role === 'freelancer'),
      );
      setErro('');
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : 'Falha ao carregar tradutores.',
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void carregarTradutores();
    }, [carregarTradutores]),
  );

  function novoTradutor() {
    router.push('/gestor/tradutores/novo');
  }

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        Tradutores
      </Text>

      {carregando ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={tradutores}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={
            <Text style={styles.status}>
              {erro || 'Nenhum tradutor cadastrado.'}
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.info}>
                <Text style={styles.nome}>{item.username}</Text>
                <Text style={styles.id}>ID: {item.id}</Text>
                <Text style={styles.status}>{item.email}</Text>
              </View>
            </View>
          )}
        />
      )}

      <Pressable
        style={styles.botao}
        onPress={novoTradutor}
      >
        <Text style={styles.botaoText}>
          PRÉ-CADASTRAR TRADUTOR
        </Text>
      </Pressable>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  card: {
    minHeight: 100,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'stretch',
  },

  info: {
    flex: 1,
    padding: 18,
    justifyContent: 'center',
  },

  nome: {
    fontSize: 19,
    fontWeight: 'bold',
  },

  id: {
    marginTop: 5,
    fontSize: 15,
    color: '#666',
  },

  status: {
    marginTop: 8,
    fontSize: 14,
    color: '#555',
  },

  botao: {
    height: 55,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 7,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },

  botaoText: {
    fontWeight: 'bold',
    fontSize: 15,
  },

});