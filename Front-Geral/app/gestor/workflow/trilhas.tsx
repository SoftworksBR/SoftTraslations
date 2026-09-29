import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';

import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
} from 'react-native';
import { deletePath, getPaths } from '@/services/paths';
import type { Path } from '@/services/paths';
import type { ProjectStatus } from '@/services/projects';
import { alertar } from '@/services/alerta';

const statusLabels: Record<ProjectStatus, string> = {
  ready: 'Pronto',
  in_progress: 'Em andamento',
  testing: 'Em teste',
  done: 'Concluído',
};

export default function Trilhas() {
  const [trilhas, setTrilhas] = useState<Path[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadPaths = useCallback(async () => {
    setLoading(true);
    try {
      setTrilhas(await getPaths());
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Falha ao carregar trilhas.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadPaths();
    }, [loadPaths]),
  );

  function excluirTrilha(id: number, nome: string) {
    alertar(
      'Excluir trilha',
      `Tem certeza que deseja excluir a trilha "${nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await deletePath(id);
                await loadPaths();
              } catch (error) {
                alertar(
                  'Não foi possível excluir',
                  error instanceof Error ? error.message : 'Tente novamente.',
                );
              }
            })();
          },
        },
      ],
    );
  }

  return (
    <View style={styles.container}>

      <Pressable
        style={styles.voltar}
        onPress={() => router.back()}
      >
        <Text style={styles.voltarText}>
          ← Voltar
        </Text>
      </Pressable>

      <Text style={styles.title}>
        Trilhas
      </Text>

      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={trilhas}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {errorMessage || 'Nenhuma Trilha cadastrada.'}
            </Text>
          }
          renderItem={({ item }) => (

          <View style={styles.card}>

            <View style={styles.cardHeader}>
              <Text style={styles.nome}>
                {item.name}
              </Text>

              <Pressable
                onPress={() => excluirTrilha(item.id, item.name)}
              >
                <Text style={styles.excluir}>Excluir</Text>
              </Pressable>
            </View>

            {item.stages.map((stage, index) => (
                <View
                  key={stage.id}
                  style={styles.etapa}
                >
                  <Text style={styles.numero}>
                    {index + 1}
                  </Text>

                  <Text style={styles.quadro}>
                    {stage.name} · {statusLabels[stage.status]}
                  </Text>
                </View>
              ))}

          </View>

          )}
        />
      )}

      <Pressable
        style={styles.botao}
        onPress={() =>
          router.push(
            '/gestor/workflow/nova-trilha'
          )
        }
      >
        <Text style={styles.botaoText}>
          CRIAR NOVA TRILHA
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 18,
    marginBottom: 15,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },

  nome: {
    fontSize: 20,
    fontWeight: 'bold',
  },

  excluir: {
    color: '#a32020',
    fontWeight: 'bold',
    fontSize: 14,
  },

  etapa: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  numero: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#000',
    color: '#fff',
    textAlign: 'center',
    paddingTop: 5,
    marginRight: 10,
  },

  quadro: {
    fontSize: 16,
  },

  empty: { color: '#666', paddingVertical: 16 },

  botao: {
    height: 55,
    backgroundColor: '#000',
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

  botaoText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  
  voltar: {
    marginBottom: 15,
  },

  voltarText: {
    fontSize: 16,
    fontWeight: '600',
  },
});