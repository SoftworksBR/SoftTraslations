import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { getProjects } from '@/services/projects';
import type { Project } from '@/services/projects';

const statusNames: Record<Project['status'], string> = {
  ready: 'Pronto',
  in_progress: 'Em andamento',
  testing: 'Em revisão',
  done: 'Concluído',
};

export default function Projetos() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
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

  useFocusEffect(
    useCallback(() => {
      void loadProjects();
    }, [loadProjects]),
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>GESTÃO DE PROJETOS</Text>
        <Text style={styles.title}>Projetos</Text>
        <Text style={styles.description}>Projetos consultados diretamente na plataforma.</Text>
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
                  {query
                    ? 'Tente buscar usando outro nome ou status.'
                    : 'Não há projetos retornados pelo backend.'}
                </Text>
                {!query ? (
                  <Pressable onPress={() => router.push('/gestor/workflow')} style={styles.button}>
                    <Text style={styles.buttonText}>Configurar workflows</Text>
                  </Pressable>
                ) : null}
              </View>
            }
            renderItem={({ item }) => (
              <View style={[styles.projectCard, !wide && styles.projectCardNarrow]}>
                <View style={styles.projectIdentity}>
                  <View style={styles.projectIcon}>
                    <Ionicons name="folder-outline" size={18} color="#087F8C" />
                  </View>
                  <Text style={styles.projectName}>{item.name}</Text>
                </View>
                <View style={[styles.statusPill, statusPillStyles[item.status]]}>
                  <Text style={[styles.projectStatus, statusTextStyles[item.status]]}>
                    {statusNames[item.status]}
                  </Text>
                </View>
                <Text style={styles.projectDetails}>
                  {item.paths.length} {item.paths.length === 1 ? 'trilha' : 'trilhas'}
                </Text>
              </View>
            )}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F8FA' },
  header: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 18 },
  eyebrow: { color: '#087F8C', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  title: { marginTop: 5, color: '#0B2239', fontSize: 30, fontWeight: '800', letterSpacing: -0.9 },
  description: { marginTop: 7, color: '#627485', fontSize: 13, lineHeight: 20 },
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
  list: { paddingHorizontal: 24, paddingBottom: 24, flexGrow: 1 },
  tableHeader: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: '#F9FBFC',
  },
  tableHeading: { width: 110, color: '#627485', fontSize: 10, fontWeight: '700' },
  projectColumn: { flex: 1 },
  projectCard: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#DFE7EC',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
  },
  projectCardNarrow: {
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderRadius: 10,
    marginBottom: 9,
    paddingHorizontal: 12,
  },
  projectIdentity: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  projectIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: '#E8F6F7',
  },
  projectName: { color: '#172B3A', fontSize: 13, fontWeight: '700' },
  projectStatus: { fontSize: 10, fontWeight: '700' },
  projectDetails: { width: 110, color: '#627485', fontSize: 12 },
  statusPill: { minWidth: 90, alignItems: 'center', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 20 },
  statusPillReady: { backgroundColor: '#E8F5EE' },
  statusPillProgress: { backgroundColor: '#E8F6F7' },
  statusPillReview: { backgroundColor: '#FFF5E3' },
  statusPillDone: { backgroundColor: '#EEF2F4' },
  statusTextReady: { color: '#20845A' },
  statusTextProgress: { color: '#087F8C' },
  statusTextReview: { color: '#A46B12' },
  statusTextDone: { color: '#627485' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { color: '#B42318', textAlign: 'center', lineHeight: 21 },
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
  emptyTitle: { marginTop: 16, color: '#172B3A', fontSize: 15, fontWeight: '700' },
  emptyDescription: { marginTop: 7, color: '#627485', fontSize: 12, textAlign: 'center' },
  button: { marginTop: 18, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, backgroundColor: '#087F8C' },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
});

const statusPillStyles = {
  ready: styles.statusPillReady,
  in_progress: styles.statusPillProgress,
  testing: styles.statusPillReview,
  done: styles.statusPillDone,
};

const statusTextStyles = {
  ready: styles.statusTextReady,
  in_progress: styles.statusTextProgress,
  testing: styles.statusTextReview,
  done: styles.statusTextDone,
};
