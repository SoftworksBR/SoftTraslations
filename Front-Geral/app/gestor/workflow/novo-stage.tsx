import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { getEmployees } from '@/services/employees';
import type { Employee, FreelancerType } from '@/services/employees';
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

type ModoResponsavel = 'freelancer' | 'tipo';

const tiposDeFreelancer: { valor: FreelancerType; rotulo: string }[] = [
  { valor: 'tradutor', rotulo: 'Tradutor' },
  { valor: 'revisor', rotulo: 'Revisor' },
  { valor: 'formatador', rotulo: 'Formatador' },
  { valor: 'interprete', rotulo: 'Intérprete' },
];

export default function NovoStage() {
  const [freelancers, setFreelancers] = useState<Employee[]>([]);
  const [stageName, setStageName] = useState('');
  const [modoResponsavel, setModoResponsavel] =
    useState<ModoResponsavel>('freelancer');
  const [freelancerId, setFreelancerId] = useState<number | null>(null);
  const [freelancerType, setFreelancerType] =
    useState<FreelancerType | null>(null);
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
    if (!stageName.trim()) {
      Alert.alert('Novo Stage', 'Informe um nome para o Stage.');
      return;
    }

    if (modoResponsavel === 'freelancer' && freelancerId === null) {
      Alert.alert('Novo Stage', 'Selecione um freelancer.');
      return;
    }

    if (modoResponsavel === 'tipo' && freelancerType === null) {
      Alert.alert('Novo Stage', 'Selecione um tipo de freelancer.');
      return;
    }

    setSaving(true);
    try {
      await createStage({
        ...(modoResponsavel === 'freelancer'
          ? { freelancer_id: freelancerId }
          : { freelancer_type: freelancerType }),
        name: stageName.trim(),
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

          <Text style={styles.label}>Nome do Stage</Text>
          <TextInput
            value={stageName}
            onChangeText={setStageName}
            placeholder="Digite o nome"
            style={styles.input}
            maxLength={120}
          />

          <Text style={styles.label}>Responsável pela etapa</Text>
          <View style={styles.tabs}>
            <Pressable
              style={[
                styles.tab,
                modoResponsavel === 'freelancer' && styles.tabSelected,
              ]}
              onPress={() => setModoResponsavel('freelancer')}
            >
              <Text
                style={[
                  styles.tabText,
                  modoResponsavel === 'freelancer' && styles.tabTextSelected,
                ]}
              >
                Freelancer específico
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.tab,
                modoResponsavel === 'tipo' && styles.tabSelected,
              ]}
              onPress={() => setModoResponsavel('tipo')}
            >
              <Text
                style={[
                  styles.tabText,
                  modoResponsavel === 'tipo' && styles.tabTextSelected,
                ]}
              >
                Tipo de freelancer
              </Text>
            </Pressable>
          </View>

          {modoResponsavel === 'freelancer' ? (
            freelancers.length === 0 ? (
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
            )
          ) : (
            tiposDeFreelancer.map((tipo) => (
              <Pressable
                key={tipo.valor}
                style={[
                  styles.option,
                  freelancerType === tipo.valor && styles.selected,
                ]}
                onPress={() => setFreelancerType(tipo.valor)}
              >
                <Text style={styles.optionText}>{tipo.rotulo}</Text>
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
              (saving ||
                (modoResponsavel === 'freelancer' &&
                  freelancers.length === 0)) &&
                styles.submitDisabled,
            ]}
            onPress={() => void saveStage()}
            disabled={
              saving ||
              (modoResponsavel === 'freelancer' && freelancers.length === 0)
            }
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
  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    minHeight: 42,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
  },
  tabSelected: {
    borderColor: '#111',
    backgroundColor: '#111',
  },
  tabText: {
    color: '#222',
    fontWeight: '600',
  },
  tabTextSelected: {
    color: '#fff',
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