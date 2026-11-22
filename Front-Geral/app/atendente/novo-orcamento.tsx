import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { createElement, useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { API_URL } from '@/services/api';
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
import { getRequestFiles, uploadRequestFileAsEmployee } from '@/services/requests';
import type { RequestFile } from '@/services/requests';

const RESEND_EMAIL_WARNING =
  'Se este orçamento já foi enviado por e-mail ao cliente, reenvie o e-mail depois '
  + 'de salvar as alterações.';
const ACCEPTED_FILES = '.pdf,.doc,.docx,.odt,.txt,.rtf,.xls,.xlsx,.png,.jpg,.jpeg';

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
      notify(
        'Sucesso',
        editing
          ? `Orçamento atualizado com sucesso. ${RESEND_EMAIL_WARNING}`
          : 'Orçamento criado com sucesso.',
        () => router.replace('/atendente/orcamentos'),
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
      {editing ? (
        <View style={styles.warning}>
          <Ionicons name="mail-outline" size={18} color="#8A5A0B" />
          <Text style={styles.warningText}>{RESEND_EMAIL_WARNING}</Text>
        </View>
      ) : null}
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

      {editing ? <RequestDocuments requestId={requestId} /> : null}
    </ScrollView>
  );
}

function RequestDocuments({ requestId }: { requestId: number }) {
  const [files, setFiles] = useState<RequestFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setFiles(await getRequestFiles(requestId));
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  // Primeiro carregamento: o estado inicial já é loading=true e error=null.
  useEffect(() => {
    let active = true;
    getRequestFiles(requestId)
      .then((result) => {
        if (active) setFiles(result);
      })
      .catch((cause) => {
        if (active) setError(errorMessage(cause));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [requestId]);

  async function upload(file: File) {
    setUploading(true);
    try {
      await uploadRequestFileAsEmployee(requestId, file);
      await loadFiles();
    } catch (cause) {
      notify('Erro', errorMessage(cause));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <View style={styles.documents}>
      <Text style={styles.sectionTitle}>Documentos da solicitação</Text>
      <Text style={styles.sectionHint}>
        O documento é anexado na hora, sem precisar salvar o orçamento.
      </Text>
      {loading ? (
        <ActivityIndicator color="#087F8C" style={styles.documentsLoading} />
      ) : error ? (
        <Text accessibilityRole="alert" style={styles.errorText}>
          Não foi possível carregar os documentos: {error}
        </Text>
      ) : files.length === 0 ? (
        <Text style={styles.emptyText}>Nenhum documento anexado.</Text>
      ) : (
        files.map((file) => (
          <Pressable
            key={file.id}
            accessibilityRole="link"
            accessibilityLabel={`Baixar ${file.original_name}`}
            onPress={() =>
              void Linking.openURL(`${API_URL}/requests/${requestId}/files/${file.id}`)
            }
            style={styles.fileRow}
          >
            <Ionicons name="document-outline" size={16} color="#087F8C" />
            <Text style={styles.fileName} numberOfLines={1}>
              {file.original_name}
            </Text>
            <Ionicons name="download-outline" size={15} color="#627485" />
          </Pressable>
        ))
      )}
      {Platform.OS === 'web' ? (
        <>
          {createElement('input', {
            ref: inputRef,
            type: 'file',
            accept: ACCEPTED_FILES,
            style: { display: 'none' },
            onChange: (event: { target: { files: FileList | null } }) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
            },
          })}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Anexar documento à solicitação"
            aria-disabled={uploading}
            aria-busy={uploading}
            disabled={uploading}
            onPress={() => inputRef.current?.click()}
            style={[styles.attachButton, uploading && { opacity: 0.6 }]}
          >
            {uploading ? (
              <ActivityIndicator color="#087F8C" />
            ) : (
              <Ionicons name="attach-outline" size={16} color="#087F8C" />
            )}
            <Text style={styles.attachText}>
              {uploading ? 'Enviando...' : 'Anexar documento'}
            </Text>
          </Pressable>
        </>
      ) : (
        <Text style={styles.emptyText}>
          O envio de anexos está disponível na versão web.
        </Text>
      )}
    </View>
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
  warning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 14,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FFF5E3',
  },
  warningText: { flex: 1, color: '#8A5A0B', fontSize: 13, lineHeight: 19 },
  documents: {
    marginTop: 26,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: { color: '#172B3A', fontSize: 15, fontWeight: '700' },
  sectionHint: { marginTop: 4, marginBottom: 10, color: '#627485', fontSize: 12 },
  documentsLoading: { alignSelf: 'flex-start', marginVertical: 8 },
  errorText: { color: '#B42318', fontSize: 13, lineHeight: 19 },
  emptyText: { color: '#627485', fontSize: 13 },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF1F3',
  },
  fileName: { flex: 1, minWidth: 0, color: '#087F8C', fontSize: 13 },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#087F8C',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  attachText: { color: '#087F8C', fontWeight: '700' },
});
