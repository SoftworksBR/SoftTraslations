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
  const [name, setName] = useState(employee?.username ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!employee) {
    return <Redirect href="/login" />;
  }

  if (employee.status !== 'pending') {
    return <Redirect href="/tradutor/servicos" />;
  }

  async function submitProfile() {
    if (!name.trim()) {
      Alert.alert('Campo obrigatório', 'Informe seu nome.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await completeFreelancerProfile(name.trim());
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
          Informe seu nome para concluir o cadastro da sua conta.
        </Text>
        <Text style={styles.label}>Nome</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          style={styles.input}
        />
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
