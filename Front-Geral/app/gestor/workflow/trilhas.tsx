import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getPaths } from '@/services/paths';
import type { TranslationPath } from '@/services/paths';

export default function Trilhas() {
  const [paths, setPaths] = useState<TranslationPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPaths = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPaths(await getPaths());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao carregar trilhas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void loadPaths();
  }, [loadPaths]));

  return (
    <View style={styles.container}>
      <Pressable style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>← Voltar</Text>
      </Pressable>
      <Text style={styles.title}>Trilhas</Text>
      <Text style={styles.description}>Trilhas carregadas do backend.</Text>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#087F8C" /></View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>Não foi possível carregar as trilhas: {error}</Text>
          <Pressable style={styles.button} onPress={() => void loadPaths()}>
            <Text style={styles.buttonText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={paths}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>Nenhuma trilha cadastrada.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.pathName}>{item.name}</Text>
              {item.stages.map((stage, index) => (
                <View key={stage.id} style={styles.stage}>
                  <Text style={styles.number}>{index + 1}</Text>
                  <Text style={styles.stageName}>{stage.name}</Text>
                </View>
              ))}
            </View>
          )}
        />
      )}

      <Pressable
        style={styles.button}
        onPress={() => router.push('/gestor/workflow/nova-trilha')}
      >
        <Text style={styles.buttonText}>CRIAR TRILHA</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F5F8FA' },
  back: { marginBottom: 14 },
  backText: { color: '#087F8C', fontWeight: '600' },
  title: { color: '#0B2239', fontSize: 28, fontWeight: '800' },
  description: { marginTop: 7, marginBottom: 18, color: '#627485' },
  list: { gap: 12, flexGrow: 1, paddingBottom: 18 },
  card: { padding: 18, borderWidth: 1, borderColor: '#DFE7EC', borderRadius: 12, backgroundColor: '#FFFFFF' },
  pathName: { marginBottom: 14, color: '#172B3A', fontSize: 18, fontWeight: '700' },
  stage: { flexDirection: 'row', alignItems: 'center', marginBottom: 9 },
  number: {
    width: 26,
    height: 26,
    paddingTop: 4,
    marginRight: 10,
    borderRadius: 13,
    backgroundColor: '#087F8C',
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '700',
  },
  stageName: { color: '#627485' },
  empty: { padding: 24, color: '#627485', textAlign: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { color: '#B42318', textAlign: 'center', lineHeight: 21 },
  button: {
    alignSelf: 'flex-start',
    marginTop: 12,
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#087F8C',
  },
  buttonText: { color: '#FFFFFF', fontWeight: '700' },
});
