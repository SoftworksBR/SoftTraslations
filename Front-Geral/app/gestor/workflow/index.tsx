import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { getEmployees } from '@/services/employees';
import type { Employee } from '@/services/employees';
import { createPath, getPaths } from '@/services/paths';
import type { TranslationPath } from '@/services/paths';
import { createStageTemplate, getStages, getStageTemplates } from '@/services/stages';
import type { StageTemplate, TranslationStage } from '@/services/stages';

const stageStatuses: Record<TranslationStage['status'], { label: string; color: string }> = {
  ready: { label: 'Pronto', color: '#8A99A5' },
  in_progress: { label: 'Em andamento', color: '#397BC5' },
  testing: { label: 'Em teste', color: '#8064B5' },
  done: { label: 'Concluído', color: '#20845A' },
};

export default function Workflow() {
  const [stages, setStages] = useState<TranslationStage[]>([]);
  const [templates, setTemplates] = useState<StageTemplate[]>([]);
  const [paths, setPaths] = useState<TranslationPath[]>([]);
  const [freelancers, setFreelancers] = useState<Employee[]>([]);
  const [selectedPathId, setSelectedPathId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<'stage' | 'path' | null>(null);
  const [newStageName, setNewStageName] = useState('');
  const [newPathName, setNewPathName] = useState('');
  const [selectedStageIds, setSelectedStageIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const selectedPath = useMemo(
    () => paths.find((path) => path.id === selectedPathId) ?? paths[0] ?? null,
    [paths, selectedPathId],
  );
  const freelancerById = useMemo(
    () => new Map(freelancers.map((employee) => [employee.id, employee.username])),
    [freelancers],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [loadedStages, loadedTemplates, loadedPaths, employeeResult] = await Promise.all([
        getStages(),
        getStageTemplates(),
        getPaths(),
        getEmployees('freelancer'),
      ]);
      setStages(loadedStages);
      setTemplates(loadedTemplates);
      setPaths(loadedPaths);
      setFreelancers(employeeResult.employees);
      setSelectedPathId((current) =>
        loadedPaths.some((path) => path.id === current)
          ? current
          : loadedPaths[0]?.id ?? null,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao carregar o workflow.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void loadData();
  }, [loadData]));

  function openStageModal() {
    setNewStageName('');
    setFormError(null);
    setModal('stage');
  }

  function openPathModal() {
    setNewPathName('');
    setSelectedStageIds([]);
    setFormError(null);
    setModal('path');
  }

  function toggleTemplate(id: number) {
    setSelectedStageIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id],
    );
  }

  async function saveStage() {
    if (!newStageName.trim()) {
      setFormError('Informe o nome da etapa.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await createStageTemplate(newStageName.trim());
      setModal(null);
      await loadData();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'Não foi possível criar a etapa.');
    } finally {
      setSaving(false);
    }
  }

  async function savePath() {
    if (!newPathName.trim()) {
      setFormError('Informe o nome da trilha.');
      return;
    }
    if (!selectedStageIds.length) {
      setFormError('Selecione ao menos uma etapa.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const created = await createPath(newPathName.trim(), selectedStageIds);
      setModal(null);
      await loadData();
      setSelectedPathId(created.id);
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'Não foi possível criar a trilha.');
    } finally {
      setSaving(false);
    }
  }

  function stageSummary(template: StageTemplate) {
    const executions = stages.filter((stage) => stage.name === template.name);
    const owners = [...new Set(executions
      .map((stage) => stage.freelancer_id === null ? null : freelancerById.get(stage.freelancer_id))
      .filter((owner): owner is string => Boolean(owner)))];
    const statuses = [...new Set(executions.map((stage) => stage.status))];
    return {
      owner: owners.length ? owners.join(', ') : 'Sem responsável',
      status: statuses.length
        ? statuses.map((status) => stageStatuses[status].label).join(' · ')
        : 'Pronto para iniciar',
      tone: statuses.length ? stageStatuses[statuses[0]].color : '#8A99A5',
    };
  }

  return (
    <View style={styles.screen}>
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <Text style={styles.eyebrow}>GESTÃO DE PROJETOS</Text>
          <Text style={styles.title}>Workflow</Text>
          <Text style={styles.description}>
            Visualize as etapas e gerencie suas trilhas reutilizáveis.
          </Text>
        </View>
        <View style={styles.headingActions}>
          <Pressable accessibilityRole="button" onPress={openStageModal} style={styles.secondaryButton}>
            <Ionicons name="add" size={17} color="#087F8C" />
            <Text style={styles.secondaryButtonText}>Nova etapa</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={openPathModal} style={styles.primaryButton}>
            <Ionicons name="git-branch-outline" size={16} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Criar trilha</Text>
          </Pressable>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.error}>{error}</Text>
          <Pressable accessibilityRole="button" onPress={() => void loadData()}>
            <Text style={styles.retry}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#087F8C" />
          <Text style={styles.helper}>Carregando trilhas e etapas...</Text>
        </View>
      ) : (
        <View style={styles.workspace}>
          <View style={styles.topPanel}>
            <View style={styles.panelHeading}>
              <View style={styles.panelTitleCopy}>
                <Text style={styles.panelTitle}>Visualização da trilha</Text>
                <Text style={styles.panelSubtitle}>
                  {selectedPath?.name ?? 'Selecione ou crie uma trilha'}
                </Text>
              </View>
              {selectedPath ? (
                <View style={styles.stageCount}>
                  <Text style={styles.stageCountText}>{selectedPath.stages.length} etapas</Text>
                </View>
              ) : null}
            </View>
            {selectedPath?.stages.length ? (
              <ScrollView
                horizontal
                contentContainerStyle={styles.timeline}
                showsHorizontalScrollIndicator
              >
                {selectedPath.stages.map((stage, index) => {
                  const summary = stageSummary(stage);
                  return (
                    <View key={`${selectedPath.id}-${stage.id}`} style={styles.timelineGroup}>
                      <View style={styles.stageCard}>
                        <View style={styles.stageCardTop}>
                          <Text style={styles.stageNumber}>ETAPA {index + 1}</Text>
                          <View style={[styles.stageDot, { backgroundColor: summary.tone }]} />
                        </View>
                        <Text numberOfLines={2} style={styles.stageName}>{stage.name}</Text>
                        <View style={styles.stageMetaRow}>
                          <Ionicons name="person-outline" size={13} color="#8293A0" />
                          <Text numberOfLines={1} style={styles.stageMeta}>{summary.owner}</Text>
                        </View>
                        <Text style={[styles.stageStatus, { color: summary.tone }]}>{summary.status}</Text>
                      </View>
                      {index < selectedPath.stages.length - 1 ? <View style={styles.connector} /> : null}
                    </View>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.emptyTimeline}>
                <Ionicons name="git-branch-outline" size={23} color="#8293A0" />
                <Text style={styles.helper}>
                  {selectedPath ? 'Esta trilha não possui etapas.' : 'Crie uma trilha para visualizar suas etapas.'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.bottomPanel}>
            <View style={styles.panelHeading}>
              <View style={styles.panelTitleCopy}>
                <Text style={styles.panelTitle}>Trilhas cadastradas</Text>
                <Text style={styles.panelSubtitle}>Selecione uma trilha para ver sua sequência acima.</Text>
              </View>
              <Text style={styles.count}>{paths.length}</Text>
            </View>
            <ScrollView style={styles.pathList} contentContainerStyle={styles.pathListContent}>
              {paths.map((path) => {
                const selected = selectedPath?.id === path.id;
                return (
                  <Pressable
                    key={path.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setSelectedPathId(path.id)}
                    style={[styles.pathItem, selected && styles.pathItemSelected]}
                  >
                    <View style={[styles.pathIcon, selected && styles.pathIconSelected]}>
                      <Ionicons name="git-branch-outline" size={17} color={selected ? '#FFFFFF' : '#087F8C'} />
                    </View>
                    <View style={styles.pathCopy}>
                      <Text style={[styles.pathName, selected && styles.pathNameSelected]}>{path.name}</Text>
                      <Text style={styles.pathMeta}>
                        {path.stages.map((stage) => stage.name).join('  →  ') || 'Sem etapas'}
                      </Text>
                    </View>
                    <Text style={[styles.pathCount, selected && styles.pathNameSelected]}>
                      {path.stages.length}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={selected ? '#FFFFFF' : '#8293A0'} />
                  </Pressable>
                );
              })}
              {!paths.length ? (
                <View style={styles.emptyPaths}>
                  <Text style={styles.helper}>Nenhuma trilha cadastrada. Crie uma para começar.</Text>
                </View>
              ) : null}
            </ScrollView>
            {selectedPath ? (
              <View style={styles.selectedDetails}>
                <Text style={styles.selectedDetailsTitle}>Detalhes: {selectedPath.name}</Text>
                <Text style={styles.selectedDetailsText}>
                  {selectedPath.stages.length
                    ? selectedPath.stages.map((stage, index) => `${index + 1}. ${stage.name} — ${stageSummary(stage).status} · ${stageSummary(stage).owner}`).join('\n')
                    : 'Adicione etapas a esta trilha ao criá-la novamente.'}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      )}

      <Modal visible={modal !== null} transparent animationType="fade" onRequestClose={() => setModal(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.formModal}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.eyebrow}>WORKFLOW</Text>
                <Text style={styles.modalTitle}>{modal === 'stage' ? 'Nova etapa' : 'Criar trilha'}</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Fechar" onPress={() => setModal(null)}>
                <Ionicons name="close" size={22} color="#627485" />
              </Pressable>
            </View>
            {modal === 'stage' ? (
              <>
                <Text style={styles.formLabel}>Nome da etapa</Text>
                <TextInput
                  value={newStageName}
                  onChangeText={setNewStageName}
                  placeholder="Ex.: Revisão final"
                  style={styles.input}
                />
              </>
            ) : (
              <>
                <Text style={styles.formLabel}>Nome da trilha</Text>
                <TextInput
                  value={newPathName}
                  onChangeText={setNewPathName}
                  placeholder="Ex.: Tradução completa"
                  style={styles.input}
                />
                <Text style={styles.formLabel}>Selecione as etapas em sequência</Text>
                <ScrollView style={styles.templateList} keyboardShouldPersistTaps="handled">
                  {templates.map((template) => {
                    const selected = selectedStageIds.includes(template.id);
                    return (
                      <Pressable
                        key={template.id}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: selected }}
                        onPress={() => toggleTemplate(template.id)}
                        style={[styles.templateOption, selected && styles.templateOptionSelected]}
                      >
                        <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                          {selected ? <Ionicons name="checkmark" size={13} color="#FFFFFF" /> : null}
                        </View>
                        <Text style={styles.templateName}>{template.name}</Text>
                      </Pressable>
                    );
                  })}
                  {!templates.length ? (
                    <Text style={styles.helper}>Crie pelo menos uma etapa antes de criar uma trilha.</Text>
                  ) : null}
                </ScrollView>
              </>
            )}
            {formError ? <Text accessibilityRole="alert" style={styles.formError}>{formError}</Text> : null}
            <View style={styles.modalActions}>
              <Pressable onPress={() => setModal(null)} style={styles.cancelButton}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                disabled={saving || (modal === 'path' && templates.length === 0)}
                onPress={() => void (modal === 'stage' ? saveStage() : savePath())}
                style={[styles.primaryButton, saving && styles.disabled]}
              >
                {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : null}
                <Text style={styles.primaryButtonText}>{saving ? 'Salvando...' : modal === 'stage' ? 'Criar etapa' : 'Criar trilha'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F8FA' },
  heading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 },
  headingCopy: { flex: 1 },
  eyebrow: { color: '#087F8C', fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
  title: { marginTop: 4, color: '#0B2239', fontSize: 26, fontWeight: '800' },
  description: { marginTop: 5, color: '#627485', fontSize: 11, lineHeight: 16 },
  headingActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8 },
  primaryButton: { minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#087F8C' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  secondaryButton: { minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 11, borderWidth: 1, borderColor: '#B8DADD', borderRadius: 8, backgroundColor: '#FFFFFF' },
  secondaryButtonText: { color: '#087F8C', fontSize: 10, fontWeight: '700' },
  workspace: { flex: 1, minHeight: 0, gap: 14, paddingHorizontal: 24, paddingBottom: 20 },
  topPanel: { flex: 1, minHeight: 210, padding: 16, borderWidth: 1, borderColor: '#DFE7EC', borderRadius: 12, backgroundColor: '#FFFFFF' },
  bottomPanel: { flex: 1, minHeight: 220, padding: 16, borderWidth: 1, borderColor: '#DFE7EC', borderRadius: 12, backgroundColor: '#FFFFFF' },
  panelHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 13 },
  panelTitleCopy: { flex: 1 },
  panelTitle: { color: '#172B3A', fontSize: 13, fontWeight: '800' },
  panelSubtitle: { marginTop: 4, color: '#627485', fontSize: 10 },
  stageCount: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 15, backgroundColor: '#E8F6F7' },
  stageCountText: { color: '#087F8C', fontSize: 9, fontWeight: '700' },
  timeline: { flexGrow: 1, alignItems: 'center', paddingVertical: 6, paddingRight: 8 },
  timelineGroup: { flexDirection: 'row', alignItems: 'center' },
  stageCard: { width: 190, minHeight: 138, justifyContent: 'center', padding: 13, borderWidth: 1, borderColor: '#DCE6EA', borderRadius: 10, backgroundColor: '#FBFDFE' },
  stageCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 },
  stageNumber: { color: '#8293A0', fontSize: 8, fontWeight: '800', letterSpacing: 0.7 },
  stageDot: { width: 9, height: 9, borderRadius: 5 },
  stageName: { minHeight: 34, color: '#172B3A', fontSize: 12, fontWeight: '800' },
  stageMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  stageMeta: { flex: 1, color: '#627485', fontSize: 9 },
  stageStatus: { marginTop: 8, fontSize: 9, fontWeight: '700' },
  connector: { width: 46, height: 3, backgroundColor: '#B9C9D0' },
  emptyTimeline: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  pathList: { flex: 1, minHeight: 70 },
  pathListContent: { gap: 7 },
  pathItem: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 9, borderWidth: 1, borderColor: '#E4EAEE', borderRadius: 9, backgroundColor: '#FFFFFF' },
  pathItemSelected: { borderColor: '#087F8C', backgroundColor: '#087F8C' },
  pathIcon: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#E8F6F7' },
  pathIconSelected: { backgroundColor: 'rgba(255,255,255,0.18)' },
  pathCopy: { flex: 1, minWidth: 0 },
  pathName: { color: '#172B3A', fontSize: 11, fontWeight: '700' },
  pathNameSelected: { color: '#FFFFFF' },
  pathMeta: { marginTop: 3, color: '#627485', fontSize: 9 },
  pathCount: { color: '#627485', fontSize: 10, fontWeight: '700' },
  count: { minWidth: 23, paddingVertical: 4, borderRadius: 12, backgroundColor: '#EEF2F4', color: '#627485', fontSize: 10, fontWeight: '700', textAlign: 'center' },
  selectedDetails: { maxHeight: 94, marginTop: 10, padding: 10, borderRadius: 8, backgroundColor: '#F5F8FA' },
  selectedDetailsTitle: { color: '#172B3A', fontSize: 10, fontWeight: '800' },
  selectedDetailsText: { marginTop: 5, color: '#627485', fontSize: 9, lineHeight: 15 },
  emptyPaths: { padding: 18, alignItems: 'center' },
  helper: { color: '#627485', fontSize: 10, lineHeight: 16, textAlign: 'center' },
  errorBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginHorizontal: 24, marginBottom: 10, padding: 12, borderRadius: 8, backgroundColor: '#FFF1F0' },
  error: { flex: 1, color: '#B42318', fontSize: 11, lineHeight: 16 },
  retry: { color: '#087F8C', fontSize: 10, fontWeight: '700' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: 18, backgroundColor: 'rgba(11,34,57,0.58)' },
  formModal: { width: '100%', maxWidth: 520, maxHeight: '88%', alignSelf: 'center', padding: 20, borderRadius: 13, backgroundColor: '#FFFFFF' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  modalTitle: { marginTop: 4, color: '#0B2239', fontSize: 20, fontWeight: '800' },
  formLabel: { marginTop: 12, marginBottom: 6, color: '#172B3A', fontSize: 11, fontWeight: '700' },
  input: { minHeight: 42, paddingHorizontal: 11, borderWidth: 1, borderColor: '#DFE7EC', borderRadius: 8, color: '#172B3A', fontSize: 12 },
  templateList: { maxHeight: 260, marginTop: 4 },
  templateOption: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 6, paddingHorizontal: 10, borderWidth: 1, borderColor: '#DFE7EC', borderRadius: 8 },
  templateOptionSelected: { borderColor: '#087F8C', backgroundColor: '#E8F6F7' },
  checkbox: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#B8C5CC', borderRadius: 5 },
  checkboxSelected: { borderColor: '#087F8C', backgroundColor: '#087F8C' },
  templateName: { color: '#172B3A', fontSize: 11, fontWeight: '600' },
  formError: { marginTop: 10, color: '#B42318', fontSize: 10, lineHeight: 15 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 9, marginTop: 18 },
  cancelButton: { minHeight: 38, justifyContent: 'center', paddingHorizontal: 12 },
  cancelText: { color: '#627485', fontSize: 10, fontWeight: '700' },
  disabled: { opacity: 0.6 },
});
