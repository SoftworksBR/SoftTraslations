import { Ionicons } from '@expo/vector-icons';
import { Redirect, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  FlatList,
} from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { getStages } from '@/services/stages';
import type { TranslationStage } from '@/services/stages';

const stageStatus: Record<TranslationStage['status'], string> = {
  ready: 'Pronta',
  in_progress: 'Em andamento',
  testing: 'Em revisão',
  done: 'Concluída',
};

export default function Servicos() {
  const { employee } = useAuth();
  const [stages, setStages] = useState<TranslationStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStages(await getStages());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao carregar serviços.');
    } finally {
      setLoading(false);
    }
  }, []);

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
      <Text style={styles.title}>Serviços disponíveis</Text>
      <Text style={styles.description}>
        Serviços carregados da sua conta na plataforma.
      </Text>

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
          data={stages}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <View style={styles.icon}>
                <Ionicons name="language-outline" size={26} color="#087F8C" />
              </View>
              <Text style={styles.emptyTitle}>Nenhum serviço atribuído</Text>
              <Text style={styles.description}>
                Não há serviços associados à sua conta neste momento.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.stageCard}>
              <Text style={styles.stageName}>{item.name}</Text>
              <Text style={styles.stageStatus}>{stageStatus[item.status]}</Text>
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
  stageName: { color: '#172B3A', fontSize: 16, fontWeight: '700' },
  stageStatus: { marginTop: 6, color: '#627485', fontSize: 13 },
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
