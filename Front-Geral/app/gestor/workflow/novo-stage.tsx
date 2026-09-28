import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getEmployees } from '@/services/employees';
import type { Employee } from '@/services/employees';
import { createStage } from '@/services/stages';
import type { ProjectStatus } from '@/services/projects';

const statuses: ProjectStatus[] = [
  'ready',
  'in_progress',
  'testing',
  'done',
];

const statusLabels: Record<ProjectStatus, string> = {
  ready: 'Pronto',
  in_progress: 'Em andamento',
  testing: 'Em teste',
  done: 'Concluído',
};

export default function NovoStage() {
  const [freelancers, setFreelancers] = useState<Employee[]>([]);
  const [freelancerId, setFreelancerId] = useState<number | null>(null);
  const [stageStatus, setStageStatus] = useState<ProjectStatus>('ready');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadOptions = useCallback(async () => {
    setLoading(true);
    try {
      const employees = await getEmployees();
      setFreelancers(
        employees.filter(
          (employee) =>
            employee.role === 'freelancer' &&
            employee.status === 'available',
        ),
      );
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Falha ao carregar Paths e freelancers.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadOptions();
    }, [loadOptions]),
  );

  async function saveStage() {
    if (freelancerId === null) {
      Alert.alert('Novo Stage', 'Selecione um freelancer.');
      return;
    }

    setSaving(true);
    try {
      await createStage({
        freelancer_id: freelancerId,
        status: stageStatus,
      });
      router.back();
    } catch (error) {
      Alert.alert(
        'Não foi possível cadastrar o Stage',
        error instanceof Error ? error.message : 'Tente novamente.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>← Voltar</Text>
      </Pressable>

      <Text style={styles.title}>Novo Stage</Text>

      {loading ? (
        <ActivityIndicator />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {errorMessage ? (
            <Text style={styles.error}>{errorMessage}</Text>
          ) : null}

          <Text style={styles.label}>Freelancer disponível</Text>
          {freelancers.length === 0 ? (
            <Text style={styles.helper}>Nenhum freelancer disponível.</Text>
          ) : (
            freelancers.map((freelancer) => (
              <Pressable
                key={freelancer.id}
                style={[
                  styles.option,
                  freelancerId === freelancer.id && styles.selected,
                ]}
                onPress={() => setFreelancerId(freelancer.id)}
              >
                <Text style={styles.optionText}>
                  {freelancer.username} · #{freelancer.id}
                </Text>
              </Pressable>
            ))
          )}

          <Text style={styles.label}>Status inicial</Text>
          <View style={styles.statuses}>
            {statuses.map((status) => (
              <Pressable
                key={status}
                style={[
                  styles.statusOption,
                  stageStatus === status && styles.selected,
                ]}
                onPress={() => setStageStatus(status)}
              >
                <Text style={styles.optionText}>{statusLabels[status]}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={[
              styles.submit,
              (saving || freelancers.length === 0) && styles.submitDisabled,
            ]}
            onPress={() => void saveStage()}
            disabled={saving || freelancers.length === 0}
          >
            <Text style={styles.submitText}>
              {saving ? 'CADASTRANDO...' : 'CADASTRAR STAGE'}
            </Text>
          </Pressable>
        </ScrollView>
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
  back: {
    marginBottom: 15,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  content: {
    gap: 8,
    paddingBottom: 24,
  },
  label: {
    marginTop: 12,
    marginBottom: 4,
    fontSize: 15,
    fontWeight: '600',
  },
  option: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
  },
  selected: {
    borderColor: '#111',
    backgroundColor: '#e8e8e8',
  },
  optionText: {
    color: '#222',
  },
  helper: {
    color: '#666',
    paddingVertical: 8,
  },
  error: {
    color: '#a32020',
    marginBottom: 8,
  },
  statuses: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOption: {
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
  },
  submit: {
    minHeight: 50,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    borderRadius: 6,
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});