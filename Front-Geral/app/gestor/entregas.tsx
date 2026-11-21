import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/services/api';
import {
  listDeliveryReviews,
  saveDeliveryReview,
} from '@/services/deliveryReviews';
import type { DeliveryReview } from '@/services/deliveryReviews';
import { confirmAction, errorMessage, notify } from '@/services/dialog';
import { getProjectDetails, getProjects } from '@/services/projects';
import type { ProjectStageFile } from '@/services/projects';
import { updateStage } from '@/services/stages';

type PendingDelivery = {
  stageId: number;
  stageName: string;
  projectId: number;
  projectName: string;
  pathName: string;
  freelancerName: string | null;
  files: ProjectStageFile[];
};

type TabKey = 'pending' | 'history';

export default function Entregas() {
  const { employee } = useAuth();
  const [tab, setTab] = useState<TabKey>('pending');
  const [deliveries, setDeliveries] = useState<PendingDelivery[]>([]);
  const [history, setHistory] = useState<DeliveryReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingStageId, setActingStageId] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PendingDelivery | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);

  const pendingCount = deliveries.length;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const projects = await getProjects();
      const details = await Promise.all(
        projects.map((project) => getProjectDetails(project.id)),
      );
      const pending: PendingDelivery[] = [];
      details.forEach((project) => {
        project.paths.forEach((path) => {
          path.stages.forEach((stage) => {
            if (stage.status === 'testing') {
              pending.push({
                stageId: stage.id,
                stageName: stage.name,
                projectId: project.id,
                projectName: project.name,
                pathName: path.name,
                freelancerName: stage.freelancer_name,
                files: stage.files,
              });
            }
          });
        });
      });
      setDeliveries(pending);
      setHistory(listDeliveryReviews());
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const emptyCopy = useMemo(() => {
    if (tab === 'pending') {
      return {
        title: 'Nenhuma entrega aguardando revisão',
        description: 'Quando um freelancer enviar uma entrega, ela aparecerá aqui.',
      };
    }
    return {
      title: 'Nenhuma decisão registrada',
      description: 'Aprovações e reprovações feitas neste dispositivo aparecerão aqui.',
    };
  }, [tab]);

  async function approveDelivery(delivery: PendingDelivery) {
    setActingStageId(delivery.stageId);
    try {
      await updateStage(delivery.stageId, { status: 'done' });
      saveDeliveryReview({
        stageId: delivery.stageId,
        projectId: delivery.projectId,
        projectName: delivery.projectName,
        stageName: delivery.stageName,
        freelancerName: delivery.freelancerName,
        decision: 'approved',
        comment: null,
        decidedBy: employee?.username ?? null,
      });
      await load();
      notify('Entrega aprovada', 'A etapa foi marcada como concluída.');
    } catch (cause) {
      notify('Não foi possível aprovar', errorMessage(cause));
    } finally {
      setActingStageId(null);
    }
  }

  async function confirmReject() {
    if (!rejectTarget) {
      return;
    }
    const comment = rejectComment.trim();
    if (!comment) {
      setRejectError('Informe um comentário para reprovar a entrega.');
      return;
    }

    setActingStageId(rejectTarget.stageId);
    setRejectError(null);
    try {
      await updateStage(rejectTarget.stageId, {
        status: 'in_progress',
        rejection_comment: comment,
      });
      saveDeliveryReview({
        stageId: rejectTarget.stageId,
        projectId: rejectTarget.projectId,
        projectName: rejectTarget.projectName,
        stageName: rejectTarget.stageName,
        freelancerName: rejectTarget.freelancerName,
        decision: 'rejected',
        comment,
        decidedBy: employee?.username ?? null,
      });
      setRejectTarget(null);
      setRejectComment('');
      await load();
      notify('Entrega reprovada', 'A etapa voltou para o freelancer com o seu comentário.');
    } catch (cause) {
      notify('Não foi possível reprovar', errorMessage(cause));
    } finally {
      setActingStageId(null);
    }
  }

  function openFile(projectId: number, fileId: number) {
    void Linking.openURL(`${API_URL}/projects/${projectId}/files/${fileId}`);
  }

  function formatDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>CONTROLE DE ALTERAÇÕES</Text>
        <Text style={styles.title}>Entregas</Text>
        <Text style={styles.description}>
          Aprove ou reprove entregas dos freelancers para manter a rastreabilidade do projeto.
        </Text>
      </View>

      <View style={styles.tabs}>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === 'pending' }}
          onPress={() => setTab('pending')}
          style={[styles.tab, tab === 'pending' && styles.tabActive]}
        >
          <Text style={[styles.tabText, tab === 'pending' && styles.tabTextActive]}>
            Aguardando revisão{pendingCount ? ` (${pendingCount})` : ''}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === 'history' }}
          onPress={() => setTab('history')}
          style={[styles.tab, tab === 'history' && styles.tabActive]}
        >
          <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>
            Histórico
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#087F8C" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>Não foi possível carregar as entregas: {error}</Text>
          <Pressable onPress={() => void load()} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList<PendingDelivery | DeliveryReview>
          data={tab === 'pending' ? deliveries : history}
          keyExtractor={(item) =>
            'decision' in item ? item.id : `pending-${item.stageId}`
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <View style={styles.icon}>
                <Ionicons
                  name={tab === 'pending' ? 'clipboard-outline' : 'time-outline'}
                  size={26}
                  color="#087F8C"
                />
              </View>
              <Text style={styles.emptyTitle}>{emptyCopy.title}</Text>
              <Text style={styles.emptyDescription}>{emptyCopy.description}</Text>
            </View>
          }
          renderItem={({ item }) => {
            if ('decision' in item) {
              const review = item;
              const approved = review.decision === 'approved';
              return (
                <View style={styles.card}>
                  <View style={styles.cardHeading}>
                    <Text style={styles.cardTitle}>{review.stageName}</Text>
                    <View
                      style={[
                        styles.statusPill,
                        approved ? styles.approvedPill : styles.rejectedPill,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          approved ? styles.approvedText : styles.rejectedText,
                        ]}
                      >
                        {approved ? 'Aprovada' : 'Reprovada'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.meta}>
                    Projeto: {review.projectName}
                  </Text>
                  <Text style={styles.meta}>
                    Freelancer: {review.freelancerName ?? 'Não informado'}
                  </Text>
                  <Text style={styles.meta}>
                    Decisão em {formatDate(review.decidedAt)}
                    {review.decidedBy ? ` · por ${review.decidedBy}` : ''}
                  </Text>
                  {review.comment ? (
                    <View style={styles.commentBox}>
                      <Text style={styles.commentLabel}>Comentário</Text>
                      <Text style={styles.commentText}>{review.comment}</Text>
                    </View>
                  ) : null}
                </View>
              );
            }

            const delivery = item;
            const busy = actingStageId === delivery.stageId;
            return (
              <View style={styles.card}>
                <View style={styles.cardHeading}>
                  <Text style={styles.cardTitle}>{delivery.stageName}</Text>
                  <View style={[styles.statusPill, styles.pendingPill]}>
                    <Text style={[styles.statusText, styles.pendingText]}>Em revisão</Text>
                  </View>
                </View>
                <Text style={styles.meta}>Projeto: {delivery.projectName}</Text>
                <Text style={styles.meta}>Trilha: {delivery.pathName}</Text>
                <Text style={styles.meta}>
                  Freelancer: {delivery.freelancerName ?? 'Não informado'}
                </Text>

                <Text style={styles.filesTitle}>Arquivos da entrega</Text>
                {delivery.files.length === 0 ? (
                  <Text style={styles.meta}>Nenhum arquivo anexado nesta etapa.</Text>
                ) : (
                  delivery.files.map((file) => (
                    <Pressable
                      key={file.id}
                      accessibilityRole="link"
                      onPress={() => openFile(delivery.projectId, file.id)}
                      style={styles.fileLink}
                    >
                      <Ionicons name="document-outline" size={16} color="#087F8C" />
                      <Text style={styles.fileName}>{file.original_name}</Text>
                      <Ionicons name="download-outline" size={15} color="#627485" />
                    </Pressable>
                  ))
                )}

                <View style={styles.actions}>
                  <Pressable
                    accessibilityRole="button"
                    disabled={busy}
                    onPress={() =>
                      confirmAction(
                        'Aprovar entrega',
                        'A etapa será marcada como concluída.',
                        'Aprovar',
                        () => void approveDelivery(delivery),
                      )
                    }
                    style={[styles.approveButton, busy && styles.disabled]}
                  >
                    {busy ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons name="checkmark" size={17} color="#FFFFFF" />
                    )}
                    <Text style={styles.approveButtonText}>APROVAR</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    disabled={busy}
                    onPress={() => {
                      setRejectTarget(delivery);
                      setRejectComment('');
                      setRejectError(null);
                    }}
                    style={[styles.rejectButton, busy && styles.disabled]}
                  >
                    <Ionicons name="close" size={17} color="#B42318" />
                    <Text style={styles.rejectButtonText}>REPROVAR</Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      )}

      <Modal
        visible={rejectTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectTarget(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalCopy}>
                <Text style={styles.modalEyebrow}>REPROVAR ENTREGA</Text>
                <Text style={styles.modalTitle}>{rejectTarget?.stageName}</Text>
                <Text style={styles.meta}>
                  {rejectTarget?.projectName}
                  {rejectTarget?.freelancerName
                    ? ` · ${rejectTarget.freelancerName}`
                    : ''}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fechar"
                onPress={() => setRejectTarget(null)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={22} color="#627485" />
              </Pressable>
            </View>

            <Text style={styles.commentHint}>
              Explique o motivo da reprovação. O comentário fica registrado no histórico.
            </Text>
            <TextInput
              value={rejectComment}
              onChangeText={(value) => {
                setRejectComment(value);
                if (rejectError) {
                  setRejectError(null);
                }
              }}
              placeholder="Comentário obrigatório"
              placeholderTextColor="#98A7B1"
              maxLength={1000}
              multiline
              textAlignVertical="top"
              accessibilityLabel="Comentário da reprovação"
              style={styles.commentInput}
            />
            {rejectError ? <Text style={styles.errorInline}>{rejectError}</Text> : null}

            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setRejectTarget(null)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={actingStageId === rejectTarget?.stageId}
                onPress={() => void confirmReject()}
                style={[
                  styles.confirmRejectButton,
                  actingStageId === rejectTarget?.stageId && styles.disabled,
                ]}
              >
                {actingStageId === rejectTarget?.stageId ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmRejectText}>Confirmar reprovação</Text>
                )}
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
  header: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 10 },
  eyebrow: { color: '#087F8C', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  title: { marginTop: 5, color: '#0B2239', fontSize: 30, fontWeight: '800', letterSpacing: -0.9 },
  description: { marginTop: 7, color: '#627485', fontSize: 13, lineHeight: 20 },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 24,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#DFE7EC',
  },
  tab: { paddingHorizontal: 10, paddingVertical: 11 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#087F8C' },
  tabText: { color: '#627485', fontSize: 12, fontWeight: '700' },
  tabTextActive: { color: '#087F8C' },
  list: { paddingHorizontal: 24, paddingBottom: 28, gap: 12, flexGrow: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  error: { color: '#B42318', textAlign: 'center', lineHeight: 21 },
  errorInline: { marginTop: 8, color: '#B42318', fontSize: 11, lineHeight: 16 },
  primaryButton: {
    marginTop: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#087F8C',
  },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  emptyCard: {
    alignItems: 'center',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 520,
    marginTop: 26,
    padding: 26,
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  icon: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    backgroundColor: '#E8F6F7',
  },
  emptyTitle: { marginTop: 14, color: '#172B3A', fontSize: 15, fontWeight: '700' },
  emptyDescription: {
    marginTop: 6,
    color: '#627485',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  card: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  cardHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardTitle: { flex: 1, color: '#172B3A', fontSize: 15, fontWeight: '700' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15 },
  pendingPill: { backgroundColor: '#F1ECF8' },
  approvedPill: { backgroundColor: '#E8F5EE' },
  rejectedPill: { backgroundColor: '#FCECEC' },
  statusText: { fontSize: 10, fontWeight: '700' },
  pendingText: { color: '#8064B5' },
  approvedText: { color: '#20845A' },
  rejectedText: { color: '#B42318' },
  meta: { marginTop: 6, color: '#627485', fontSize: 11, lineHeight: 16 },
  filesTitle: { marginTop: 14, marginBottom: 6, color: '#172B3A', fontSize: 11, fontWeight: '700' },
  fileLink: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    paddingHorizontal: 9,
    borderRadius: 7,
    backgroundColor: '#F5F8FA',
  },
  fileName: { flex: 1, color: '#087F8C', fontSize: 10, fontWeight: '600' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 14 },
  approveButton: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#087F8C',
  },
  approveButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  rejectButton: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#F3C1C1',
    borderRadius: 8,
    backgroundColor: '#FCECEC',
  },
  rejectButtonText: { color: '#B42318', fontWeight: '700', fontSize: 12 },
  disabled: { opacity: 0.55 },
  commentBox: {
    marginTop: 12,
    padding: 11,
    borderRadius: 8,
    backgroundColor: '#F5F8FA',
  },
  commentLabel: { color: '#172B3A', fontSize: 10, fontWeight: '700' },
  commentText: { marginTop: 5, color: '#526575', fontSize: 12, lineHeight: 18 },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 18,
    backgroundColor: 'rgba(11,34,57,0.58)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    padding: 20,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  modalCopy: { flex: 1 },
  modalEyebrow: { color: '#B42318', fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
  modalTitle: { marginTop: 4, color: '#0B2239', fontSize: 20, fontWeight: '800' },
  closeButton: { padding: 4 },
  commentHint: { marginTop: 14, color: '#627485', fontSize: 12, lineHeight: 18 },
  commentInput: {
    minHeight: 110,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderRadius: 9,
    color: '#172B3A',
    fontSize: 13,
    backgroundColor: '#FBFDFE',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 9,
    marginTop: 16,
  },
  cancelButton: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderRadius: 8,
  },
  cancelButtonText: { color: '#526575', fontWeight: '700', fontSize: 12 },
  confirmRejectButton: {
    minHeight: 40,
    minWidth: 170,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#B42318',
  },
  confirmRejectText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
});
