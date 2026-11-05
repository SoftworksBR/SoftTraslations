import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
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

const statusLabels: Record<Employee['status'], string> = {
  pending: 'Pendente',
  available: 'Disponível',
  busy: 'Ocupado',
};

const statusColors: Record<Employee['status'], { background: string; text: string }> = {
  pending: { background: '#FFF5E3', text: '#A46B12' },
  available: { background: '#E8F5EE', text: '#20845A' },
  busy: { background: '#F3EFFB', text: '#7357A8' },
};

const statusOptions: FilterOption<Employee['status'] | 'all'>[] = [
  { label: 'Todas as situações', value: 'all' },
  { label: 'Disponível', value: 'available' },
  { label: 'Ocupado', value: 'busy' },
  { label: 'Pendente', value: 'pending' },
];

export default function Tradutores() {
  const [translators, setTranslators] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Employee['status'] | 'all'>('all');
  const [draftStatusFilter, setDraftStatusFilter] = useState<Employee['status'] | 'all'>('all');
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [selectedTranslator, setSelectedTranslator] = useState<Employee | null>(null);
  const { width } = useWindowDimensions();
  const columns = width >= 1200 ? 3 : width >= 760 ? 2 : 1;
  const visibleTranslators = translators.filter((translator) => {
    const search = query.trim().toLocaleLowerCase();
    return (statusFilter === 'all' || translator.status === statusFilter) &&
      (!search ||
        translator.username.toLocaleLowerCase().includes(search) ||
        translator.email.toLocaleLowerCase().includes(search));
  });

  const loadTranslators = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getEmployees('freelancer');
      setTranslators(result.employees);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao carregar tradutores.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadTranslators();
    }, [loadTranslators]),
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, width < 720 && styles.headerNarrow]}>
        <View style={styles.headingCopy}>
          <Text style={styles.eyebrow}>GESTÃO DE PROJETOS</Text>
          <Text style={styles.title}>Tradutores</Text>
          <Text style={styles.description}>
            Consulte profissionais freelancers e suas situações.
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/gestor/tradutores/novo')}
          style={styles.primaryButton}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Pré-cadastrar tradutor</Text>
        </Pressable>
      </View>

      <View style={[styles.listTools, width < 720 && styles.listToolsNarrow]}>
        <View style={styles.search}>
          <Ionicons name="search-outline" size={18} color="#627485" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar por nome ou e-mail"
            placeholderTextColor="#98A7B1"
            accessibilityLabel="Buscar tradutores por nome ou e-mail"
            style={styles.searchInput}
          />
        </View>
        <FilterPanel
          onOpen={() => {
            setDraftStatusFilter(statusFilter);
            setFilterExpanded(false);
          }}
          onClear={() => {
            setDraftStatusFilter('all');
            setStatusFilter('all');
            setFilterExpanded(false);
          }}
          onApply={() => {
            setStatusFilter(draftStatusFilter);
            setFilterExpanded(false);
          }}
        >
          <FilterSelect
            label="Situação"
            value={draftStatusFilter}
            options={statusOptions}
            open={filterExpanded}
            onToggle={() => setFilterExpanded((current) => !current)}
            onSelect={(value) => {
              setDraftStatusFilter(value);
              setFilterExpanded(false);
            }}
          />
        </FilterPanel>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#087F8C" />
          <Text style={styles.helper}>Carregando tradutores...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>
            Não foi possível carregar os tradutores: {error}
          </Text>
          <Pressable style={styles.primaryButton} onPress={() => void loadTranslators()}>
            <Text style={styles.primaryButtonText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          key={columns}
          data={visibleTranslators}
          numColumns={columns}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={columns > 1 ? styles.cardRow : undefined}
          ListEmptyComponent={(
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="people-outline" size={24} color="#087F8C" />
              </View>
              <Text style={styles.emptyTitle}>Nenhum tradutor encontrado</Text>
              <Text style={styles.helper}>
                {query || statusFilter !== 'all'
                  ? 'Ajuste a busca ou limpe os filtros para ver outros tradutores.'
                  : 'Os tradutores cadastrados aparecerão aqui.'}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.username.trim().slice(0, 1).toLocaleUpperCase()}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusColors[item.status].background },
                  ]}
                >
                  <Text style={[styles.statusText, { color: statusColors[item.status].text }]}>
                    {statusLabels[item.status]}
                  </Text>
                </View>
              </View>
              <Text numberOfLines={1} style={styles.name}>{item.username}</Text>
              <Text numberOfLines={1} style={styles.email}>{item.email}</Text>
              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>Perfil</Text>
                <Text style={styles.profileValue}>Freelancer</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => setSelectedTranslator(item)}
                style={styles.detailsButton}
              >
                <Text style={styles.detailsButtonText}>Ver detalhes</Text>
              </Pressable>
            </View>
          )}
        />
      )}

      <Modal
        visible={selectedTranslator !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedTranslator(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.detailsModal}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fechar detalhes"
              onPress={() => setSelectedTranslator(null)}
              style={styles.modalClose}
            >
              <Ionicons name="close" size={21} color="#627485" />
            </Pressable>
            <Text style={styles.modalEyebrow}>PERFIL DO TRADUTOR</Text>
            <Text style={styles.modalTitle}>{selectedTranslator?.username}</Text>
            <Text style={styles.modalDescription}>{selectedTranslator?.email}</Text>
            {selectedTranslator ? (
              <View style={styles.modalDetailRow}>
                <Text style={styles.profileLabel}>Situação</Text>
                <Text style={styles.profileValue}>{statusLabels[selectedTranslator.status]}</Text>
              </View>
            ) : null}
            <Pressable
              onPress={() => setSelectedTranslator(null)}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F8FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 20,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 18,
  },
  headerNarrow: { flexDirection: 'column', alignItems: 'stretch', gap: 14 },
  headingCopy: { flex: 1 },
  eyebrow: { color: '#087F8C', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  title: { marginTop: 5, color: '#0B2239', fontSize: 30, fontWeight: '800', letterSpacing: -0.9 },
  description: { marginTop: 6, color: '#627485', fontSize: 13 },
  listTools: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginHorizontal: 24,
    marginBottom: 16,
  },
  listToolsNarrow: { flexDirection: 'column' },
  search: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
  },
  searchInput: { flex: 1, minHeight: 42, color: '#172B3A', fontSize: 13 },
  grid: { paddingHorizontal: 24, paddingBottom: 24, gap: 14, flexGrow: 1 },
  cardRow: { gap: 14, alignItems: 'stretch' },
  card: {
    flex: 1,
    minWidth: 0,
    padding: 18,
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatar: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#E8F6F7',
  },
  avatarText: { color: '#087F8C', fontSize: 15, fontWeight: '800' },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: '700' },
  name: { marginTop: 16, color: '#172B3A', fontSize: 15, fontWeight: '700' },
  email: { marginTop: 5, color: '#627485', fontSize: 11 },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EDF1F3',
  },
  profileLabel: { color: '#627485', fontSize: 11 },
  profileValue: { color: '#172B3A', fontSize: 11, fontWeight: '600' },
  detailsButton: {
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderRadius: 8,
  },
  detailsButtonText: { color: '#172B3A', fontSize: 11, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  helper: { color: '#627485', fontSize: 12, lineHeight: 19, textAlign: 'center' },
  error: { color: '#B42318', textAlign: 'center', lineHeight: 21 },
  primaryButton: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 16,
    borderRadius: 9,
    backgroundColor: '#087F8C',
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  emptyCard: {
    alignItems: 'center',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 520,
    marginTop: 28,
    padding: 26,
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  emptyIcon: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    backgroundColor: '#E8F6F7',
  },
  emptyTitle: { marginTop: 14, marginBottom: 5, color: '#172B3A', fontSize: 15, fontWeight: '700' },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(6,22,36,0.62)' },
  detailsModal: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    padding: 24,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  modalClose: { position: 'absolute', top: 12, right: 12, padding: 5 },
  modalEyebrow: { color: '#087F8C', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  modalTitle: { marginTop: 8, color: '#172B3A', fontSize: 20, fontWeight: '800' },
  modalDescription: { marginTop: 6, marginBottom: 18, color: '#627485', fontSize: 12 },
  modalDetailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#EDF1F3' },
});
