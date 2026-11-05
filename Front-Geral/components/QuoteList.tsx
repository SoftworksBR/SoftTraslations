import { Ionicons } from '@expo/vector-icons';
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

import { useAuth } from '@/context/AuthContext';
import { confirmAction, errorMessage, notify } from '@/services/dialog';
import {
  approveQuote,
  formatDate,
  formatMoney,
  listQuotes,
  quoteStatusLabel,
  rejectQuote,
} from '@/services/quotes';
import type { Quote } from '@/services/quotes';

// Tela compartilhada: atendimento decide os orçamentos; projetos os
// consulta e cria projetos a partir dos aprovados.
export function QuoteList({ eyebrow }: { eyebrow: string }) {
  const { employee } = useAuth();
  const isAtendimento = employee?.role === 'atendimento';
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [availableIds, setAvailableIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await listQuotes();
      setQuotes(all);
      if (!isAtendimento) {
        const available = await listQuotes({ available_for_project: true });
        setAvailableIds(new Set(available.map((quote) => quote.id)));
      }
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [isAtendimento]);

  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  async function decide(quote: Quote, action: 'approve' | 'reject') {
    try {
      await (action === 'approve' ? approveQuote(quote.id) : rejectQuote(quote.id));
      await load();
    } catch (cause) {
      notify('Erro', errorMessage(cause));
    }
  }

  function askDecision(quote: Quote, action: 'approve' | 'reject') {
    confirmAction(
      action === 'approve' ? 'Aprovar orçamento' : 'Recusar orçamento',
      action === 'approve'
        ? 'O orçamento ficará disponível para a criação de um projeto.'
        : 'A solicitação também será marcada como recusada.',
      action === 'approve' ? 'Aprovar' : 'Recusar',
      () => void decide(quote, action),
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>Orçamentos</Text>

      {loading ? (
        <ActivityIndicator color="#087F8C" style={{ marginTop: 30 }} />
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>Não foi possível carregar os orçamentos: {error}</Text>
          <Pressable style={styles.button} onPress={() => void load()}>
            <Text style={styles.buttonText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={quotes}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.card}>
              <Ionicons name="wallet-outline" size={26} color="#087F8C" />
              <Text style={styles.cardTitle}>Nenhum orçamento</Text>
              <Text style={styles.muted}>
                {isAtendimento
                  ? 'Abra um orçamento a partir de uma requisição.'
                  : 'Os orçamentos criados pelo atendimento aparecerão aqui.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.client_name}</Text>
              <Text style={styles.muted}>
                {item.service_name ?? 'Serviço não informado'} · {item.source_language_name} →{' '}
                {item.target_language_name}
              </Text>
              <Text style={styles.muted}>
                {formatMoney(item.value)} · prazo {formatDate(item.deadline)}
              </Text>
              {item.observations ? <Text style={styles.muted}>{item.observations}</Text> : null}
              <Text style={styles.status}>{quoteStatusLabel[item.status]}</Text>

              {isAtendimento && item.status === 'in_review' ? (
                <View style={styles.actions}>
                  <Pressable style={styles.button} onPress={() => askDecision(item, 'approve')}>
                    <Text style={styles.buttonText}>APROVAR</Text>
                  </Pressable>
                  <Pressable style={styles.dangerButton} onPress={() => askDecision(item, 'reject')}>
                    <Text style={styles.buttonText}>RECUSAR</Text>
                  </Pressable>
                </View>
              ) : null}

              {!isAtendimento && availableIds.has(item.id) ? (
                <View style={styles.actions}>
                  <Pressable
                    style={styles.button}
                    onPress={() =>
                      router.push(`/gestor/novo-projeto?quoteId=${item.id}` as never)
                    }
                  >
                    <Text style={styles.buttonText}>CRIAR PROJETO</Text>
                  </Pressable>
                </View>
              ) : null}
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
  list: { paddingTop: 18, paddingBottom: 24, gap: 12 },
  center: { alignItems: 'center', marginTop: 30, gap: 12 },
  card: {
    padding: 18,
    gap: 4,
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  cardTitle: { color: '#172B3A', fontSize: 16, fontWeight: '700' },
  muted: { color: '#627485', fontSize: 13, lineHeight: 19 },
  status: { marginTop: 6, color: '#087F8C', fontWeight: '700', fontSize: 12 },
  error: { color: '#B42318', lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  button: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#087F8C' },
  dangerButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#B42318' },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
});
