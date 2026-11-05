import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import type { EmployeeRole } from '@/services/employees';

const homeByRole: Record<EmployeeRole, '/drawer' | '/gestor' | '/atendente' | '/tradutor'> = {
  admin: '/drawer',
  projetos: '/gestor',
  atendimento: '/atendente',
  freelancer: '/tradutor',
};

export function RequireRole({
  allowedRoles,
  children,
}: {
  allowedRoles: EmployeeRole[];
  children: ReactNode;
}) {
  const { status, employee, error, refresh } = useAuth();

  if (status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#087F8C" />
        <Text style={styles.message}>Validando sua sessão...</Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Não foi possível validar o acesso</Text>
        <Text style={styles.message}>{error?.message}</Text>
        <Pressable accessibilityRole="button" onPress={() => void refresh()} style={styles.button}>
          <Text style={styles.buttonText}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  if (status !== 'authenticated' || !employee) {
    return <Redirect href="/login" />;
  }

  if (!allowedRoles.includes(employee.role)) {
    return <Redirect href={homeByRole[employee.role] ?? '/landingPage'} />;
  }

  return children;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F5F8FA',
  },
  title: {
    color: '#0B2239',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    marginTop: 12,
    color: '#627485',
    textAlign: 'center',
  },
  button: {
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#087F8C',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});