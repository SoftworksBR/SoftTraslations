import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  deleteEmployee,
  getEmployees,
  type Employee,
  type EmployeeRole,
} from '@/services/employees';

type EmployeeGroup = {
  role: EmployeeRole;
  type: 'administrador' | 'gestor' | 'atendente';
  title: string;
  addLabel: string;
};

export default function EmployeeManagementList({
  role,
  type,
  title,
  addLabel,
}: EmployeeGroup) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getEmployees();
      setEmployees(result.filter((employee) => employee.role === role));
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Falha ao carregar funcionários.',
      );
    } finally {
      setLoading(false);
    }
  }, [role]);

  useFocusEffect(
    useCallback(() => {
      void loadEmployees();
    }, [loadEmployees]),
  );

  function openEmployee(id: number, mode?: 'editar') {
    router.push({
      pathname: '/modal',
      params: {
        id: String(id),
        tipo: type,
        modo: mode,
      },
    });
  }

  function confirmDelete(id: number) {
    if (Platform.OS === 'web') {
      if (
        typeof window !== 'undefined' &&
        window.confirm('Deseja realmente excluir este funcionário?')
      ) {
        void deleteEmployeeFromApi(id);
      }
      return;
    }

    Alert.alert('Excluir funcionário', 'Deseja realmente excluir este funcionário?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => void deleteEmployeeFromApi(id),
      },
    ]);
  }

  async function deleteEmployeeFromApi(id: number) {
    try {
      await deleteEmployee(id);
      await loadEmployees();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Tente novamente.';

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(`Não foi possível excluir: ${message}`);
      } else {
        Alert.alert('Não foi possível excluir', message);
      }
    }
  }

  function addEmployee() {
    router.push({
      pathname: '/modal',
      params: { tipo: type },
    });
  }

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator style={styles.loading} />
      ) : (
        <FlatList
          data={employees}
          keyExtractor={(employee) => String(employee.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {errorMessage || `Nenhum ${title.toLowerCase()} cadastrado.`}
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Pressable
                style={styles.info}
                onPress={() => openEmployee(item.id)}
              >
                <Text style={styles.name}>{item.username}</Text>
                <Text style={styles.id}>ID: {item.id}</Text>
              </Pressable>

              <Pressable
                accessibilityLabel={`Editar ${item.username}`}
                style={styles.actionButton}
                onPress={() => openEmployee(item.id, 'editar')}
              >
                <Ionicons name="pencil-outline" size={24} color="#000" />
              </Pressable>

              <Pressable
                accessibilityLabel={`Excluir ${item.username}`}
                style={styles.actionButton}
                onPress={() => confirmDelete(item.id)}
              >
                <Ionicons name="close-outline" size={30} color="#000" />
              </Pressable>
            </View>
          )}
        />
      )}

      <Pressable style={styles.addButton} onPress={addEmployee}>
        <Text style={styles.addButtonText}>{addLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loading: {
    marginTop: 32,
  },
  list: {
    padding: 20,
    gap: 12,
  },
  empty: {
    padding: 12,
    color: '#666',
  },
  card: {
    minHeight: 80,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
  },
  id: {
    marginTop: 5,
    fontSize: 14,
    color: '#666',
  },
  actionButton: {
    width: 55,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#ccc',
  },
  addButton: {
    alignSelf: 'flex-end',
    margin: 20,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
