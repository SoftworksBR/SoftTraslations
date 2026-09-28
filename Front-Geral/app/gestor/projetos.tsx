import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getProjects, type Project, type ProjectStatus } from '@/services/projects';

const statusLabels: Record<ProjectStatus, string> = {
  ready: 'Pronto',
  in_progress: 'Em andamento',
  testing: 'Em teste',
  done: 'Concluído',
};

export default function Projetos() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      setProjects(await getProjects());
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Falha ao carregar projetos.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadProjects();
    }, [loadProjects]),
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Projetos</Text>
      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(project) => String(project.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.text}>
              {errorMessage || 'Nenhum projeto cadastrado.'}
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.project}>
              <Text style={styles.projectName}>{item.name}</Text>
              <Text style={styles.text}>
                {statusLabels[item.status]} ·{' '}
                {item.paths.reduce(
                  (count, path) => count + path.stages.length,
                  0,
                )}{' '}
                etapas
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
    marginBottom: 15,
  },
  list: {
    gap: 12,
  },
  project: {
    padding: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
  },
  projectName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  text: {
    fontSize: 16,
    color: '#666',
  },
});