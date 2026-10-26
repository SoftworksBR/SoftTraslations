import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { FilterPanel, FilterSelect } from '@/components/FilterPanel';
import type { FilterOption } from '@/components/FilterPanel';
import { getEmployees } from '@/services/employees';
import type { Employee } from '@/services/employees';
import { createPath, getPaths } from '@/services/paths';
import type { TranslationPath } from '@/services/paths';
import { createStageTemplate, getStages, getStageTemplates } from '@/services/stages';
import type { StageTemplate, TranslationStage } from '@/services/stages';

type WorkflowTab = 'boards' | 'tracks';
type StageStatus = TranslationStage['status'] | 'all';

const workflowStatuses: { label: string; value: TranslationStage['status']; tone: string }[] = [
  { label: 'Pronto', value: 'ready', tone: '#8A99A5' },
  { label: 'Em andamento', value: 'in_progress', tone: '#397BC5' },
  { label: 'Em teste', value: 'testing', tone: '#8064B5' },
  { label: 'Concluído', value: 'done', tone: '#20845A' },
];

const statusOptions: FilterOption<StageStatus>[] = [
  { label: 'Todas as situações', value: 'all' },
  ...workflowStatuses.map(({ label, value }) => ({ label, value })),
];

type AssigneeFilter = string;

export default function Workflow() {
  const [tab, setTab] = useState<WorkflowTab>('boards');
  const [stages, setStages] = useState<TranslationStage[]>([]);
  const [templates, setTemplates] = useState<StageTemplate[]>([]);
  const [paths, setPaths] = useState<TranslationPath[]>([]);
  const [freelancers, setFreelancers] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StageStatus>('all');
  const [draftStatusFilter, setDraftStatusFilter] = useState<StageStatus>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeFilter>('all');
  const [draftAssigneeFilter, setDraftAssigneeFilter] = useState<AssigneeFilter>('all');
  const [openField, setOpenField] = useState<'status' | 'assignee' | null>(null);
  const [stageModalOpen, setStageModalOpen] = useState(false);
  const [pathModalOpen, setPathModalOpen] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [newPathName, setNewPathName] = useState('');
  const [selectedStageIds, setSelectedStageIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const narrow = width < 760;
  const freelancerById = new Map(freelancers.map((freelancer) => [freelancer.id, freelancer]));
  const assigneeOptions: FilterOption<AssigneeFilter>[] = [
    { label: 'Todos os tradutores', value: 'all' },
    { label: 'Sem tradutor', value: 'unassigned' },
    ...freelancers.map((freelancer) => ({
      label: freelancer.username,
      value: String(freelancer.id),
    })),
  ];
  const visibleStages = stages.filter((stage) => {
    const matchesQuery = stage.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
    const matchesStatus = statusFilter === 'all' || stage.status === statusFilter;
    const matchesAssignee = assigneeFilter === 'all' ||
      (assigneeFilter === 'unassigned'
        ? stage.freelancer_id === null || !freelancerById.has(stage.freelancer_id)
        : stage.freelancer_id === Number(assigneeFilter));
    return matchesQuery && matchesStatus && matchesAssignee;
  });
  const visiblePaths = paths.filter((path) => {
    const matchesQuery = path.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
    return matchesQuery;
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [loadedStages, loadedTemplates, loadedPaths, loadedEmployees] = await Promise.all([
        getStages(),
        getStageTemplates(),
        getPaths(),
        getEmployees('freelancer'),
      ]);
      setStages(loadedStages);
      setTemplates(loadedTemplates);
      setPaths(loadedPaths);
      setFreelancers(loadedEmployees.employees);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao carregar o workflow.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  function clearFilters() {
    setDraftStatusFilter('all');
    setDraftAssigneeFilter('all');
    setStatusFilter('all');
    setAssigneeFilter('all');
    setOpenField(null);
  }

  async function saveNewStage() {
    if (!newStageName.trim()) {
      setCreateError('Informe o nome da etapa.');
      return;
    }
    setSaving(true);
    setCreateError(null);
    try {
      await createStageTemplate(newStageName.trim());
      setNewStageName('');
      setStageModalOpen(false);
      await loadData();
    } catch (cause) {
      setCreateError(cause instanceof Error ? cause.message : 'Não foi possível criar a etapa.');
    } finally {
      setSaving(false);
    }
  }

  async function saveNewPath() {
    if (!newPathName.trim()) {
      setCreateError('Informe o nome da trilha.');
      return;
    }
    if (!selectedStageIds.length) {
      setCreateError('Selecione ao menos uma etapa cadastrada.');
      return;
    }
    setSaving(true);
    setCreateError(null);
    try {
      await createPath(newPathName.trim(), selectedStageIds);
      setNewPathName('');
      setSelectedStageIds([]);
      setPathModalOpen(false);
      await loadData();
    } catch (cause) {
      setCreateError(cause instanceof Error ? cause.message : 'Não foi possível criar a trilha.');
    } finally {
      setSaving(false);
    }
  }

  function toggleStage(stageId: number) {
    setSelectedStageIds((current) => (
      current.includes(stageId)
        ? current.filter((id) => id !== stageId)
        : [...current, stageId]
    ));
  }

  function openCreateModal() {
    setCreateError(null);
    if (tab === 'boards') {
      setNewStageName('');
      setStageModalOpen(true);
    } else {
      setNewPathName('');
      setSelectedStageIds([]);
      setPathModalOpen(true);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.pageHeader}>
        <Text style={styles.eyebrow}>GESTÃO DE PROJETOS</Text>
        <Text style={styles.title}>Workflow</Text>
        <Text style={styles.description}>
          Organize etapas e construa trilhas reutilizáveis para seus projetos.
        </Text>
      </View>

      <View style={styles.tabs}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: tab === 'boards' }}
          onPress={() => setTab('boards')}
          style={[styles.tab, tab === 'boards' && styles.tabActive]}
        >
          <Text style={[styles.tabText, tab === 'boards' && styles.tabTextActive]}>
            Quadros e etapas
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: tab === 'tracks' }}
          onPress={() => setTab('tracks')}
          style={[styles.tab, tab === 'tracks' && styles.tabActive]}
        >
          <Text style={[styles.tabText, tab === 'tracks' && styles.tabTextActive]}>
            Trilhas
          </Text>
        </Pressable>
      </View>

      <View style={[styles.tools, narrow && styles.toolsNarrow]}>
        <View style={styles.search}>
          <Ionicons name="search-outline" size={18} color="#627485" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={tab === 'boards' ? 'Buscar etapa' : 'Buscar trilha'}
            placeholderTextColor="#98A7B1"
            accessibilityLabel={tab === 'boards' ? 'Buscar etapas' : 'Buscar trilhas'}
            style={styles.searchInput}
          />
        </View>
        <FilterPanel
          onOpen={() => {
            setDraftStatusFilter(statusFilter);
            setDraftAssigneeFilter(assigneeFilter);
            setOpenField(null);
          }}
          onClear={clearFilters}
          onApply={() => {
            setStatusFilter(draftStatusFilter);
            setAssigneeFilter(draftAssigneeFilter);
            setOpenField(null);
          }}
        >
          <FilterSelect
            label="Situação"
            value={draftStatusFilter}
            options={statusOptions}
            open={openField === 'status'}
            onToggle={() => setOpenField(openField === 'status' ? null : 'status')}
            onSelect={(value) => {
              setDraftStatusFilter(value);
              setOpenField(null);
            }}
          />
          <FilterSelect
            label="Responsável"
            value={draftAssigneeFilter === 'all' || draftAssigneeFilter === 'unassigned'
              ? draftAssigneeFilter
              : String(draftAssigneeFilter)}
            options={assigneeOptions}
            open={openField === 'assignee'}
            onToggle={() => setOpenField(openField === 'assignee' ? null : 'assignee')}
            onSelect={(value) => {
              setDraftAssigneeFilter(value);
              setOpenField(null);
            }}
          />
        </FilterPanel>
      </View>

      <View style={[styles.sectionHeader, narrow && styles.sectionHeaderNarrow]}>
        <View style={styles.sectionCopy}>
          <Text style={styles.sectionTitle}>
            {tab === 'boards' ? 'Quadro de etapas' : 'Trilhas de trabalho'}
          </Text>
          <Text style={styles.sectionDescription}>
            {tab === 'boards'
              ? 'Organize etapas por situação e responsável.'
              : 'Defina sequências de etapas para associar aos projetos.'}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={openCreateModal}
          style={styles.primaryButton}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>
            {tab === 'boards' ? 'Criar etapa' : 'Criar trilha'}
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#087F8C" />
          <Text style={styles.helper}>Carregando dados do workflow...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>Não foi possível carregar o workflow: {error}</Text>
          <Pressable onPress={() => void loadData()} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : tab === 'boards' ? (
        <ScrollView
          horizontal={!narrow}
          contentContainerStyle={[styles.board, narrow && styles.boardNarrow]}
          showsHorizontalScrollIndicator={!narrow}
        >
          {workflowStatuses.map((status) => {
            const items = visibleStages.filter((stage) => stage.status === status.value);
            return (
              <View key={status.value} style={[styles.column, narrow && styles.columnNarrow]}>
                <View style={styles.columnHeader}>
                  <View style={styles.columnHeading}>
                    <View style={[styles.statusDot, { backgroundColor: status.tone }]} />
                    <Text style={styles.columnTitle}>{status.label}</Text>
                  </View>
                  <Text style={styles.count}>{items.length}</Text>
                </View>
                {items.length ? items.map((stage) => {
                  const owner = stage.freelancer_id === null ? undefined : freelancerById.get(stage.freelancer_id);
                  return (
                    <View key={stage.id} style={styles.stageCard}>
                      <View style={styles.stageCardHeader}>
                        <Ionicons name="reorder-two-outline" size={17} color="#98A7B1" />
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Abrir etapas de trabalho, etapa ${stage.name}`}
                          onPress={() => router.push('/gestor/workflow/quadros')}
                          style={styles.stageMenu}
                        >
                          <Ionicons name="ellipsis-horizontal" size={18} color="#8293A0" />
                        </Pressable>
                      </View>
                      <Text style={styles.stageName}>{stage.name}</Text>
                      <View style={styles.ownerRow}>
                        <Ionicons name="person-outline" size={14} color="#8293A0" />
                        <Text numberOfLines={1} style={styles.ownerName}>
                          {owner?.username ?? 'Sem tradutor associado'}
                        </Text>
                      </View>
                    </View>
                  );
                }) : (
                  <Text style={styles.emptyColumn}>
                    {stages.length ? 'Nenhuma etapa nesta situação.' : 'Nenhuma etapa cadastrada.'}
                  </Text>
                )}
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.trackList}>
          {visiblePaths.length ? visiblePaths.map((path) => (
            <View key={path.id} style={styles.trackCard}>
              <View style={styles.trackHeader}>
                <View style={styles.trackIdentity}>
                  <View style={styles.workflowIcon}>
                    <Ionicons name="git-branch-outline" size={18} color="#087F8C" />
                  </View>
                  <View style={styles.trackCopy}>
                    <Text style={styles.trackName}>{path.name}</Text>
                    <Text style={styles.trackDescription}>
                      {path.stages.length} {path.stages.length === 1 ? 'etapa' : 'etapas'}
                    </Text>
                  </View>
                </View>
                <View style={styles.trackCount}>
                  <Text style={styles.trackCountText}>{path.stages.length} etapas</Text>
                </View>
              </View>
              <View style={[styles.pathStages, narrow && styles.pathStagesNarrow]}>
                {path.stages.length ? path.stages.map((stage, index) => {
                  return (
                    <View key={stage.id} style={styles.pathStageGroup}>
                      <View style={styles.pathStage}>
                        <Text style={styles.pathStageNumber}>{index + 1}</Text>
                        <View style={styles.pathStageCopy}>
                          <Text style={styles.pathStageName}>{stage.name}</Text>
                          {stage.description ? (
                            <Text style={styles.pathStageOwner}>{stage.description}</Text>
                          ) : null}
                        </View>
                      </View>
                      {index < path.stages.length - 1 ? (
                        <Ionicons
                          name={narrow ? 'arrow-down' : 'arrow-forward'}
                          size={15}
                          color="#B1BEC6"
                          style={styles.pathArrow}
                        />
                      ) : null}
                    </View>
                  );
                }) : (
                  <Text style={styles.helper}>Esta trilha ainda não contém etapas.</Text>
                )}
              </View>
            </View>
          )) : (
            <View style={styles.emptyCard}>
              <View style={styles.workflowIcon}>
                <Ionicons name="git-branch-outline" size={21} color="#087F8C" />
              </View>
              <Text style={styles.emptyTitle}>Nenhuma trilha encontrada</Text>
              <Text style={styles.helper}>
                {query || statusFilter !== 'all' || assigneeFilter !== 'all'
                  ? 'Ajuste a busca ou os filtros para ver outras trilhas.'
                  : 'Crie uma trilha para organizar etapas reutilizáveis.'}
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      <Modal
        visible={stageModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setStageModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.createModal}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fechar criação de etapa"
              onPress={() => setStageModalOpen(false)}
              style={styles.modalClose}
            >
              <Ionicons name="close" size={21} color="#627485" />
            </Pressable>
            <Text style={styles.modalEyebrow}>QUADRO DE ETAPAS</Text>
            <Text style={styles.modalTitle}>Criar etapa</Text>
            <Text style={styles.modalDescription}>
              Cadastre uma etapa reutilizável para montar trilhas. O tradutor é atribuído quando o projeto é criado.
            </Text>
            <Text style={styles.formLabel}>Nome da etapa</Text>
            <TextInput
              value={newStageName}
              onChangeText={(value) => {
                setNewStageName(value);
                setCreateError(null);
              }}
              placeholder="Ex.: Revisão final"
              placeholderTextColor="#98A7B1"
              style={styles.formInput}
            />
            {createError && stageModalOpen ? (
              <Text accessibilityRole="alert" style={styles.formError}>{createError}</Text>
            ) : null}
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setStageModalOpen(false)}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable
                disabled={saving}
                onPress={() => void saveNewStage()}
                style={[styles.primaryButton, saving && styles.disabled]}
              >
                {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : null}
                <Text style={styles.primaryButtonText}>
                  {saving ? 'Salvando...' : 'Criar etapa'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={pathModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPathModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.createModal}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fechar criação de trilha"
              onPress={() => setPathModalOpen(false)}
              style={styles.modalClose}
            >
              <Ionicons name="close" size={21} color="#627485" />
            </Pressable>
            <Text style={styles.modalEyebrow}>TRILHAS DE TRABALHO</Text>
            <Text style={styles.modalTitle}>Criar trilha</Text>
            <Text style={styles.modalDescription}>
              Defina uma sequência reutilizável com as etapas cadastradas.
            </Text>
            <Text style={styles.formLabel}>Nome da trilha</Text>
            <TextInput
              value={newPathName}
              onChangeText={(value) => {
                setNewPathName(value);
                setCreateError(null);
              }}
              placeholder="Ex.: Tradução técnica"
              placeholderTextColor="#98A7B1"
              style={styles.formInput}
            />
            <Text style={styles.formLabel}>Etapas cadastradas</Text>
            <ScrollView style={styles.stageChoices} keyboardShouldPersistTaps="handled">
              {templates.length ? templates.map((stage) => {
                const selected = selectedStageIds.includes(stage.id);
                return (
                  <Pressable
                    key={stage.id}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    onPress={() => toggleStage(stage.id)}
                    style={[styles.stageChoice, selected && styles.stageChoiceSelected]}
                  >
                    <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                      {selected ? <Ionicons name="checkmark" size={13} color="#FFFFFF" /> : null}
                    </View>
                    <Text style={styles.stageChoiceName}>{stage.name}</Text>
                  </Pressable>
                );
              }) : (
                <Text style={styles.formHint}>Cadastre etapas antes de criar uma trilha.</Text>
              )}
            </ScrollView>
            {createError && pathModalOpen ? (
              <Text accessibilityRole="alert" style={styles.formError}>{createError}</Text>
            ) : null}
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setPathModalOpen(false)}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable
                disabled={saving || !templates.length}
                onPress={() => void saveNewPath()}
                style={[styles.primaryButton, (saving || !templates.length) && styles.disabled]}
              >
                {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : null}
                <Text style={styles.primaryButtonText}>
                  {saving ? 'Salvando...' : 'Criar trilha'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F8FA' },
  pageHeader: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 18 },
  eyebrow: { color: '#087F8C', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  title: { marginTop: 5, color: '#0B2239', fontSize: 30, fontWeight: '800', letterSpacing: -0.9 },
  description: { marginTop: 6, color: '#627485', fontSize: 13 },
  tabs: { flexDirection: 'row', gap: 5, marginHorizontal: 24, borderBottomWidth: 1, borderBottomColor: '#DFE7EC' },
  tab: { minHeight: 42, justifyContent: 'center', paddingHorizontal: 14, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#087F8C' },
  tabText: { color: '#627485', fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: '#087F8C', fontWeight: '700' },
  tools: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginHorizontal: 24, marginTop: 16, marginBottom: 16 },
  toolsNarrow: { flexDirection: 'column' },
  search: { flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 12, borderWidth: 1, borderColor: '#DFE7EC', borderRadius: 9, backgroundColor: '#FFFFFF' },
  searchInput: { flex: 1, minHeight: 42, color: '#172B3A', fontSize: 13 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginHorizontal: 24, marginBottom: 14 },
  sectionHeaderNarrow: { alignItems: 'flex-start' },
  sectionCopy: { flex: 1 },
  sectionTitle: { color: '#172B3A', fontSize: 15, fontWeight: '700' },
  sectionDescription: { marginTop: 4, color: '#627485', fontSize: 11 },
  primaryButton: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 13, borderRadius: 8, backgroundColor: '#087F8C' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  helper: { color: '#627485', fontSize: 11, lineHeight: 18 },
  error: { color: '#B42318', textAlign: 'center', lineHeight: 21 },
  board: { gap: 14, paddingHorizontal: 24, paddingBottom: 24, alignItems: 'flex-start' },
  boardNarrow: { width: '100%', flexDirection: 'column', paddingHorizontal: 24 },
  column: { width: 250, minHeight: 250, padding: 12, borderWidth: 1, borderColor: '#E2E9ED', borderRadius: 11, backgroundColor: '#EEF2F4' },
  columnNarrow: { width: '100%' },
  columnHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  columnHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  columnTitle: { color: '#415462', fontSize: 11, fontWeight: '700' },
  count: { minWidth: 22, paddingVertical: 3, borderRadius: 12, backgroundColor: '#FFFFFF', color: '#627485', fontSize: 10, fontWeight: '700', textAlign: 'center' },
  stageCard: { marginBottom: 9, padding: 13, borderWidth: 1, borderColor: '#E4EAEE', borderRadius: 9, backgroundColor: '#FFFFFF' },
  stageCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 },
  stageMenu: { paddingHorizontal: 3 },
  stageName: { color: '#172B3A', fontSize: 12, fontWeight: '700' },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  ownerName: { flex: 1, color: '#627485', fontSize: 10 },
  emptyColumn: { paddingVertical: 12, color: '#8293A0', fontSize: 10, lineHeight: 16 },
  trackList: { gap: 12, paddingHorizontal: 24, paddingBottom: 24 },
  trackCard: { padding: 18, borderWidth: 1, borderColor: '#DFE7EC', borderRadius: 11, backgroundColor: '#FFFFFF' },
  trackHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  trackIdentity: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11 },
  workflowIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#E8F6F7' },
  trackCopy: { flex: 1 },
  trackName: { color: '#172B3A', fontSize: 13, fontWeight: '700' },
  trackDescription: { marginTop: 4, color: '#627485', fontSize: 10 },
  trackCount: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 14, backgroundColor: '#E8F6F7' },
  trackCountText: { color: '#087F8C', fontSize: 10, fontWeight: '700' },
  pathStages: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 11, paddingTop: 16, marginTop: 16, borderTopWidth: 1, borderTopColor: '#EDF1F3' },
  pathStagesNarrow: { flexDirection: 'column', alignItems: 'stretch' },
  pathStageGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pathStage: { minWidth: 145, flexDirection: 'row', alignItems: 'center', gap: 8 },
  pathStageNumber: { width: 24, height: 24, paddingTop: 4, borderRadius: 12, backgroundColor: '#E8F6F7', color: '#087F8C', fontSize: 10, fontWeight: '800', textAlign: 'center' },
  pathStageCopy: { flex: 1 },
  pathStageName: { color: '#415462', fontSize: 10, fontWeight: '700' },
  pathStageOwner: { marginTop: 3, color: '#8293A0', fontSize: 9 },
  pathArrow: { marginHorizontal: 2 },
  emptyCard: { alignItems: 'center', alignSelf: 'center', width: '100%', maxWidth: 500, marginTop: 22, padding: 25, borderWidth: 1, borderColor: '#DFE7EC', borderRadius: 11, backgroundColor: '#FFFFFF' },
  emptyTitle: { marginTop: 12, marginBottom: 5, color: '#172B3A', fontSize: 14, fontWeight: '700' },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(6,22,36,0.62)' },
  createModal: { width: '100%', maxWidth: 560, maxHeight: '90%', alignSelf: 'center', padding: 24, borderRadius: 14, backgroundColor: '#FFFFFF' },
  modalClose: { position: 'absolute', zIndex: 1, top: 12, right: 12, padding: 5 },
  modalEyebrow: { color: '#087F8C', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  modalTitle: { marginTop: 7, color: '#172B3A', fontSize: 20, fontWeight: '800' },
  modalDescription: { marginTop: 5, marginBottom: 16, color: '#627485', fontSize: 11, lineHeight: 17 },
  formLabel: { marginTop: 10, marginBottom: 6, color: '#172B3A', fontSize: 11, fontWeight: '700' },
  formInput: { minHeight: 42, paddingHorizontal: 11, borderWidth: 1, borderColor: '#DFE7EC', borderRadius: 8, color: '#172B3A', fontSize: 12 },
  modalSelect: { position: 'relative', zIndex: 3, paddingTop: 8 },
  formHint: { marginTop: 8, color: '#627485', fontSize: 10, lineHeight: 16 },
  formError: { marginTop: 10, color: '#B42318', fontSize: 11, lineHeight: 17 },
  stageChoices: { maxHeight: 250, marginTop: 3 },
  stageChoice: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#EDF1F3' },
  stageChoiceSelected: { backgroundColor: '#F1FAFA' },
  checkbox: { width: 17, height: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#CAD6DD', borderRadius: 4 },
  checkboxSelected: { borderColor: '#087F8C', backgroundColor: '#087F8C' },
  stageChoiceName: { flex: 1, color: '#172B3A', fontSize: 11, fontWeight: '600' },
  stageChoiceStatus: { color: '#8293A0', fontSize: 9 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 9, marginTop: 18, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#EDF1F3' },
  secondaryButton: { minHeight: 40, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, borderWidth: 1, borderColor: '#DFE7EC', borderRadius: 8, backgroundColor: '#FFFFFF' },
  secondaryButtonText: { color: '#172B3A', fontSize: 11, fontWeight: '700' },
  disabled: { opacity: 0.55 },
});
