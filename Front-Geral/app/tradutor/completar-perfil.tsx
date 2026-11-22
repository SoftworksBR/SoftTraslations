import { Redirect, router } from 'expo-router';
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

import {
  MultiLanguageField,
  toggleLanguageId,
  withInactiveLanguages,
} from '@/components/MultiLanguageField';
import type { LanguageOption } from '@/components/MultiLanguageField';
import { LANGUAGES_WARNING } from '@/constants/freelancer-languages';
import { useAuth } from '@/context/AuthContext';
import { completeFreelancerProfile } from '@/services/employees';
import { notify } from '@/services/dialog';
import { getRequestOptions } from '@/services/requests';

export default function CompletarPerfil() {
  const { employee, refresh } = useAuth();
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [sourceIds, setSourceIds] = useState<number[]>([]);
  const [targetIds, setTargetIds] = useState<number[]>([]);
  // null enquanto a lista de idiomas ativos não carregou.
  const [languages, setLanguages] = useState<LanguageOption[] | null>(null);
  const [languagesError, setLanguagesError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRequestOptions()
      .then((options) => setLanguages(
        options.languages.map((language) => ({ label: language.name, value: language.id })),
      ))
      .catch(() => setLanguagesError('Não foi possível carregar os idiomas.'));
  }, []);

  // Idiomas salvos que foram desativados entram como "Idioma desativado" para
  // poderem ser removidos; só depois que a lista de ativos carregou.
  function catalog(selectedIds: number[]) {
    return languages ? withInactiveLanguages(languages, selectedIds) : [];
  }

  if (!employee) {
    return <Redirect href="/login" />;
  }

  if (employee.status !== 'pending') {
    return <Redirect href="/tradutor/servicos" />;
  }

  async function submitProfile() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate.trim()) || !phone.trim()) {
      notify('Campos obrigatórios', 'Informe a data de nascimento (AAAA-MM-DD) e o telefone.');
      return;
    }
    const rate = hourlyRate.trim() ? Number(hourlyRate.replace(',', '.')) : null;
    if (rate !== null && (!Number.isFinite(rate) || rate < 0)) {
      notify('Valor inválido', 'Informe um valor por hora válido.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await completeFreelancerProfile({
        birth_date: birthDate.trim(),
        phone: phone.trim(),
        specialization: specialization.trim() || null,
        bio: bio.trim() || null,
        hourly_rate: rate,
        source_language_ids: sourceIds,
        target_language_ids: targetIds,
      });
      await refresh();
      router.replace('/tradutor/servicos');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível atualizar o perfil.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Completar perfil</Text>
        <Text style={styles.description}>
          Informe seus dados para concluir o cadastro da sua conta.
        </Text>
        <Text style={styles.label}>Data de nascimento (AAAA-MM-DD)</Text>
        <TextInput value={birthDate} onChangeText={setBirthDate} placeholder="1990-01-31" style={styles.input} />
        <Text style={styles.label}>Telefone</Text>
        <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={styles.input} />
        <Text style={styles.label}>Especialização</Text>
        <TextInput value={specialization} onChangeText={setSpecialization} style={styles.input} />
        <Text style={styles.label}>Valor por hora (R$)</Text>
        <TextInput value={hourlyRate} onChangeText={setHourlyRate} keyboardType="decimal-pad" style={styles.input} />
        <Text style={styles.label}>Sobre você</Text>
        <TextInput value={bio} onChangeText={setBio} multiline style={styles.input} />
        <Text style={styles.sectionTitle}>Idiomas</Text>
        <Text style={styles.warning}>{LANGUAGES_WARNING}</Text>
        {languagesError ? <Text style={styles.error}>{languagesError}</Text> : null}
        <View style={styles.languageFields}>
          <View style={styles.languageField}>
            <MultiLanguageField
              label="Idiomas de origem"
              placeholder="Selecione um ou mais idiomas (opcional)"
              options={catalog(sourceIds)}
              value={sourceIds}
              onSelect={(id) => setSourceIds((ids) => toggleLanguageId(ids, id))}
              required={false}
            />
          </View>
          <MultiLanguageField
            label="Idiomas de destino"
            placeholder="Selecione um ou mais idiomas (opcional)"
            options={catalog(targetIds)}
            value={targetIds}
            onSelect={(id) => setTargetIds((ids) => toggleLanguageId(ids, id))}
            required={false}
          />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable
          style={[styles.button, saving && styles.disabled]}
          disabled={saving}
          onPress={() => void submitProfile()}
        >
          {saving ? <ActivityIndicator color="#FFFFFF" /> : (
            <Text style={styles.buttonText}>SALVAR PERFIL</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F8FA' },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F5F8FA',
  },
  form: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    padding: 25,
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  title: { color: '#0B2239', fontSize: 25, fontWeight: '700' },
  description: { marginTop: 9, color: '#627485', lineHeight: 20 },
  label: { marginTop: 20, marginBottom: 6, color: '#172B3A', fontWeight: '600' },
  input: {
    height: 48,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderRadius: 9,
    fontSize: 16,
  },
  error: { marginTop: 12, color: '#B42318', lineHeight: 20 },
  sectionTitle: { marginTop: 26, color: '#172B3A', fontSize: 16, fontWeight: '700' },
  warning: {
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#FFF5E3',
    color: '#8A5A0B',
    fontSize: 12,
    lineHeight: 18,
  },
  languageFields: { gap: 16, marginTop: 14 },
  languageField: { zIndex: 2 },
  button: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    borderRadius: 9,
    backgroundColor: '#087F8C',
  },
  buttonText: { color: '#FFFFFF', fontWeight: '700' },
  disabled: { opacity: 0.65 },
});
