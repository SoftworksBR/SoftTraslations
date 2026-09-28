import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  getRequests,
  type TranslationLanguage,
  type TranslationRequest,
} from '@/services/requests';

const languageLabels: Record<TranslationLanguage, string> = {
  portuguese: 'Português',
  english: 'Inglês',
  spanish: 'Espanhol',
  german: 'Alemão',
  italian: 'Italiano',
  french: 'Francês',
  other: 'Outro',
};

export default function Orcamentos() {
  const [requests, setRequests] = useState<TranslationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      setRequests(await getRequests());
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Falha ao carregar solicitações.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadRequests();
    }, [loadRequests]),
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Solicitações de tradução</Text>
      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(request) => String(request.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.text}>
              {errorMessage || 'Nenhuma solicitação cadastrada.'}
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.request}>
              <Text style={styles.requestName}>{item.username}</Text>
              <Text style={styles.text}>{item.email} · {item.phone}</Text>
              <Text style={styles.text}>
                {languageLabels[item.translate_from]} → {languageLabels[item.translate_to]}
              </Text>
              {item.company ? (
                <Text style={styles.text}>{item.company}</Text>
              ) : null}
              {item.observations ? (
                <Text style={styles.observations}>{item.observations}</Text>
              ) : null}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  list: {
    gap: 12,
  },
  request: {
    padding: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
  },
  requestName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  text: {
    fontSize: 16,
    color: '#666',
  },
  observations: {
    marginTop: 8,
    color: '#333',
  },
});