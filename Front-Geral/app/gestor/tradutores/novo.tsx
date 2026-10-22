import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { preRegisterFreelancer } from '@/services/employees';

export default function NovoTradutor() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      Alert.alert('Campos obrigatórios', 'Informe nome, sobrenome, e-mail e senha.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await preRegisterFreelancer({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        password,
      });
      router.back();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível pré-cadastrar o tradutor.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Pré-cadastro de tradutor</Text>
        <ScrollView>
          <Text style={styles.description}>
            As credenciais serão cadastradas no sistema. Nenhum usuário local de demonstração será criado.
          </Text>
          <Text style={styles.label}>Nome</Text>
          <TextInput value={firstName} onChangeText={setFirstName} autoCapitalize="words" style={styles.input} />
          <Text style={styles.label}>Sobrenome</Text>
          <TextInput value={lastName} onChangeText={setLastName} autoCapitalize="words" style={styles.input} />
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
          <Text style={styles.label}>Senha inicial</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable
            style={[styles.button, saving && styles.disabled]}
            disabled={saving}
            onPress={() => void save()}
          >
            <Text style={styles.buttonText}>{saving ? 'ENVIANDO...' : 'PRÉ-CADASTRAR'}</Text>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#F5F8FA' },
  form: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '90%',
    alignSelf: 'center',
    padding: 25,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  title: { color: '#0B2239', fontSize: 22, fontWeight: '700' },
  description: { marginTop: 10, color: '#627485', lineHeight: 20 },
  label: { marginTop: 16, marginBottom: 6, color: '#172B3A', fontWeight: '600' },
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
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
    borderRadius: 9,
    backgroundColor: '#087F8C',
  },
  buttonText: { color: '#FFFFFF', fontWeight: '700' },
  disabled: { opacity: 0.6 },
});
