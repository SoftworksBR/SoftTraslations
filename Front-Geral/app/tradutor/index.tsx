import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getCurrentEmployee } from '@/services/auth';
import { getStages } from '@/services/stages';
import type { ProjectStatus, ProjectStage } from '@/services/projects';

const statusLabels: Record<ProjectStatus, string> = {
  ready: 'Pronto',
  in_progress: 'Em andamento',
  testing: 'Em teste',
  done: 'Concluído',
};

export default function TradutorIndex() {
  const [employeeName, setEmployeeName] = useState('');
  const [stages, setStages] = useState<ProjectStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadStages = useCallback(async () => {
    setLoading(true);
    try {
      const employee = await getCurrentEmployee();
      const allStages = await getStages();
      setEmployeeName(employee.username);
      setStages(
        allStages.filter((stage) => stage.freelancer_id === employee.id),
      );
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
      <Text style={styles.title}>Minhas etapas</Text>
      {employeeName ? (
        <Text style={styles.subtitle}>Olá, {employeeName}</Text>
      ) : null}
      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={stages}
          keyExtractor={(stage) => String(stage.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {errorMessage || 'Nenhuma etapa atribuída.'}
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.stage}>
              <Text style={styles.stageName}>Etapa #{item.id}</Text>
              <Text style={styles.status}>{statusLabels[item.status]}</Text>
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
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 18,
    color: '#666',
  },
  list: {
    gap: 12,
  },
  empty: {
    marginTop: 18,
    color: '#666',
  },
  stage: {
    padding: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
  },
  stageName: {
    fontSize: 17,
    fontWeight: '600',
  },
  status: {
    marginTop: 6,
    color: '#666',
  },
});