import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { RequireRole } from '@/components/RequireRole';
import {
  createEmployee,
  getEmployees,
  updateEmployee,
} from '@/services/employees';
import type { Employee, EmployeeRole } from '@/services/employees';

const roleLabels: Record<EmployeeRole, string> = {
  admin: 'Administrador',
  projetos: 'Gestor',
  atendimento: 'Atendente',
  freelancer: 'Tradutor',
};

function EmployeeForm() {
  const params = useLocalSearchParams<{ id?: string; tipo?: string }>();
  const role = params.tipo as EmployeeRole;
  const employeeId = params.id ? Number(params.id) : null;
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(!!employeeId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!employeeId || !roleLabels[role]) {
      return;
    }
    let active = true;
    getEmployees(role)
      .then(({ employees }) => {
        const found = employees.find((item) => item.id === employeeId);
        if (!found) {
          throw new Error('Funcionário não encontrado.');
        }
        if (active) {
          setEmployee(found);
          setUsername(found.username);
          setFirstName(found.first_name ?? '');
          setLastName(found.last_name ?? '');
          setEmail(found.email);
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : 'Falha ao carregar funcionário.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [employeeId, role]);

  async function save() {
    if (!roleLabels[role]) {
      setError('Tipo de funcionário inválido.');
      return;
    }
    if (!username.trim() || !email.trim() || !password) {
      Alert.alert('Campos obrigatórios', 'Preencha nome, e-mail e senha.');
      return;
    }
    if (role !== 'admin' && (!firstName.trim() || !lastName.trim())) {
      Alert.alert('Campos obrigatórios', 'Preencha nome e sobrenome.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        username: username.trim(),
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        email: email.trim(),
        role,
        status: employee?.status ?? 'available' as const,
        password,
      };
      if (employeeId) {
        await updateEmployee(employeeId, payload);
      } else {
        await createEmployee(payload);
      }
      router.back();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar o funcionário.');
    } finally {
      setSaving(false);
    }
  }

  if (!roleLabels[role]) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Tipo de funcionário inválido.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#087F8C" />
      </View>
    );
  }

  return (
    <RequireRole allowedRoles={['admin']}>
      <View style={styles.container}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {employeeId ? `Editar ${roleLabels[role]}` : `Novo ${roleLabels[role]}`}
            </Text>
            <Pressable accessibilityRole="button" onPress={() => router.back()}>
              <Text style={styles.close}>×</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.form}>
            <Text style={styles.label}>Nome de usuário</Text>
            <TextInput value={username} onChangeText={setUsername} style={styles.input} />
            <Text style={styles.label}>Nome</Text>
            <TextInput value={firstName} onChangeText={setFirstName} style={styles.input} />
            <Text style={styles.label}>Sobrenome</Text>
            <TextInput value={lastName} onChangeText={setLastName} style={styles.input} />
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
            <Text style={styles.label}>
              {employeeId ? 'Nova senha' : 'Senha'}
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={() => void save()}
              style={[styles.button, saving && styles.disabled]}
            >
              <Text style={styles.buttonText}>{saving ? 'Salvando...' : 'Salvar'}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </RequireRole>
  );
}

export default function Modal() {
  return (
    <RequireRole allowedRoles={['admin']}>
      <EmployeeForm />
    </RequireRole>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(11, 34, 57, 0.62)',
  },
  modal: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '90%',
    alignSelf: 'center',
    padding: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { color: '#0B2239', fontSize: 22, fontWeight: '700' },
  close: { color: '#627485', fontSize: 28 },
  form: { paddingTop: 14 },
  label: { marginTop: 12, marginBottom: 6, color: '#172B3A', fontWeight: '600' },
  input: {
    minHeight: 46,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderRadius: 8,
    color: '#172B3A',
  },
  error: { marginTop: 12, color: '#B42318', lineHeight: 20 },
  button: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    borderRadius: 8,
    backgroundColor: '#087F8C',
  },
  buttonText: { color: '#FFFFFF', fontWeight: '700' },
  disabled: { opacity: 0.6 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
});
