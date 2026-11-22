import { Ionicons } from '@expo/vector-icons';
import { Redirect, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  FlatList,
} from 'react-native';

import { WebFilePicker } from '@/components/WebFilePicker';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/services/api';
import { confirmAction, errorMessage, notify } from '@/services/dialog';
import {
  acceptCollaboration,
  acceptStage,
  declineCollaboration,
  deleteStageFile,
  declineStage,
  getStages,
  updateStage,
  uploadStageFile,
} from '@/services/stages';
import type { StageFile, TranslationStage } from '@/services/stages';

const stageStatus: Record<TranslationStage['status'], string> = {
  no_freelancer: 'Aguardando aceite',
  public: 'Público',
  ready: 'Pronta',
  in_progress: 'Em andamento',
  testing: 'Em revisão',
  done: 'Concluída',
};

function isRejectedDelivery(stage: TranslationStage) {
  return stage.status === 'in_progress' && Boolean(stage.rejection_comment);
}

const collaborationLabels = { invited: 'Convidado', accepted: 'Aceito' } as const;

export default function Servicos() {
  const { employee } = useAuth();
  const [activeTab, setActiveTab] = useState<'services' | 'pending'>('services');
  const [stages, setStages] = useState<TranslationStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Record<number, File[]>>({});
  const [uploadingStageId, setUploadingStageId] = useState<number | null>(null);
  const [respondingStageId, setRespondingStageId] = useState<number | null>(null);
  const [forwardingStageId, setForwardingStageId] = useState<number | null>(null);
  const [removingFile, setRemovingFile] = useState<{
    stageId: number;
    fileId: number;
  } | null>(null);

  // Papel do tradutor logado na etapa: principal, convidado ou colaborador.
  const isInvited = (stage: TranslationStage) =>
    stage.second_freelancer_id === employee?.id && stage.second_status === 'invited';
  const isCollaborator = (stage: TranslationStage) =>
    stage.second_freelancer_id === employee?.id && stage.second_status === 'accepted';
  // Colaborador aceito só envia depois que o responsável aceitar a etapa.
  const isUploadBlocked = (stage: TranslationStage) =>
    isCollaborator(stage) && stage.status === 'no_freelancer';
  const isPending = (stage: TranslationStage) =>
    isInvited(stage) || (!isCollaborator(stage) && stage.status === 'no_freelancer');

  const loadStages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStages(await getStages());
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao carregar serviços.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  async function respondToStage(stage: TranslationStage, action: 'accept' | 'decline') {
    setRespondingStageId(stage.id);
    try {
      if (action === 'accept') {
        await acceptStage(stage.id);
      } else {
        await declineStage(stage.id);
      }

      const refreshed = await loadStages();
      notify(
        refreshed ? 'Sucesso' : 'Resposta registrada',
        refreshed
          ? action === 'accept'
            ? 'Etapa aceita e iniciada.'
            : 'Etapa recusada e devolvida ao gestor.'
          : 'Sua resposta foi registrada, mas não foi possível atualizar a lista.',
      );
    } catch (cause) {
      notify('Não foi possível responder', errorMessage(cause));
    } finally {
      setRespondingStageId(null);
    }
  }

  async function respondToCollaboration(
    stage: TranslationStage,
    action: 'accept' | 'decline',
  ) {
    setRespondingStageId(stage.id);
    try {
      if (action === 'accept') {
        await acceptCollaboration(stage.id);
      } else {
        await declineCollaboration(stage.id);
      }

      const refreshed = await loadStages();
      notify(
        refreshed ? 'Sucesso' : 'Resposta registrada',
        refreshed
          ? action === 'accept'
            ? 'Convite aceito. A etapa está em Meus serviços.'
            : 'Convite recusado.'
          : 'Sua resposta foi registrada, mas não foi possível atualizar a lista.',
      );
    } catch (cause) {
      notify('Não foi possível responder', errorMessage(cause));
    } finally {
      setRespondingStageId(null);
    }
  }

  async function uploadDocument(stage: TranslationStage) {
    const files = selectedFiles[stage.id] ?? [];
    if (!files.length) {
      notify('Selecione um documento', 'Escolha um documento antes de enviar.');
      return;
    }

    setUploadingStageId(stage.id);
    let uploadedCount = 0;
    try {
      for (const file of files) {
        await uploadStageFile(stage.id, file);
        uploadedCount += 1;
      }
      // Só o tradutor principal encaminha a etapa para revisão.
      const collaborator = isCollaborator(stage);
      if (!collaborator) {
        await updateStage(stage.id, { status: 'testing' });
      }
      setSelectedFiles((current) => ({ ...current, [stage.id]: [] }));
      const refreshed = await loadStages();
      notify(
        refreshed ? 'Documentos enviados' : 'Envio concluído',
        collaborator
          ? 'Os documentos foram anexados à etapa. O tradutor principal encaminha a etapa para revisão.'
          : refreshed
            ? 'A etapa foi encaminhada para revisão do gestor.'
            : 'Os documentos foram enviados para revisão, mas não foi possível atualizar sua lista.',
      );
    } catch (cause) {
      const message = errorMessage(cause);
      notify(
        uploadedCount === files.length
          ? 'Documentos anexados, mas não enviados para revisão'
          : 'Não foi possível enviar documentos',
        uploadedCount > 0 && uploadedCount < files.length
          ? `${uploadedCount} de ${files.length} documentos foram anexados. ${message}`
          : message,
      );
    } finally {
      setUploadingStageId(null);
    }
  }

  // Principal encaminha com os arquivos já anexados, sem novo envio.
  const canForward = (stage: TranslationStage) =>
    !isCollaborator(stage) && stage.status === 'in_progress' && stage.files.length > 0;

  async function forwardToReview(stage: TranslationStage) {
    setForwardingStageId(stage.id);
    try {
      await updateStage(stage.id, { status: 'testing' });
      const refreshed = await loadStages();
      notify(
        refreshed ? 'Etapa encaminhada' : 'Encaminhamento concluído',
        refreshed
          ? 'A etapa foi encaminhada para revisão do gestor.'
          : 'A etapa foi encaminhada, mas não foi possível atualizar sua lista.',
      );
    } catch (cause) {
      notify('Não foi possível encaminhar', errorMessage(cause));
    } finally {
      setForwardingStageId(null);
    }
  }

  async function removeDocument(stage: TranslationStage, file: StageFile) {
    setRemovingFile({ stageId: stage.id, fileId: file.id });
    try {
      await deleteStageFile(stage.id, file.id);
      const refreshed = await loadStages();
      notify(
        refreshed ? 'Documento removido' : 'Remoção concluída',
        refreshed
          ? 'O arquivo foi removido da etapa.'
          : 'O arquivo foi removido, mas não foi possível atualizar sua lista.',
      );
    } catch (cause) {
      notify('Não foi possível remover o documento', errorMessage(cause));
    } finally {
      setRemovingFile(null);
    }
  }

  useFocusEffect(
    useCallback(() => {
      if (employee?.status !== 'pending') {
        void loadStages();
      }
    }, [employee?.status, loadStages]),
  );

  if (employee?.status === 'pending') {
    return <Redirect href="/tradutor/completar-perfil" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>ÁREA DO TRADUTOR</Text>
      <Text style={styles.title}>Meus serviços</Text>
      <Text style={styles.description}>
        Consulte suas etapas e responda às novas atribuições.
      </Text>

      <View style={styles.tabs}>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'services' }}
          onPress={() => setActiveTab('services')}
          style={[styles.tab, activeTab === 'services' && styles.activeTab]}
        >
          <Text style={[styles.tabText, activeTab === 'services' && styles.activeTabText]}>
            Meus serviços
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'pending' }}
          onPress={() => setActiveTab('pending')}
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            Aguardando aceite
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#087F8C" />
          <Text style={styles.description}>Carregando serviços...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>Não foi possível carregar os serviços: {error}</Text>
          <Pressable style={styles.button} onPress={() => void loadStages()}>
            <Text style={styles.buttonText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={stages.filter((stage) =>
            activeTab === 'pending' ? isPending(stage) : !isPending(stage),
          )}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <View style={styles.icon}>
                <Ionicons name="language-outline" size={26} color="#087F8C" />
              </View>
              <Text style={styles.emptyTitle}>
                {activeTab === 'pending'
                  ? 'Nenhuma etapa aguardando aceite'
                  : 'Nenhum serviço atribuído'}
              </Text>
              <Text style={styles.description}>
                {activeTab === 'pending'
                  ? 'Novas atribuições do gestor aparecerão aqui.'
                  : 'Não há serviços associados à sua conta neste momento.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.stageCard}>
              <View style={styles.stageHeading}>
                <View style={styles.stageTitle}>
                  <Text style={styles.stageName}>{item.name}</Text>
                  {isCollaborator(item) ? (
                    <View style={[styles.statusPill, styles.collaboratorPill]}>
                      <Text style={[styles.stageStatus, styles.collaboratorText]}>
                        Colaborador
                      </Text>
                    </View>
                  ) : null}
                </View>
                <View
                  style={[
                    styles.statusPill,
                    activeTab === 'pending'
                      ? styles.pendingPill
                      : isRejectedDelivery(item)
                        ? styles.rejectedPill
                        : styles.completePill,
                  ]}
                >
                  <Text
                    style={[
                      styles.stageStatus,
                      activeTab === 'pending'
                        ? styles.pendingText
                        : isRejectedDelivery(item)
                          ? styles.rejectedText
                          : styles.completeText,
                    ]}
                  >
                    {activeTab === 'pending'
                      ? isInvited(item)
                        ? 'Convite para colaborar'
                        : 'Aguardando aceite'
                      : isRejectedDelivery(item)
                        ? 'Negada'
                        : item.files.length === 0
                          ? 'Pendente'
                          : stageStatus[item.status]}
                  </Text>
                </View>
              </View>
              {!isInvited(item) && !isCollaborator(item) && item.second_freelancer_id !== null ? (
                <Text style={styles.documentHint}>
                  Tradutor adicional: {item.second_freelancer_name ?? 'convidado'}
                  {item.second_status ? ` (${collaborationLabels[item.second_status]})` : ''}
                </Text>
              ) : null}
              {activeTab === 'pending' && isInvited(item) ? (
                <>
                  <Text style={styles.documentHint}>
                    Convite para colaborar: o gestor convidou você como tradutor adicional desta etapa.
                  </Text>
                  <View style={styles.responseActions}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Aceitar convite para colaborar em ${item.name}`}
                      aria-busy={respondingStageId === item.id}
                      disabled={respondingStageId === item.id}
                      onPress={() => void respondToCollaboration(item, 'accept')}
                      style={[styles.acceptButton, respondingStageId === item.id && styles.disabled]}
                    >
                      {respondingStageId === item.id ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Ionicons name="checkmark" size={17} color="#FFFFFF" />
                      )}
                      <Text style={styles.buttonText}>ACEITAR</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Recusar convite para colaborar em ${item.name}`}
                      disabled={respondingStageId === item.id}
                      onPress={() => confirmAction(
                        'Recusar convite',
                        'O gestor poderá convidar outro tradutor para esta etapa.',
                        'Recusar',
                        () => void respondToCollaboration(item, 'decline'),
                      )}
                      style={[styles.declineButton, respondingStageId === item.id && styles.disabled]}
                    >
                      <Ionicons name="close" size={17} color="#A46B12" />
                      <Text style={styles.declineButtonText}>RECUSAR</Text>
                    </Pressable>
                  </View>
                </>
              ) : activeTab === 'pending' ? (
                <>
                  <Text style={styles.documentHint}>
                    O gestor atribuiu esta etapa a você. Aceite para iniciar ou recuse para devolvê-la.
                  </Text>
                  <View style={styles.responseActions}>
                    <Pressable
                      accessibilityRole="button"
                      disabled={respondingStageId === item.id}
                      onPress={() => void respondToStage(item, 'accept')}
                      style={[styles.acceptButton, respondingStageId === item.id && styles.disabled]}
                    >
                      {respondingStageId === item.id ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Ionicons name="checkmark" size={17} color="#FFFFFF" />
                      )}
                      <Text style={styles.buttonText}>ACEITAR</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      disabled={respondingStageId === item.id}
                      onPress={() => confirmAction(
                        'Recusar etapa',
                        'A etapa voltará ao gestor para uma nova atribuição.',
                        'Recusar',
                        () => void respondToStage(item, 'decline'),
                      )}
                      style={[styles.declineButton, respondingStageId === item.id && styles.disabled]}
                    >
                      <Ionicons name="close" size={17} color="#A46B12" />
                      <Text style={styles.declineButtonText}>RECUSAR</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <>
                  {isRejectedDelivery(item) && item.rejection_comment ? (
                    <View style={styles.rejectionNotice}>
                      <Ionicons
                        name="alert-circle-outline"
                        size={18}
                        color="#B42318"
                      />
                      <View style={styles.rejectionCopy}>
                        <Text style={styles.rejectionTitle}>
                          Entrega recusada pelo gestor
                        </Text>
                        <Text style={styles.rejectionText}>
                          {item.rejection_comment}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                  <Text style={styles.documentHint}>
                    {item.files.length
                      ? 'Documento(s) anexado(s):'
                      : isCollaborator(item)
                        ? 'Anexe seus documentos; o tradutor principal encaminha a etapa para revisão.'
                        : 'Anexe o documento desta etapa para atualizar o status.'}
                  </Text>
                  {item.files.map((file) => (
                    <View key={file.id} style={styles.fileRow}>
                      <Pressable
                        accessibilityRole="link"
                        onPress={() => void Linking.openURL(`${API_URL}/stages/${item.id}/files/${file.id}`)}
                        style={[styles.fileLink, styles.fileLinkInRow]}
                      >
                        <Ionicons name="document-outline" size={16} color="#087F8C" />
                        <Text numberOfLines={1} style={styles.fileName}>{file.original_name}</Text>
                        <Ionicons name="download-outline" size={15} color="#627485" />
                      </Pressable>
                      {item.status !== 'done' &&
                        file.uploaded_by_id === employee?.id ? (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Remover ${file.original_name}`}
                          disabled={
                            removingFile?.fileId === file.id ||
                            uploadingStageId === item.id
                          }
                          onPress={() => confirmAction(
                            'Remover documento',
                            `O arquivo "${file.original_name}" será removido da etapa.`,
                            'Remover',
                            () => void removeDocument(item, file),
                          )}
                          style={[
                            styles.removeFileButton,
                            (removingFile?.fileId === file.id ||
                              uploadingStageId === item.id) &&
                              styles.disabled,
                          ]}
                        >
                          {removingFile?.fileId === file.id ? (
                            <ActivityIndicator size="small" color="#B42318" />
                          ) : (
                            <Ionicons name="trash-outline" size={16} color="#B42318" />
                          )}
                          <Text style={styles.removeFileText}>REMOVER</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  ))}
                  {isUploadBlocked(item) ? (
                    <Text style={styles.blockedNotice}>
                      Aguarde o responsável aceitar a etapa para enviar documentos.
                    </Text>
                  ) : (
                    <WebFilePicker
                      files={selectedFiles[item.id] ?? []}
                      onChange={(files) => setSelectedFiles((current) => ({ ...current, [item.id]: files }))}
                    />
                  )}
                  {Platform.OS === 'web' ? (
                    <Pressable
                      accessibilityRole="button"
                      aria-disabled={
                        isUploadBlocked(item) ||
                        uploadingStageId === item.id ||
                        removingFile?.stageId === item.id ||
                        !(selectedFiles[item.id]?.length)
                      }
                      disabled={
                        isUploadBlocked(item) ||
                        uploadingStageId === item.id ||
                        removingFile?.stageId === item.id ||
                        !(selectedFiles[item.id]?.length)
                      }
                      onPress={() => void uploadDocument(item)}
                      style={[
                        styles.uploadButton,
                        (isUploadBlocked(item) ||
                          uploadingStageId === item.id ||
                          removingFile?.stageId === item.id ||
                          !(selectedFiles[item.id]?.length)) &&
                          styles.disabled,
                      ]}
                    >
                      {uploadingStageId === item.id
                        ? <ActivityIndicator size="small" color="#FFFFFF" />
                        : <Ionicons name="cloud-upload-outline" size={16} color="#FFFFFF" />}
                      <Text style={styles.buttonText}>
                        {uploadingStageId === item.id ? 'ENVIANDO...' : 'ENVIAR DOCUMENTOS'}
                      </Text>
                    </Pressable>
                  ) : null}
                  {canForward(item) ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Encaminhar ${item.name} para revisão`}
                      aria-busy={forwardingStageId === item.id}
                      aria-disabled={
                        forwardingStageId === item.id ||
                        uploadingStageId === item.id ||
                        removingFile?.stageId === item.id
                      }
                      disabled={
                        forwardingStageId === item.id ||
                        uploadingStageId === item.id ||
                        removingFile?.stageId === item.id
                      }
                      onPress={() => confirmAction(
                        'Encaminhar para revisão',
                        'A etapa será enviada ao gestor com os documentos já anexados.',
                        'Encaminhar',
                        () => void forwardToReview(item),
                      )}
                      style={[
                        styles.forwardButton,
                        (forwardingStageId === item.id ||
                          uploadingStageId === item.id ||
                          removingFile?.stageId === item.id) &&
                          styles.disabled,
                      ]}
                    >
                      {forwardingStageId === item.id
                        ? <ActivityIndicator size="small" color="#087F8C" />
                        : <Ionicons name="send-outline" size={16} color="#087F8C" />}
                      <Text style={styles.forwardButtonText}>
                        {forwardingStageId === item.id ? 'ENCAMINHANDO...' : 'Encaminhar para revisão'}
                      </Text>
                    </Pressable>
                  ) : null}
                </>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#F5F8FA' },
  eyebrow: { color: '#087F8C', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  title: { marginTop: 7, color: '#0B2239', fontSize: 29, fontWeight: '800' },
  description: { marginTop: 7, color: '#627485', fontSize: 13, lineHeight: 20 },
  tabs: { flexDirection: 'row', gap: 8, marginTop: 20, borderBottomWidth: 1, borderBottomColor: '#DFE7EC' },
  tab: { paddingHorizontal: 12, paddingVertical: 11 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#087F8C' },
  tabText: { color: '#627485', fontSize: 12, fontWeight: '700' },
  activeTabText: { color: '#087F8C' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { color: '#B42318', textAlign: 'center', lineHeight: 21 },
  button: { marginTop: 16, padding: 12, borderRadius: 8, backgroundColor: '#087F8C' },
  buttonText: { color: '#FFFFFF', fontWeight: '700' },
  stageTitle: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  collaboratorPill: { backgroundColor: '#E8F6F7' },
  blockedNotice: {
    marginBottom: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#FFF5E3',
    color: '#8A5A0B',
    fontSize: 12,
    lineHeight: 18,
  },
  collaboratorText: { color: '#087F8C' },
  list: { paddingTop: 20, gap: 12, flexGrow: 1 },
  stageCard: {
    padding: 18,
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  stageHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  stageName: { color: '#172B3A', fontSize: 16, fontWeight: '700' },
  stageStatus: { marginTop: 6, color: '#627485', fontSize: 13 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15 },
  pendingPill: { backgroundColor: '#FFF5E3' },
  completePill: { backgroundColor: '#E8F5EE' },
  rejectedPill: { backgroundColor: '#FCECEC' },
  pendingText: { marginTop: 0, color: '#A46B12', fontSize: 10, fontWeight: '700' },
  completeText: { marginTop: 0, color: '#20845A', fontSize: 10, fontWeight: '700' },
  rejectedText: { marginTop: 0, color: '#B42318', fontSize: 10, fontWeight: '700' },
  rejectionNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    padding: 11,
    borderRadius: 8,
    backgroundColor: '#FCECEC',
  },
  rejectionCopy: { flex: 1, gap: 3 },
  rejectionTitle: { color: '#B42318', fontSize: 12, fontWeight: '700' },
  rejectionText: { color: '#7A271A', fontSize: 12, lineHeight: 18 },
  documentHint: { marginTop: 10, marginBottom: 8, color: '#627485', fontSize: 11 },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  fileLinkInRow: { flex: 1 },
  fileLink: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 6, paddingHorizontal: 9, borderRadius: 7, backgroundColor: '#F5F8FA' },
  removeFileButton: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
    paddingHorizontal: 8,
    borderRadius: 7,
    backgroundColor: '#FCECEC',
  },
  removeFileText: { color: '#B42318', fontSize: 10, fontWeight: '700' },
  fileName: { flex: 1, color: '#087F8C', fontSize: 11 },
  uploadButton: { minHeight: 38, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 5, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#087F8C' },
  disabled: { opacity: 0.55 },
  forwardButton: { minHeight: 38, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#087F8C', borderRadius: 8, backgroundColor: '#FFFFFF' },
  forwardButtonText: { color: '#087F8C', fontWeight: '700' },
  responseActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 12 },
  acceptButton: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 14, borderRadius: 8, backgroundColor: '#087F8C' },
  declineButton: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 14, borderWidth: 1, borderColor: '#F0D8A8', borderRadius: 8, backgroundColor: '#FFF5E3' },
  declineButtonText: { color: '#A46B12', fontWeight: '700' },
  emptyCard: {
    alignItems: 'center',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 560,
    marginTop: 16,
    padding: 28,
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  icon: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 27,
    backgroundColor: '#E8F6F7',
  },
  emptyTitle: { marginTop: 16, color: '#172B3A', fontSize: 17, fontWeight: '700' },
});
