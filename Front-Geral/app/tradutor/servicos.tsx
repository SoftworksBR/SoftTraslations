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
  acceptStage,
  declineStage,
  getStages,
  uploadStageFile,
} from '@/services/stages';
import type { TranslationStage } from '@/services/stages';

const stageStatus: Record<TranslationStage['status'], string> = {
  no_freelancer: 'Aguardando aceite',
  public: 'Público',
  ready: 'Pronta',
  in_progress: 'Em andamento',
  testing: 'Em revisão',
  done: 'Concluída',
};

export default function Servicos() {
  const { employee } = useAuth();
  const [activeTab, setActiveTab] = useState<'services' | 'pending'>('services');
  const [stages, setStages] = useState<TranslationStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Record<number, File[]>>({});
  const [uploadingStageId, setUploadingStageId] = useState<number | null>(null);
  const [respondingStageId, setRespondingStageId] = useState<number | null>(null);

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

  async function uploadDocument(stage: TranslationStage) {
    const files = selectedFiles[stage.id] ?? [];
    if (!files.length) {
      notify('Selecione um documento', 'Escolha um documento antes de enviar.');
      return;
    }

    setUploadingStageId(stage.id);
    try {
      for (const file of files) {
        await uploadStageFile(stage.id, file);
      }
      setSelectedFiles((current) => ({ ...current, [stage.id]: [] }));
      await loadStages();
      notify('Sucesso', files.length === 1 ? 'Documento anexado.' : 'Documentos anexados.');
    } catch (cause) {
      notify('Não foi possível anexar', errorMessage(cause));
    } finally {
      setUploadingStageId(null);
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
            activeTab === 'pending'
              ? stage.status === 'no_freelancer'
              : stage.status !== 'no_freelancer',
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
                <Text style={styles.stageName}>{item.name}</Text>
                <View style={[styles.statusPill, activeTab === 'pending' ? styles.pendingPill : styles.completePill]}>
                  <Text style={[styles.stageStatus, activeTab === 'pending' ? styles.pendingText : styles.completeText]}>
                    {activeTab === 'pending'
                      ? 'Aguardando aceite'
                      : item.files.length === 0
                        ? 'Pendente'
                        : stageStatus[item.status]}
                  </Text>
                </View>
              </View>
              {activeTab === 'pending' ? (
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
                  <Text style={styles.documentHint}>
                    {item.files.length
                      ? 'Documento(s) anexado(s):'
                      : 'Anexe o documento desta etapa para atualizar o status.'}
                  </Text>
                  {item.files.map((file) => (
                    <Pressable
                      key={file.id}
                      accessibilityRole="link"
                      onPress={() => void Linking.openURL(`${API_URL}/stages/${item.id}/files/${file.id}`)}
                      style={styles.fileLink}
                    >
                      <Ionicons name="document-outline" size={16} color="#087F8C" />
                      <Text numberOfLines={1} style={styles.fileName}>{file.original_name}</Text>
                      <Ionicons name="download-outline" size={15} color="#627485" />
                    </Pressable>
                  ))}
                  <WebFilePicker
                    files={selectedFiles[item.id] ?? []}
                    onChange={(files) => setSelectedFiles((current) => ({ ...current, [item.id]: files }))}
                  />
                  {Platform.OS === 'web' ? (
                    <Pressable
                      accessibilityRole="button"
                      disabled={uploadingStageId === item.id || !(selectedFiles[item.id]?.length)}
                      onPress={() => void uploadDocument(item)}
                      style={[
                        styles.uploadButton,
                        (uploadingStageId === item.id || !(selectedFiles[item.id]?.length)) && styles.disabled,
                      ]}
                    >
                      {uploadingStageId === item.id
                        ? <ActivityIndicator size="small" color="#FFFFFF" />
                        : <Ionicons name="cloud-upload-outline" size={16} color="#FFFFFF" />}
                      <Text style={styles.buttonText}>
                        {uploadingStageId === item.id ? 'ENVIANDO...' : 'ANEXAR DOCUMENTO'}
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
  pendingText: { marginTop: 0, color: '#A46B12', fontSize: 10, fontWeight: '700' },
  completeText: { marginTop: 0, color: '#20845A', fontSize: 10, fontWeight: '700' },
  documentHint: { marginTop: 10, marginBottom: 8, color: '#627485', fontSize: 11 },
  fileLink: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 6, paddingHorizontal: 9, borderRadius: 7, backgroundColor: '#F5F8FA' },
  fileName: { flex: 1, color: '#087F8C', fontSize: 11 },
  uploadButton: { minHeight: 38, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 5, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#087F8C' },
  disabled: { opacity: 0.55 },
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
