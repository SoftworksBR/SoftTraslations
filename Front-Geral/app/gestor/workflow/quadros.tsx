import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { Employee } from '@/services/employees';
import {
  createStageTemplate,
  deleteStage,
  getAvailableStageFreelancers,
  getStages,
  getStageTemplates,
  updateStage,
} from '@/services/stages';
import type { StageTemplate, TranslationStage } from '@/services/stages';
import { confirmAction, notify } from '@/services/dialog';

export default function Quadros() {
  const [stages, setStages] = useState<TranslationStage[]>([]);
  const [templates, setTemplates] = useState<StageTemplate[]>([]);
  const [freelancersByStage, setFreelancersByStage] = useState<
    Record<number, Employee[]>
  >({});
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [loadedStages, loadedTemplates] = await Promise.all([
        getStages(),
        getStageTemplates(),
      ]);
      const stageFreelancers = await Promise.all(
        loadedStages.map(async (stage) => [
          stage.id,
          await getAvailableStageFreelancers(stage.id),
        ] as const),
      );
      setStages(loadedStages);
      setTemplates(loadedTemplates);
      setFreelancersByStage(Object.fromEntries(stageFreelancers));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao carregar etapas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void loadData();
  }, [loadData]));

  async function saveTemplate() {
    if (!name.trim()) {
      notify('Campo obrigatório', 'Informe o nome da etapa.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createStageTemplate(name.trim());
      setName('');
      await loadData();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível criar a etapa.');
    } finally {
      setSaving(false);
    }
  }

  async function assign(stage: TranslationStage, freelancerId: number) {
    setError(null);
    try {
      await updateStage(stage.id, { freelancer_id: freelancerId });
      await loadData();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível atribuir o tradutor.');
    }
  }

  function confirmDelete(stage: TranslationStage) {
    confirmAction(
      'Excluir etapa',
      `Deseja excluir "${stage.name}" do projeto?`,
      'Excluir',
      async () => {
        try {
          await deleteStage(stage.id);
          await loadData();
        } catch (cause) {
          notify(
            'Não foi possível excluir',
            cause instanceof Error ? cause.message : 'Ocorreu um erro inesperado.',
          );
        }
      },
    );
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>← Voltar</Text>
      </Pressable>
      <Text style={styles.title}>Etapas de trabalho</Text>
      <Text style={styles.description}>
        Cadastre etapas reutilizáveis e atribua tradutores às etapas dos projetos.
      </Text>

      <View style={styles.form}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Nome da nova etapa"
          style={styles.input}
        />
        <Text style={styles.hint}>
          {templates.length
            ? `Etapas cadastradas: ${templates.map((template) => template.name).join(', ')}`
            : 'Nenhuma etapa reutilizável cadastrada.'}
        </Text>
        <Pressable
          style={[styles.button, saving && styles.disabled]}
          onPress={() => void saveTemplate()}
          disabled={saving}
        >
          <Text style={styles.buttonText}>{saving ? 'SALVANDO...' : 'ADICIONAR ETAPA'}</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? (
        <ActivityIndicator color="#087F8C" />
      ) : (
        <FlatList
          data={stages}
          keyExtractor={(stage) => String(stage.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.hint}>
              As etapas aparecem aqui quando um projeto é criado a partir de uma trilha.
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.stageInfo}>
                <Text style={styles.stageName}>{item.name}</Text>
                <Text style={styles.hint}>
                  Situação: {item.status} · Tradutor:{' '}
                  {freelancersByStage[item.id]?.find((freelancer) => freelancer.id === item.freelancer_id)?.username
                    ?? (item.freelancer_id === null ? 'não atribuído' : `#${item.freelancer_id}`)}
                </Text>
                {freelancersByStage[item.id]?.length ? (
                  <View style={styles.employeePicker}>
                    {freelancersByStage[item.id].map((freelancer) => (
                      <Pressable
                        key={freelancer.id}
                        onPress={() => void assign(item, freelancer.id)}
                        style={[
                          styles.employeeOption,
                          item.freelancer_id === freelancer.id && styles.employeeOptionSelected,
                        ]}
                      >
                        <Text style={[
                          styles.employeeText,
                          item.freelancer_id === freelancer.id && styles.employeeTextSelected,
                        ]}>
                          {freelancer.username}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.hint}>
                    Não há freelancers disponíveis para esta etapa.
                  </Text>
                )}
              </View>
              <Pressable onPress={() => confirmDelete(item)} style={styles.delete}>
                <Text style={styles.deleteText}>×</Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F5F8FA' },
  back: { marginBottom: 14 },
  backText: { color: '#087F8C', fontWeight: '600' },
  title: { color: '#0B2239', fontSize: 28, fontWeight: '800' },
  description: { marginTop: 7, marginBottom: 18, color: '#627485', lineHeight: 20 },
  form: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  input: {
    height: 46,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderRadius: 8,
  },
  label: { marginTop: 14, marginBottom: 8, color: '#172B3A', fontWeight: '600' },
  employeePicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  employeeOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderRadius: 18,
  },
  employeeOptionSelected: { borderColor: '#087F8C', backgroundColor: '#E8F6F7' },
  employeeText: { color: '#627485' },
  employeeTextSelected: { color: '#087F8C', fontWeight: '700' },
  hint: { color: '#627485', fontSize: 13, lineHeight: 19 },
  button: {
    alignSelf: 'flex-start',
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#087F8C',
  },
  disabled: { opacity: 0.55 },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  error: { marginTop: 12, color: '#B42318', lineHeight: 20 },
  list: { paddingTop: 16, paddingBottom: 24, gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  stageInfo: { flex: 1, padding: 16 },
  stageName: { color: '#172B3A', fontSize: 16, fontWeight: '700' },
  delete: { width: 48, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: '#DFE7EC' },
  deleteText: { color: '#B42318', fontSize: 27 },
});
