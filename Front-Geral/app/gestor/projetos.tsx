import { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { errorMessage, notify } from '@/services/dialog';
import {
  listProjects,
  projectStatusLabel,
  type Project,
} from '@/services/projects';

export default function Projetos() {
  const [projetos, setProjetos] = useState<Project[]>([]);
  const [carregando, setCarregando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      setCarregando(true);
      listProjects()
        .then((lista) => {
          if (ativo) {
            setProjetos(lista);
          }
        })
        .catch((error) => notify('Erro', errorMessage(error)))
        .finally(() => {
          if (ativo) {
            setCarregando(false);
          }
        });

      return () => {
        ativo = false;
      };
    }, []),
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Projetos</Text>

      <Pressable
        style={styles.botao}
        onPress={() => router.push('/gestor/orcamentos')}
      >
        <Text style={styles.botaoTexto}>+ NOVO PROJETO (A PARTIR DE ORÇAMENTO)</Text>
      </Pressable>

      {carregando ? (
        <ActivityIndicator style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={projetos}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <Text style={styles.vazio}>Nenhum projeto criado.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.nome}>{item.name}</Text>
              <Text style={styles.texto}>
                Status: {projectStatusLabel[item.status]}
              </Text>
              <Text style={styles.texto}>
                Trilhas:{' '}
                {item.paths.length > 0
                  ? item.paths.map((trilha) => trilha.name).join(', ')
                  : 'nenhuma'}
              </Text>
              {item.quote_id !== null && (
                <Text style={styles.texto}>
                  Orçamento nº {item.quote_id}
                </Text>
              )}
            </View>
          )}
        />
      )}
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
    marginBottom: 15,
  },
  botao: {
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  botaoTexto: {
    color: '#fff',
    fontWeight: 'bold',
  },
  lista: {
    paddingBottom: 30,
  },
  vazio: {
    color: '#888',
    textAlign: 'center',
    marginTop: 30,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
  },
  nome: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  texto: {
    color: '#444',
    marginBottom: 2,
  },
});
