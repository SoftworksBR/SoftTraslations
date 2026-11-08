import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { errorMessage, notify } from '@/services/dialog';
import {
  createQuote,
  formatDate,
  formatMoney,
  getQuoteSuggestion,
  parseDateBr,
  getQuote,
  updateQuote,
} from '@/services/quotes';
import type { Quote, QuoteSuggestion } from '@/services/quotes';

export default function NovoOrcamento() {
  const params = useLocalSearchParams<{ requisicaoId?: string; quoteId?: string }>();
  const requestId = Number(params.requisicaoId);
  const quoteId = Number(params.quoteId);
  const editing = Number.isInteger(quoteId) && quoteId > 0;

  const [suggestion, setSuggestion] = useState<QuoteSuggestion | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [value, setValue] = useState('');
  const [deadline, setDeadline] = useState('');
  const [observations, setObservations] = useState('');
  const validId = Number.isInteger(requestId) && requestId > 0;
  const [loading, setLoading] = useState(validId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!validId) return;
    let active = true;
    const load = editing
      ? getQuote(quoteId).then((result) => {
          if (!active) return;
          setQuote(result);
          setValue(result.value.toFixed(2).replace('.', ','));
          setDeadline(formatDate(result.deadline));
          setObservations(result.observations ?? '');
        })
      : getQuoteSuggestion(requestId).then((result) => {
          if (!active) return;
          setSuggestion(result);
          if (result.suggested_value) {
            setValue(result.suggested_value.toFixed(2).replace('.', ','));
          }
        });
    load
      .catch((cause) => notify('Erro', errorMessage(cause)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [editing, quoteId, requestId, validId]);

  async function save() {
    const amount = value.replace(/\./g, '').replace(',', '.').trim();
    const isoDeadline = parseDateBr(deadline);

    if (!(Number(amount) > 0)) {
      notify('Atenção', 'Informe um valor maior que zero.');
      return;
    }
    if (!isoDeadline) {
      notify('Atenção', 'Informe o prazo no formato DD/MM/AAAA.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        value: amount,
        deadline: isoDeadline,
        observations: observations.trim() || null,
      };
      if (editing) {
        await updateQuote(quoteId, payload);
      } else {
        await createQuote({ request_id: requestId, ...payload });
      }
      notify('Sucesso', editing ? 'Orçamento atualizado com sucesso.' : 'Orçamento criado com sucesso.', () =>
        router.replace('/atendente/orcamentos'),
      );
    } catch (cause) {
      notify('Erro', errorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#087F8C" />
      </View>
    );
  }

  if (!validId) {
    return (
      <View style={styles.container}>
        <Text style={styles.description}>Selecione uma solicitação para criar ou atualizar o orçamento.</Text>
        <Pressable style={styles.button} onPress={() => router.replace('/atendente/requisicoes')}>
          <Text style={styles.buttonText}>Ir para requisições</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.scroll}>
      <Text style={styles.title}>{editing ? 'Atualizar orçamento' : 'Novo orçamento'}</Text>
      <Text style={styles.description}>Solicitação #{requestId}</Text>
      {quote ? <Text style={styles.hint}>Orçamento #{quote.id}</Text> : null}
      {suggestion?.suggested_value ? (
        <Text style={styles.hint}>
          Sugestão: {formatMoney(suggestion.suggested_value)}
          {suggestion.word_count ? ` (${suggestion.word_count} palavras` : ''}
          {suggestion.price_per_word
            ? ` × ${formatMoney(suggestion.price_per_word)}/palavra)`
            : suggestion.word_count ? ')' : ''}
        </Text>
      ) : (
        <Text style={styles.hint}>Sem sugestão automática: informe o valor manualmente.</Text>
      )}

      <Text style={styles.label}>Valor (R$) *</Text>
      <TextInput value={value} onChangeText={setValue} keyboardType="decimal-pad" style={styles.input} />
      <Text style={styles.label}>Prazo (DD/MM/AAAA) *</Text>
      <TextInput value={deadline} onChangeText={setDeadline} placeholder="01/12/2026" style={styles.input} />
      <Text style={styles.label}>Observações</Text>
      <TextInput
        value={observations}
        onChangeText={setObservations}
        multiline
        style={[styles.input, { minHeight: 90 }]}
      />

      <Pressable style={[styles.button, saving && { opacity: 0.6 }]} disabled={saving} onPress={() => void save()}>
        <Text style={styles.buttonText}>
          {saving ? 'SALVANDO...' : editing ? 'ATUALIZAR ORÇAMENTO' : 'CRIAR ORÇAMENTO'}
        </Text>
      </Pressable>
      <Pressable onPress={() => router.back()} style={styles.link}>
        <Text style={styles.linkText}>Cancelar</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#F5F8FA' },
  scroll: { flex: 1, backgroundColor: '#F5F8FA' },
  content: { padding: 24, paddingBottom: 40, maxWidth: 640, width: '100%', alignSelf: 'center' },
  title: { color: '#0B2239', fontSize: 26, fontWeight: '800' },
  description: { marginTop: 6, color: '#627485', fontSize: 14 },
  hint: { marginTop: 10, color: '#087F8C', fontSize: 13 },
  label: { marginTop: 16, marginBottom: 6, color: '#172B3A', fontWeight: '600' },
  input: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  button: {
    alignSelf: 'flex-start',
    marginTop: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#087F8C',
  },
  buttonText: { color: '#FFFFFF', fontWeight: '700' },
  link: { marginTop: 14 },
  linkText: { color: '#087F8C', fontWeight: '600' },
});
