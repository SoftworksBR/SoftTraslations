import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { completeFreelancerProfile } from '@/services/employees';

export default function CompletarPerfil() {
  const { employee, refresh } = useAuth();
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!employee) {
    return <Redirect href="/login" />;
  }

  if (employee.status !== 'pending') {
    return <Redirect href="/tradutor/servicos" />;
  }

  async function submitProfile() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate.trim()) || !phone.trim()) {
      Alert.alert('Campos obrigatórios', 'Informe a data de nascimento (AAAA-MM-DD) e o telefone.');
      return;
    }
    const rate = hourlyRate.trim() ? Number(hourlyRate.replace(',', '.')) : null;
    if (rate !== null && (!Number.isFinite(rate) || rate < 0)) {
      Alert.alert('Valor inválido', 'Informe um valor por hora válido.');
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
    <View style={styles.container}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
