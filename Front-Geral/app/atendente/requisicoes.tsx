import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { API_URL } from '@/services/api';
import { deleteRequest, getRequestFiles, getRequests } from '@/services/requests';
import type { RequestFile, TranslationRequest } from '@/services/requests';

function RequestFiles({ requestId }: { requestId: number }) {
  const [files, setFiles] = useState<RequestFile[]>([]);

  useEffect(() => {
    getRequestFiles(requestId).then(setFiles).catch(() => setFiles([]));
  }, [requestId]);

  return (
    <>
      {files.map((file) => (
        <Pressable
          key={file.id}
          onPress={() =>
            void Linking.openURL(
              `${API_URL}/requests/${requestId}/files/${file.id}`,
            )
          }
        >
          <Text style={{ color: '#087F8C', marginTop: 4 }}>
            📎 {file.original_name}
          </Text>
        </Pressable>
      ))}
    </>
  );
}

export default function Requisicoes() {
  const [requests, setRequests] = useState<TranslationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const filteredRequests = requests.filter((request) => {
    const searchable = [
      request.username,
      request.email,
      request.company ?? '',
      request.source_language_name,
      request.target_language_name,
    ].join(' ').toLocaleLowerCase();
    return searchable.includes(query.trim().toLocaleLowerCase());
  });

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRequests(await getRequests());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao carregar solicitações.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadRequests();
    }, [loadRequests]),
  );

  function confirmDelete(request: TranslationRequest) {
    Alert.alert('Excluir solicitação', 'Tem certeza que deseja excluir esta solicitação?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRequest(request.id);
            await loadRequests();
          } catch (cause) {
            Alert.alert(
              'Não foi possível excluir',
              cause instanceof Error ? cause.message : 'Ocorreu um erro inesperado.',
            );
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>EQUIPE DE ATENDIMENTO</Text>
        <Text style={styles.title}>Requisições</Text>
        <Text style={styles.description}>
          Solicitações carregadas diretamente do sistema.
        </Text>
      </View>

      <View style={styles.search}>
        <Ionicons name="search-outline" size={18} color="#627485" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por nome, e-mail ou empresa"
          placeholderTextColor="#98A7B1"
          accessibilityLabel="Buscar requisições"
          style={styles.searchInput}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#087F8C" />
          <Text style={styles.message}>Carregando solicitações...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>Não foi possível carregar as solicitações: {error}</Text>
          <Pressable style={styles.button} onPress={() => void loadRequests()}>
            <Text style={styles.buttonText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>
                {query ? 'Nenhuma requisição encontrada' : 'Nenhuma requisição recebida'}
              </Text>
              <Text style={styles.emptyDescription}>
                {query
                  ? 'Tente pesquisar por outro nome, endereço de e-mail ou empresa.'
                  : 'As solicitações enviadas pelo formulário público aparecerão aqui.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardCopy}>
                <Text style={styles.name}>{item.username}</Text>
                <Text style={styles.service}>{item.email} · {item.phone}</Text>
                <Text style={styles.service}>
                  {item.source_language_name} → {item.target_language_name}
                </Text>
                {item.company ? <Text style={styles.service}>{item.company}</Text> : null}
                {item.observations ? (
                  <Text style={styles.observations}>{item.observations}</Text>
                ) : null}
                <RequestFiles requestId={item.id} />
                <Text style={styles.id}>ID: {item.id}</Text>
                <Pressable
                  style={styles.quoteButton}
                  onPress={() => router.push({
                    pathname: '/atendente/novo-orcamento',
                    params: { requisicaoId: String(item.id) },
                  })}
                >
                  <Text style={styles.buttonText}>ABRIR ORÇAMENTO</Text>
                </Pressable>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Excluir solicitação ${item.id}`}
                style={styles.delete}
                onPress={() => confirmDelete(item)}
              >
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
  container: { flex: 1, backgroundColor: '#F5F8FA' },
  header: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 17 },
  eyebrow: { color: '#087F8C', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  title: { marginTop: 5, color: '#0B2239', fontSize: 28, fontWeight: '800' },
  description: { marginTop: 6, color: '#627485', fontSize: 13 },
  search: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginHorizontal: 24,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
  },
  searchInput: { flex: 1, minHeight: 42, color: '#172B3A', fontSize: 13 },
  list: { paddingHorizontal: 24, paddingBottom: 24, gap: 10, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  cardCopy: { flex: 1, padding: 18 },
  name: { color: '#172B3A', fontSize: 14, fontWeight: '700' },
  service: { marginTop: 6, color: '#627485', fontSize: 13 },
  observations: { marginTop: 10, color: '#172B3A', fontSize: 13, lineHeight: 20 },
  id: { marginTop: 10, color: '#627485', fontSize: 12 },
  quoteButton: {
    alignSelf: 'flex-start',
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#087F8C',
  },
  delete: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#DFE7EC',
  },
  deleteText: { color: '#B42318', fontSize: 28 },
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
  emptyTitle: { color: '#172B3A', fontSize: 15, fontWeight: '700', textAlign: 'center' },
  emptyDescription: { marginTop: 6, color: '#627485', fontSize: 12, lineHeight: 18, textAlign: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  message: { padding: 24, color: '#627485', textAlign: 'center' },
  error: { color: '#B42318', textAlign: 'center', lineHeight: 21 },
  button: { marginTop: 16, padding: 12, borderRadius: 8, backgroundColor: '#087F8C' },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
});
