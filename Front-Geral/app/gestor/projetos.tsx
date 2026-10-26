import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { API_URL } from '@/services/api';
import { getEmployees } from '@/services/employees';
import type { Employee } from '@/services/employees';
import {
  getProjectDetails,
  getProjects,
} from '@/services/projects';
import type { Project, ProjectDetails } from '@/services/projects';
import { updateStage } from '@/services/stages';

const statusNames: Record<Project['status'], string> = {
  ready: 'Pronto',
  in_progress: 'Em andamento',
  testing: 'Em revisão',
  done: 'Concluído',
};

const statusColors: Record<Project['status'], string> = {
  ready: '#8A99A5',
  in_progress: '#397BC5',
  testing: '#8064B5',
  done: '#20845A',
};

export default function Projetos() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [details, setDetails] = useState<ProjectDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [freelancers, setFreelancers] = useState<Employee[]>([]);
  const [freelancersLoading, setFreelancersLoading] = useState(true);
  const [freelancersError, setFreelancersError] = useState<string | null>(null);
  const [selectedStageId, setSelectedStageId] = useState<number | null>(null);
  const [updatingStageId, setUpdatingStageId] = useState<number | null>(null);
  const { width } = useWindowDimensions();
  const wide = width >= 720;

  const filteredProjects = projects.filter((project) =>
    `${project.name} ${statusNames[project.status]}`
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase()),
  );

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProjects(await getProjects());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao carregar projetos.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFreelancers = useCallback(async () => {
    setFreelancersLoading(true);
    setFreelancersError(null);
    try {
      const result = await getEmployees('freelancer');
      setFreelancers(result.employees);
    } catch (cause) {
      setFreelancersError(
        cause instanceof Error ? cause.message : 'Falha ao carregar freelancers.',
      );
    } finally {
      setFreelancersLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadProjects();
      void loadFreelancers();
    }, [loadFreelancers, loadProjects]),
  );

  async function openProject(project: Project) {
    setSelectedProject(project);
    setDetails(null);
    setDetailsError(null);
    setDetailsLoading(true);
    try {
      const loadedDetails = await getProjectDetails(project.id);
      const firstStage = loadedDetails.paths.flatMap((path) => path.stages)[0];
      setSelectedStageId(firstStage?.id ?? null);
      setDetails(loadedDetails);
    } catch (cause) {
      setDetailsError(cause instanceof Error ? cause.message : 'Falha ao carregar detalhes do projeto.');
    } finally {
      setDetailsLoading(false);
    }
  }

  function closeProject() {
    setSelectedProject(null);
    setDetails(null);
    setDetailsError(null);
    setSelectedStageId(null);
  }

  async function openFile(projectId: number, fileId: number) {
    try {
      await Linking.openURL(`${API_URL}/projects/${projectId}/files/${fileId}`);
    } catch (cause) {
      setDetailsError(cause instanceof Error ? cause.message : 'Não foi possível abrir o arquivo.');
    }
  }

  async function assignResponsible(stageId: number, freelancerId: number | null) {
    if (!details) {
      return;
    }
    setUpdatingStageId(stageId);
    setDetailsError(null);
    try {
      await updateStage(stageId, { freelancer_id: freelancerId });
      const refreshedDetails = await getProjectDetails(details.id);
      setDetails(refreshedDetails);
      const refreshedStageIds = refreshedDetails.paths.flatMap((path) =>
        path.stages.map((stage) => stage.id),
      );
      setSelectedStageId(
        refreshedStageIds.includes(stageId)
          ? stageId
          : (refreshedStageIds[0] ?? null),
      );
    } catch (cause) {
      setDetailsError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível alterar o responsável da etapa.',
      );
    } finally {
      setUpdatingStageId(null);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>GESTÃO DE PROJETOS</Text>
        <Text style={styles.title}>Projetos</Text>
        <Text style={styles.description}>Selecione um projeto para ver trilhas, etapas e responsáveis.</Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#087F8C" /></View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>Não foi possível carregar os projetos: {error}</Text>
          <Pressable onPress={() => void loadProjects()} style={styles.button}>
            <Text style={styles.buttonText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.search}>
            <Ionicons name="search-outline" size={18} color="#627485" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar projetos"
              placeholderTextColor="#98A7B1"
              accessibilityLabel="Buscar projetos"
              style={styles.searchInput}
            />
          </View>
          <FlatList
            data={filteredProjects}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            ListHeaderComponent={wide ? (
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeading, styles.projectColumn]}>Projeto</Text>
                <Text style={styles.tableHeading}>Status</Text>
                <Text style={styles.tableHeading}>Trilhas</Text>
              </View>
            ) : null}
            ListEmptyComponent={
              <View style={styles.emptyCard}>
                <View style={styles.icon}>
                  <Ionicons name="folder-open-outline" size={26} color="#087F8C" />
                </View>
                <Text style={styles.emptyTitle}>
                  {query ? 'Nenhum projeto encontrado' : 'Nenhum projeto cadastrado'}
                </Text>
                <Text style={styles.emptyDescription}>
                  {query ? 'Tente buscar usando outro nome ou status.' : 'Não há projetos retornados pelo backend.'}
                </Text>
                {!query ? (
                  <Pressable onPress={() => router.push('/gestor/workflow')} style={styles.button}>
                    <Text style={styles.buttonText}>Configurar workflows</Text>
                  </Pressable>
                ) : null}
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Abrir detalhes do projeto ${item.name}`}
                onPress={() => void openProject(item)}
                style={({ pressed }) => [
                  styles.projectCard,
                  !wide && styles.projectCardNarrow,
                  pressed && styles.projectCardPressed,
                ]}
              >
                <View style={styles.projectIdentity}>
                  <View style={styles.projectIcon}>
                    <Ionicons name="folder-outline" size={18} color="#087F8C" />
                  </View>
                  <Text style={styles.projectName}>{item.name}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: `${statusColors[item.status]}1A` }]}>
                  <Text style={[styles.projectStatus, { color: statusColors[item.status] }]}>
                    {statusNames[item.status]}
                  </Text>
                </View>
                <Text style={styles.projectDetails}>
                  {item.paths.length} {item.paths.length === 1 ? 'trilha' : 'trilhas'}
                </Text>
                <Ionicons name="chevron-forward" size={17} color="#8293A0" />
              </Pressable>
            )}
          />
        </>
      )}

      <Modal
        visible={selectedProject !== null}
        transparent
        animationType="fade"
        onRequestClose={closeProject}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.detailModal}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeadingCopy}>
                <Text style={styles.modalEyebrow}>DETALHES DO PROJETO</Text>
                <Text style={styles.modalTitle}>{details?.name ?? selectedProject?.name}</Text>
                {details ? (
                  <Text style={styles.modalDescription}>
                    Projeto {statusNames[details.status].toLocaleLowerCase()} · Responsável: {details.creator_name}
                  </Text>
                ) : null}
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Fechar detalhes" onPress={closeProject} style={styles.closeButton}>
                <Ionicons name="close" size={22} color="#627485" />
              </Pressable>
            </View>
            {detailsLoading ? (
              <View style={styles.center}><ActivityIndicator color="#087F8C" /></View>
            ) : detailsError ? (
              <View style={styles.center}>
                <Text style={styles.error}>{detailsError}</Text>
                {selectedProject ? (
                  <Pressable onPress={() => void openProject(selectedProject)} style={styles.button}>
                    <Text style={styles.buttonText}>Tentar novamente</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : details ? (
              <ScrollView style={styles.detailsScroll} contentContainerStyle={styles.detailsContent}>
                <Text style={styles.sectionTitle}>Trilhas do projeto</Text>
                {details.paths.map((path) => (
                  <View key={path.id} style={styles.pathSection}>
                    <Text style={styles.pathTitle}>{path.sequence}. {path.name}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator>
                      <View style={styles.timeline}>
                        {path.stages.map((stage, index) => (
                          <View key={stage.id} style={styles.timelineGroup}>
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={`Selecionar etapa ${stage.name}`}
                              onPress={() => setSelectedStageId(stage.id)}
                              style={[
                                styles.stageBox,
                                selectedStageId === stage.id && styles.stageBoxSelected,
                              ]}
                            >
                              <View style={[styles.stageStatusDot, { backgroundColor: statusColors[stage.status] }]} />
                              <Text style={styles.stageBoxName}>{stage.name}</Text>
                              <Text style={styles.stageBoxMeta}>
                                {stage.freelancer_name ?? 'Sem responsável'}
                              </Text>
                              <Text style={[styles.stageBoxStatus, { color: statusColors[stage.status] }]}>
                                {statusNames[stage.status]}
                              </Text>
                            </Pressable>
                            {index < path.stages.length - 1 ? <View style={styles.connector} /> : null}
                          </View>
                        ))}
                        {path.stages.length === 0 ? (
                          <Text style={styles.emptyDescription}>Esta trilha não possui etapas.</Text>
                        ) : null}
                      </View>
                    </ScrollView>
                  </View>
                ))}

                <View style={styles.projectInfo}>
                  <Text style={styles.sectionTitle}>Etapa selecionada</Text>
                  <Text style={styles.infoLine}>Responsável pelo projeto: {details.creator_name}</Text>
                  {(() => {
                    const stageEntries = details.paths.flatMap((path) =>
                      path.stages.map((stage) => ({ path, stage })),
                    );
                    const selectedStage = stageEntries.find(
                      (entry) => entry.stage.id === selectedStageId,
                    ) ?? stageEntries[0];

                    if (!selectedStage) {
                      return (
                        <Text style={styles.infoLine}>
                          Nenhuma etapa associada ao projeto.
                        </Text>
                      );
                    }

                    const { stage, path } = selectedStage;
                    return (
                      <View style={styles.stageDetails}>
                        <Text style={styles.stageDetailsTitle}>
                          {stage.name}
                        </Text>
                        <Text style={styles.infoLine}>
                          Trilha: {path.sequence}. {path.name}
                        </Text>
                        <Text style={styles.infoLine}>
                          Situação: {statusNames[stage.status]}
                        </Text>
                        <Text style={styles.infoLine}>
                          Responsável atual: {stage.freelancer_name ?? 'Não atribuído'}
                        </Text>
                        <Text style={styles.assignTitle}>Atribuir responsável</Text>
                        {freelancersLoading ? (
                          <ActivityIndicator size="small" color="#087F8C" />
                        ) : freelancersError ? (
                          <Text style={styles.errorInline}>
                            Não foi possível carregar os freelancers: {freelancersError}
                          </Text>
                        ) : (
                          <View style={styles.employeePicker}>
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel="Remover responsável da etapa"
                              disabled={updatingStageId === stage.id}
                              onPress={() => void assignResponsible(stage.id, null)}
                              style={[
                                styles.employeeOption,
                                stage.freelancer_id === null && styles.employeeOptionSelected,
                                updatingStageId === stage.id && styles.optionDisabled,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.employeeText,
                                  stage.freelancer_id === null && styles.employeeTextSelected,
                                ]}
                              >
                                Sem responsável
                              </Text>
                            </Pressable>
                            {freelancers.map((freelancer) => (
                              <Pressable
                                key={freelancer.id}
                                accessibilityRole="button"
                                accessibilityLabel={`Atribuir ${freelancer.username} à etapa`}
                                disabled={updatingStageId === stage.id}
                                onPress={() =>
                                  void assignResponsible(stage.id, freelancer.id)
                                }
                                style={[
                                  styles.employeeOption,
                                  stage.freelancer_id === freelancer.id &&
                                    styles.employeeOptionSelected,
                                  updatingStageId === stage.id && styles.optionDisabled,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.employeeText,
                                    stage.freelancer_id === freelancer.id &&
                                      styles.employeeTextSelected,
                                  ]}
                                >
                                  {freelancer.username}
                                </Text>
                              </Pressable>
                            ))}
                          </View>
                        )}
                        {stage.files.length > 0 ? (
                          <View style={styles.files}>
                            {stage.files.map((file) => (
                              <Pressable
                                key={file.id}
                                accessibilityRole="link"
                                onPress={() => void openFile(details.id, file.id)}
                                style={styles.fileLink}
                              >
                                <Ionicons name="document-outline" size={16} color="#087F8C" />
                                <Text style={styles.fileName}>{file.original_name}</Text>
                                <Ionicons name="download-outline" size={15} color="#627485" />
                              </Pressable>
                            ))}
                          </View>
                        ) : (
                          <Text style={styles.infoLine}>
                            Sem arquivos anexados nesta etapa.
                          </Text>
                        )}
                      </View>
                    );
                  })()}
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F8FA' },
  header: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 18 },
  eyebrow: { color: '#087F8C', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  title: { marginTop: 5, color: '#0B2239', fontSize: 30, fontWeight: '800', letterSpacing: -0.9 },
  description: { marginTop: 7, color: '#627485', fontSize: 13, lineHeight: 20 },
  search: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 9, marginHorizontal: 24, marginBottom: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#DFE7EC', borderRadius: 9, backgroundColor: '#FFFFFF' },
  searchInput: { flex: 1, minHeight: 42, color: '#172B3A', fontSize: 13 },
  list: { paddingHorizontal: 24, paddingBottom: 24, flexGrow: 1 },
  tableHeader: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderWidth: 1, borderColor: '#DFE7EC', borderTopLeftRadius: 10, borderTopRightRadius: 10, backgroundColor: '#F9FBFC' },
  tableHeading: { width: 110, color: '#627485', fontSize: 10, fontWeight: '700' },
  projectColumn: { flex: 1 },
  projectCard: { minHeight: 68, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 16, borderWidth: 1, borderTopWidth: 0, borderColor: '#DFE7EC', backgroundColor: '#FFFFFF' },
  projectCardNarrow: { minHeight: 68, marginBottom: 9, paddingHorizontal: 12, borderTopWidth: 1, borderRadius: 10 },
  projectCardPressed: { backgroundColor: '#F4FBFC', borderColor: '#A9D4D8' },
  projectIdentity: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 },
  projectIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: '#E8F6F7' },
  projectName: { flex: 1, color: '#172B3A', fontSize: 12, fontWeight: '700' },
  statusPill: { minWidth: 86, alignItems: 'center', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 20 },
  projectStatus: { fontSize: 10, fontWeight: '700' },
  projectDetails: { width: 90, color: '#627485', fontSize: 11 },
  emptyCard: { alignItems: 'center', alignSelf: 'center', width: '100%', maxWidth: 520, marginTop: 26, padding: 26, borderWidth: 1, borderColor: '#DFE7EC', borderRadius: 12, backgroundColor: '#FFFFFF' },
  icon: { width: 50, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 25, backgroundColor: '#E8F6F7' },
  emptyTitle: { marginTop: 14, color: '#172B3A', fontSize: 15, fontWeight: '700' },
  emptyDescription: { marginTop: 6, color: '#627485', fontSize: 12, lineHeight: 18, textAlign: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  error: { color: '#B42318', textAlign: 'center', lineHeight: 21 },
  button: { marginTop: 14, paddingHorizontal: 15, paddingVertical: 10, borderRadius: 8, backgroundColor: '#087F8C' },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: 18, backgroundColor: 'rgba(11,34,57,0.58)' },
  detailModal: { width: '100%', maxWidth: 1040, maxHeight: '92%', alignSelf: 'center', padding: 22, borderRadius: 14, backgroundColor: '#F5F8FA' },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 16 },
  modalHeadingCopy: { flex: 1 },
  modalEyebrow: { color: '#087F8C', fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
  modalTitle: { marginTop: 4, color: '#0B2239', fontSize: 23, fontWeight: '800' },
  modalDescription: { marginTop: 5, color: '#627485', fontSize: 11 },
  closeButton: { padding: 4 },
  detailsScroll: { flexGrow: 0 },
  detailsContent: { gap: 16, paddingBottom: 8 },
  sectionTitle: { color: '#172B3A', fontSize: 14, fontWeight: '800' },
  pathSection: { marginTop: 10, padding: 14, borderWidth: 1, borderColor: '#DFE7EC', borderRadius: 10, backgroundColor: '#FFFFFF' },
  pathTitle: { marginBottom: 12, color: '#172B3A', fontSize: 12, fontWeight: '700' },
  timeline: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3, paddingRight: 10 },
  timelineGroup: { flexDirection: 'row', alignItems: 'center' },
  stageBox: { width: 190, minHeight: 112, justifyContent: 'center', padding: 12, borderWidth: 1, borderColor: '#D8E4E9', borderRadius: 9, backgroundColor: '#FBFDFE' },
  stageBoxSelected: { borderColor: '#087F8C', backgroundColor: '#E8F6F7' },
  stageStatusDot: { width: 8, height: 8, marginBottom: 7, borderRadius: 4 },
  stageBoxName: { color: '#172B3A', fontSize: 12, fontWeight: '700' },
  stageBoxMeta: { marginTop: 6, color: '#627485', fontSize: 10 },
  stageBoxStatus: { marginTop: 5, fontSize: 10, fontWeight: '700' },
  connector: { width: 38, height: 2, backgroundColor: '#9EB1C0' },
  projectInfo: { padding: 16, borderWidth: 1, borderColor: '#DFE7EC', borderRadius: 10, backgroundColor: '#FFFFFF' },
  infoLine: { marginTop: 6, color: '#627485', fontSize: 11, lineHeight: 16 },
  stageDetails: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#EDF1F3' },
  stageDetailsTitle: { color: '#172B3A', fontSize: 11, fontWeight: '700' },
  assignTitle: { marginTop: 12, marginBottom: 7, color: '#172B3A', fontSize: 11, fontWeight: '700' },
  employeePicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  employeeOption: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  employeeOptionSelected: { borderColor: '#087F8C', backgroundColor: '#E8F6F7' },
  employeeText: { color: '#627485', fontSize: 10 },
  employeeTextSelected: { color: '#087F8C', fontWeight: '700' },
  optionDisabled: { opacity: 0.55 },
  errorInline: { marginTop: 4, color: '#B42318', fontSize: 11, lineHeight: 16 },
  files: { gap: 6, marginTop: 7 },
  fileLink: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 9, borderRadius: 7, backgroundColor: '#F5F8FA' },
  fileName: { flex: 1, color: '#087F8C', fontSize: 10, fontWeight: '600' },
});
