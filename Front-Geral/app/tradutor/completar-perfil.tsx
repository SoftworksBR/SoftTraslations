import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';

import { completeFreelancerProfile } from '@/services/employees';
import { getCurrentEmployee } from '@/services/auth';
import type { Employee, FreelancerType } from '@/services/employees';

const TIPOS_DE_FREELANCER: {
  valor: FreelancerType;
  rotulo: string;
}[] = [
  { valor: 'tradutor', rotulo: 'Tradutor' },
  { valor: 'revisor', rotulo: 'Revisor' },
  { valor: 'formatador', rotulo: 'Formatador' },
  { valor: 'interprete', rotulo: 'Intérprete' },
];

export default function CompletarPerfil() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [name, setName] = useState('');
  const [freelancerType, setFreelancerType] =
    useState<FreelancerType | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const currentEmployee = await getCurrentEmployee();
        if (currentEmployee.role !== 'freelancer') {
          router.replace('/');
          return;
        }
        if (currentEmployee.status !== 'pending') {
          router.replace('/tradutor');
          return;
        }

        setEmployee(currentEmployee);
        setName(
          currentEmployee.username === currentEmployee.email
            ? ''
            : currentEmployee.username,
        );
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar seu cadastro.',
        );
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
  }, []);

  async function enviarFormulario() {
    if (!name.trim()) {
      Alert.alert('Atenção', 'Informe seu nome.');
      return;
    }

    if (!freelancerType) {
      Alert.alert('Atenção', 'Selecione seu tipo de atuação.');
      return;
    }

    setSalvando(true);
    try {
      await completeFreelancerProfile({
        name: name.trim(),
        freelancer_type: freelancerType,
      });
      router.replace('/tradutor');
    } catch (error) {
      Alert.alert(
        'Não foi possível concluir o cadastro',
        error instanceof Error ? error.message : 'Tente novamente.',
      );
    } finally {
      setSalvando(false);
    }
  }

  if (loading) {
    return <ActivityIndicator style={styles.erro} />;
  }

  if (!employee) {
    return (
      <View style={styles.erro}>
        <Text>{errorMessage || 'Cadastro não encontrado.'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <View style={styles.form}>

        <Text style={styles.title}>
          Concluir cadastro
        </Text>

        <Text style={styles.subtitulo}>
          Olá, complete seu perfil para continuar.
        </Text>

        <Text style={styles.informacao}>
          Informe seus dados pessoais para ativar sua conta.
        </Text>

        <ScrollView>

          <Text style={styles.label}>
            Nome
          </Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Digite seu nome completo"
            autoCapitalize="words"
            style={styles.input}
          />

          <Text style={styles.label}>
            E-mail
          </Text>

          <TextInput
            value={employee.email}
            editable={false}
            style={styles.input}
          />

          <Text style={styles.label}>
            Tipo de atuação
          </Text>

          <View style={styles.tipos}>
            {TIPOS_DE_FREELANCER.map((tipo) => {
              const selecionado = freelancerType === tipo.valor;

              return (
                <Pressable
                  key={tipo.valor}
                  onPress={() => setFreelancerType(tipo.valor)}
                  style={[
                    styles.tipoBotao,
                    selecionado && styles.tipoBotaoSelecionado,
                  ]}
                >
                  <Text
                    style={[
                      styles.tipoTexto,
                      selecionado && styles.tipoTextoSelecionado,
                    ]}
                  >
                    {tipo.rotulo}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            style={styles.botao}
            onPress={() => void enviarFormulario()}
            disabled={salvando}
          >
            <Text style={styles.botaoTexto}>
              {salvando ? 'SALVANDO...' : 'CONCLUIR CADASTRO'}
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
    backgroundColor: '#eee',
    justifyContent: 'center',
    padding: 20,
  },

  form: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 25,
    maxHeight: '90%',
  },

  title: {
    fontSize: 25,
    fontWeight: 'bold',
  },

  subtitulo: {
    fontSize: 18,
    marginTop: 8,
  },

  informacao: {
    color: '#666',
    marginTop: 10,
    marginBottom: 15,
  },

  label: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 16,
  },

  disabled: {
    backgroundColor: '#eee',
    color: '#666',
  },

  tipos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  tipoBotao: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bbb',
  },

  tipoBotaoSelecionado: {
    backgroundColor: '#000',
    borderColor: '#000',
  },

  tipoTexto: {
    fontSize: 15,
    color: '#000',
  },

  tipoTextoSelecionado: {
    color: '#fff',
    fontWeight: 'bold',
  },

  botao: {
    height: 52,
    backgroundColor: '#000',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
  },

  botaoTexto: {
    color: '#fff',
    fontWeight: 'bold',
  },

  aguardando: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#f5f5f5',
  },

  aguardandoTitulo: {
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: 15,
  },

  aguardandoTexto: {
    fontSize: 17,
    textAlign: 'center',
    color: '#666',
  },

  erro: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});