import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { createPath } from '@/services/paths';
import { getStageTemplates } from '@/services/stages';
import type { StageTemplate } from '@/services/stages';

export default function NovaTrilha() {
  const [name, setName] = useState('');
  const [stages, setStages] = useState<StageTemplate[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStages(await getStageTemplates());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao carregar etapas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void loadStages();
  }, [loadStages]));

  function toggleStage(id: number) {
    setSelectedIds((current) => (
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id]
    ));
  }

  async function savePath() {
    if (!name.trim()) {
      setError('Informe o nome da trilha.');
      return;
    }
    if (selectedIds.length === 0) {
      setError('Selecione ao menos uma etapa cadastrada.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await createPath(name.trim(), selectedIds);
      router.back();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível criar a trilha.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Nova trilha</Text>
        <ScrollView>
          <Text style={styles.label}>Nome da trilha</Text>
          <TextInput value={name} onChangeText={setName} style={styles.input} />
          <Text style={styles.label}>Etapas cadastradas</Text>
          {loading ? (
            <ActivityIndicator color="#087F8C" />
          ) : stages.length === 0 ? (
            <Text style={styles.hint}>Cadastre etapas antes de criar uma trilha.</Text>
          ) : (
            stages.map((stage) => {
              const selected = selectedIds.includes(stage.id);
              return (
                <Pressable
                  key={stage.id}
                  style={[styles.stage, selected && styles.stageSelected]}
                  onPress={() => toggleStage(stage.id)}
                >
                  <Text style={[styles.stageText, selected && styles.stageTextSelected]}>
                    {selected ? '✓ ' : ''}{stage.name}
                  </Text>
                </Pressable>
              );
            })
          )}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable
            style={[styles.button, (saving || loading || stages.length === 0) && styles.disabled]}
            onPress={() => void savePath()}
            disabled={saving || loading || stages.length === 0}
          >
            <Text style={styles.buttonText}>{saving ? 'SALVANDO...' : 'SALVAR TRILHA'}</Text>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#F5F8FA' },
  form: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    alignSelf: 'center',
    padding: 24,
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  title: { color: '#0B2239', fontSize: 24, fontWeight: '800' },
  label: { marginTop: 18, marginBottom: 7, color: '#172B3A', fontWeight: '600' },
  input: {
    height: 46,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderRadius: 8,
  },
  hint: { color: '#627485', lineHeight: 20 },
  stage: {
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderRadius: 8,
  },
  stageSelected: { borderColor: '#087F8C', backgroundColor: '#E8F6F7' },
  stageText: { color: '#627485' },
  stageTextSelected: { color: '#087F8C', fontWeight: '700' },
  error: { marginTop: 14, color: '#B42318', lineHeight: 20 },
  button: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    borderRadius: 9,
    backgroundColor: '#087F8C',
  },
  buttonText: { color: '#FFFFFF', fontWeight: '700' },
  disabled: { opacity: 0.55 },
});
