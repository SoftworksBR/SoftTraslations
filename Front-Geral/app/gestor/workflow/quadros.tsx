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
import { getStages } from '@/services/stages';
import type { ProjectStage, ProjectStatus } from '@/services/projects';

const statusLabels: Record<ProjectStatus, string> = {
  ready: 'Pronto',
  in_progress: 'Em andamento',
  testing: 'Em teste',
  done: 'Concluído',
};

export default function Quadros() {
  const [stages, setStages] = useState<ProjectStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadStages = useCallback(async () => {
    setLoading(true);
    try {
      setStages(await getStages());
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Falha ao carregar etapas.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadStages();
    }, [loadStages]),
  );

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
        Quadros
      </Text>

      <Pressable
        style={styles.botao}
        onPress={() => router.push('/gestor/workflow/novo-stage')}
      >
        <Text style={styles.botaoText}>NOVO STAGE</Text>
      </Pressable>

      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={[...stages].sort((left, right) => left.id - right.id)}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {errorMessage || 'Nenhum Stage cadastrado.'}
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.nome}>Etapa #{item.id}</Text>
              <Text style={styles.detalhe}>
                {statusLabels[item.status]} · Freelancer #{item.freelancer_id}
              </Text>
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
    marginBottom: 20,
  },

  botao: {
    minHeight: 48,
    backgroundColor: '#000',
    borderRadius: 6,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  botaoText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    minHeight: 70,
    marginBottom: 12,
    paddingLeft: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },

  nome: {
    fontSize: 17,
    fontWeight: '600',
  },

  detalhe: {
    marginTop: 6,
    color: '#666',
  },

  empty: { color: '#666', paddingVertical: 16 },
  voltar: {
    marginBottom: 15,
  },

  voltarText: {
    fontSize: 16,
    fontWeight: '600',
  },
});