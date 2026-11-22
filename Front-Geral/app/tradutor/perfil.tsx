import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  MultiLanguageField,
  toggleLanguageId,
  withInactiveLanguages,
} from '@/components/MultiLanguageField';
import type { LanguageOption } from '@/components/MultiLanguageField';
import { LANGUAGES_WARNING } from '@/constants/freelancer-languages';
import { useAuth } from '@/context/AuthContext';
import { updateMyLanguages } from '@/services/employees';
import { getRequestOptions } from '@/services/requests';

const statusLabels = {
  available: 'Disponível',
  busy: 'Ocupado',
  pending: 'Pendente',
} as const;

export default function MeuPerfil() {
  const { employee, replaceEmployee } = useAuth();
  // null enquanto a lista de idiomas ativos não carregou.
  const [languages, setLanguages] = useState<LanguageOption[] | null>(null);
  const [sourceIds, setSourceIds] = useState<number[]>(employee?.source_language_ids ?? []);
  const [targetIds, setTargetIds] = useState<number[]>(employee?.target_language_ids ?? []);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );

  useEffect(() => {
    getRequestOptions()
      .then((options) => setLanguages(
        options.languages.map((language) => ({ label: language.name, value: language.id })),
      ))
      .catch(() => setMessage({ type: 'error', text: 'Não foi possível carregar os idiomas.' }));
  }, []);

  async function saveLanguages() {
    setSaving(true);
    setMessage(null);
    try {
      const updated = await updateMyLanguages({
        source_language_ids: sourceIds,
        target_language_ids: targetIds,
      });
      replaceEmployee(updated);
      setSourceIds(updated.source_language_ids ?? []);
      setTargetIds(updated.target_language_ids ?? []);
      setMessage({ type: 'success', text: 'Idiomas atualizados.' });
    } catch (cause) {
      setMessage({
        type: 'error',
        text: cause instanceof Error ? cause.message : 'Não foi possível salvar os idiomas.',
      });
    } finally {
      setSaving(false);
    }
  }

  // Idiomas salvos que foram desativados entram como "Idioma desativado" para
  // poderem ser removidos; só depois que a lista de ativos carregou.
  function catalog(selectedIds: number[]) {
    return languages ? withInactiveLanguages(languages, selectedIds) : [];
  }

  function languageNames(ids?: number[]) {
    const options = catalog(ids ?? []);
    const names = (ids ?? [])
      .map((id) => options.find((language) => language.value === id)?.label)
      .filter(Boolean);
    return names.length ? names.join(', ') : undefined;
  }

  if (!employee) {
    return <Redirect href="/login" />;
  }
  if (employee.status === 'pending') {
    return <Redirect href="/tradutor/completar-perfil" />;
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>MEU CADASTRO</Text>
        <Text style={styles.title}>Meu perfil</Text>
        <Text style={styles.description}>
          Consulte as informações associadas à sua conta de tradutor.
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.icon}>
            <Ionicons name="person-outline" size={20} color="#087F8C" />
          </View>
          <View style={styles.cardHeaderCopy}>
            <Text style={styles.cardTitle}>Dados do perfil</Text>
            <Text style={styles.cardDescription}>
              Informações recebidas do cadastro da plataforma.
            </Text>
          </View>
        </View>

        <View style={styles.fields}>
          <ProfileValue label="Nome" value={employee?.username} />
          <ProfileValue label="E-mail" value={employee?.email} />
          <ProfileValue label="Perfil" value="Freelancer" />
          <ProfileValue
            label="Situação"
            value={employee ? statusLabels[employee.status] : undefined}
          />
          <ProfileValue
            label="Idiomas de origem"
            value={languageNames(employee.source_language_ids)}
          />
          <ProfileValue
            label="Idiomas de destino"
            value={languageNames(employee.target_language_ids)}
          />
        </View>

        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={18} color="#397BC5" />
          <Text style={styles.noteText}>
            O cadastro atual não armazena telefone ou CPF e não oferece edição dos dados
            do perfil para contas já concluídas; apenas os idiomas podem ser alterados.
            Por isso, esses dados não são solicitados nem apresentados como se fossem
            persistidos.
          </Text>
        </View>

        <View style={styles.languages}>
          <Text style={styles.cardTitle}>Editar idiomas</Text>
          <Text style={styles.warning}>{LANGUAGES_WARNING}</Text>
          <View style={styles.languageFields}>
            <View style={styles.languageField}>
              <MultiLanguageField
                label="Idiomas de origem"
                placeholder="Selecione um ou mais idiomas"
                options={catalog(sourceIds)}
                value={sourceIds}
                onSelect={(id) => setSourceIds((ids) => toggleLanguageId(ids, id))}
                required={false}
                disabled={saving}
              />
            </View>
            <MultiLanguageField
              label="Idiomas de destino"
              placeholder="Selecione um ou mais idiomas"
              options={catalog(targetIds)}
              value={targetIds}
              onSelect={(id) => setTargetIds((ids) => toggleLanguageId(ids, id))}
              required={false}
              disabled={saving}
            />
          </View>
          {message ? (
            <Text
              accessibilityRole={message.type === 'error' ? 'alert' : undefined}
              accessibilityLiveRegion="polite"
              style={message.type === 'error' ? styles.errorText : styles.successText}
            >
              {message.text}
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Salvar idiomas"
            aria-disabled={saving}
            aria-busy={saving}
            disabled={saving}
            onPress={() => void saveLanguages()}
            style={[styles.saveButton, saving && styles.disabled]}
          >
            {saving ? <ActivityIndicator color="#FFFFFF" /> : (
              <Text style={styles.primaryButtonText}>Salvar idiomas</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/tradutor/servicos')}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Voltar para serviços</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

function ProfileValue({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueBox}>
        <Text style={[styles.value, !value && styles.placeholder]}>{value ?? 'Não informado'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 32, backgroundColor: '#F5F8FA' },
  header: { paddingTop: 28, paddingBottom: 20 },
  eyebrow: { color: '#087F8C', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  title: { marginTop: 5, color: '#0B2239', fontSize: 30, fontWeight: '800', letterSpacing: -0.9 },
  description: { marginTop: 6, color: '#627485', fontSize: 13, lineHeight: 20 },
  card: {
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
    padding: 22,
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  icon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#E8F6F7' },
  cardHeaderCopy: { flex: 1 },
  cardTitle: { color: '#172B3A', fontSize: 14, fontWeight: '700' },
  cardDescription: { marginTop: 4, color: '#627485', fontSize: 11 },
  fields: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 22 },
  field: { flexGrow: 1, flexBasis: '45%', minWidth: 210 },
  label: { marginBottom: 6, color: '#172B3A', fontSize: 11, fontWeight: '700' },
  valueBox: { minHeight: 42, justifyContent: 'center', paddingHorizontal: 11, borderWidth: 1, borderColor: '#DFE7EC', borderRadius: 8, backgroundColor: '#F9FBFC' },
  value: { color: '#415462', fontSize: 12 },
  placeholder: { color: '#98A7B1' },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginTop: 20, padding: 13, borderRadius: 9, backgroundColor: '#EEF6FC' },
  noteText: { flex: 1, color: '#527582', fontSize: 10, lineHeight: 16 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20, paddingTop: 17, borderTopWidth: 1, borderTopColor: '#EDF1F3' },
  primaryButton: { minHeight: 40, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 15, borderRadius: 8, backgroundColor: '#087F8C' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  // zIndex: a lista aberta do seletor precisa ficar acima dos botões seguintes.
  languages: { zIndex: 1, marginTop: 22, paddingTop: 18, borderTopWidth: 1, borderTopColor: '#EDF1F3' },
  warning: {
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#FFF5E3',
    color: '#8A5A0B',
    fontSize: 11,
    lineHeight: 17,
  },
  languageFields: { zIndex: 1, gap: 16, marginTop: 14 },
  languageField: { zIndex: 2 },
  successText: { marginTop: 12, color: '#20845A', fontSize: 11, fontWeight: '600' },
  errorText: { marginTop: 12, color: '#B42318', fontSize: 11, lineHeight: 16 },
  saveButton: {
    minHeight: 40,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#087F8C',
  },
  disabled: { opacity: 0.65 },
});
