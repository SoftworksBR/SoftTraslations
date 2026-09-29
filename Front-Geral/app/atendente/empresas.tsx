import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { getEmpresas, type Empresa } from '@/services/empresas';

import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
} from 'react-native';

export default function Empresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const carregarEmpresas = useCallback(async () => {
    setCarregando(true);
    try {
      const resultado = await getEmpresas();
      setEmpresas(resultado);
      setErro('');
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : 'Falha ao carregar empresas.',
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void carregarEmpresas();
    }, [carregarEmpresas]),
  );

  function novaEmpresa() {
    router.push('/atendente/nova-empresa');
  }

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        Empresas
      </Text>

      {carregando ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={empresas}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={
            <Text style={styles.status}>
              {erro || 'Nenhuma empresa cadastrada.'}
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.info}>
                <Text style={styles.nome}>{item.razao_social}</Text>
                <Text style={styles.status}>CNPJ: {item.cnpj}</Text>
              </View>
            </View>
          )}
        />
      )}

      <Pressable
        style={styles.botao}
        onPress={novaEmpresa}
      >
        <Text style={styles.botaoText}>
          CADASTRAR EMPRESA
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
