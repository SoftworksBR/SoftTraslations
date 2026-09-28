import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { createEmployee, getEmployees, updateEmployee } from '@/services/employees';
import type { EmployeeRole } from '@/services/employees';

import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const roleByType: Record<string, EmployeeRole> = {
  administrador: 'admin',
  gestor: 'projetos',
  atendente: 'atendimento',
};

export default function Modal() {
  const params = useLocalSearchParams<{
    id?: string;
    modo?: string;
    tipo?: string;
  }>();

  const editando = !!params.id;

  // Descobre qual tipo de usuário está sendo editado
  const tipo = params.tipo ?? 'usuario';
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [role, setRole] = useState<EmployeeRole | undefined>(roleByType[tipo]);
  const [carregando, setCarregando] = useState(editando);

  useEffect(() => {
    if (!params.id) return;

    let mounted = true;
    async function carregarFuncionario() {
      try {
        const employees = await getEmployees(1000);
        const employee = employees.find(
          (item) => String(item.id) === params.id,
        );
        if (!employee) {
          throw new Error('Funcionário não encontrado.');
        }
        if (mounted) {
          setNome(employee.username);
          setEmail(employee.email);
          setRole(employee.role);
        }
      } catch (error) {
        if (mounted) {
          Alert.alert(
            'Não foi possível carregar o funcionário',
            error instanceof Error ? error.message : 'Tente novamente.',
          );
        }
      } finally {
        if (mounted) setCarregando(false);
      }
    }

    void carregarFuncionario();
    return () => {
      mounted = false;
    };
  }, [params.id]);

  async function salvar() {
    if (!nome.trim() || !email.trim() || !senha || !role) {
      Alert.alert('Cadastro', 'Preencha nome, e-mail e senha.');
      return;
    }

    setCarregando(true);
    try {
      const employee = {
        username: nome.trim(),
        email: email.trim(),
        password: senha,
        role,
      };
      if (params.id) {
        await updateEmployee(Number(params.id), employee);
      } else {
        await createEmployee(employee);
      }
      router.back();
    } catch (error) {
      Alert.alert(
        'Não foi possível salvar',
        error instanceof Error ? error.message : 'Tente novamente.',
      );
    } finally {
      setCarregando(false);
    }
  }

  // Nome que aparecerá no título
  const tituloTipo = {
    administrador: 'Administrador',
    gestor: 'Gestor',
    atendente: 'Atendente',
  }[tipo] ?? 'Usuário';

  return (
    <View style={styles.container}>
      <View style={styles.modal}>

        {/* CABEÇALHO */}
        <View style={styles.header}>

          <Text style={styles.title}>
            {editando
              ? `Editar ${tituloTipo}`
              : `Novo ${tituloTipo}`}
          </Text>

          <Pressable
            onPress={() => router.back()}
            style={styles.closeButton}
          >
            <Text style={styles.close}>
              ×
            </Text>
          </Pressable>

        </View>

        {/* FORMULÁRIO */}
        <ScrollView
          contentContainerStyle={styles.form}
        >

          {/* ID */}
          {editando && (
            <>
              <Text style={styles.label}>
                ID
              </Text>

              <TextInput
                value={params.id}
                editable={false}
                style={[
                  styles.input,
                  styles.disabledInput,
                ]}
              />
            </>
          )}

          {/* NOME */}
          <Text style={styles.label}>
            Nome
          </Text>

          <TextInput
            value={nome}
            onChangeText={setNome}
            placeholder="Digite o nome"
            style={styles.input}
          />

          {/* EMAIL */}
          <Text style={styles.label}>
            E-mail
          </Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Digite o e-mail"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />

          {/* SENHA */}
          <Text style={styles.label}>
            Senha
          </Text>

          <TextInput
            value={senha}
            onChangeText={setSenha}
            placeholder={editando ? 'Digite a nova senha' : 'Digite a senha'}
            secureTextEntry
            style={styles.input}
          />

          {/* SALVAR */}
          <Pressable
            style={styles.saveButton}
            onPress={salvar}
            disabled={carregando}
          >
            <Text style={styles.saveText}>
              {carregando ? 'SALVANDO...' : 'SALVAR'}
            </Text>
          </Pressable>

        </ScrollView>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  modal: {
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
  },

  header: {
    minHeight: 65,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },

  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  close: {
    fontSize: 32,
    fontWeight: '300',
  },

  form: {
    padding: 20,
  },

  label: {
    marginTop: 12,
    marginBottom: 6,
    fontSize: 15,
    fontWeight: '600',
  },

  input: {
    height: 48,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 6,
    fontSize: 16,
  },

  disabledInput: {
    backgroundColor: '#eee',
    color: '#666',
  },

  saveButton: {
    height: 50,
    marginTop: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    borderRadius: 6,
  },

  saveText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});