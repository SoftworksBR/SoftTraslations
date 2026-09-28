import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
} from 'react-native';

import { getCurrentEmployee } from '@/services/auth';
import type { Employee } from '@/services/employees';

export default function Servicos() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getCurrentEmployee()
      .then(setEmployee)
      .catch(() => setEmployee(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <ActivityIndicator style={styles.loading} />;
  }

  if (!employee || employee.role !== 'freelancer') {
    return <Redirect href="/" />;
  }

  if (employee.status === 'pending') {
    return (
      <Redirect href="/tradutor/completar-perfil" />
    );
  }

  if (employee.status !== 'available') {
    return <Redirect href="/tradutor" />;
  }

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        Serviços
      </Text>

      <Text style={styles.vazio}>
        Nenhum serviço disponível no momento.
      </Text>

    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
  },

  vazio: {
    fontSize: 16,
    color: '#666',
  },
});