import { router } from 'expo-router';
import { useState } from 'react';
import { preRegisterFreelancer } from '@/services/employees';
import { alertar } from '@/services/alerta';

import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';

export default function NovoTradutor() {

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (!email.trim() || !senha) {
      alertar('Pré-cadastro', 'Preencha e-mail e senha.');
      return;
    }

    setSalvando(true);
    try {
      await preRegisterFreelancer({
        email: email.trim(),
        password: senha,
      });
      alertar('Pré-cadastro', 'Freelancer pré-cadastrado com sucesso.');
      router.back();
    } catch (error) {
      alertar(
        'Não foi possível cadastrar',
        error instanceof Error ? error.message : 'Tente novamente.',
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <View style={styles.container}>

      <View style={styles.form}>

        <Text style={styles.title}>
          Pré-cadastro de Freelancer
        </Text>

        <ScrollView>

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

          <Text style={styles.label}>
            Senha
          </Text>

          <TextInput
            value={senha}
            onChangeText={setSenha}
            placeholder="Digite a senha"
            secureTextEntry
            style={styles.input}
          />

          <Pressable
            style={styles.botao}
            onPress={salvar}
            disabled={salvando}
          >
            <Text style={styles.botaoText}>
              {salvando ? 'CADASTRANDO...' : 'PRÉ-CADASTRAR'}
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
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 16,
  },

  botao: {
    height: 50,
    backgroundColor: '#000',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
  },

  botaoText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});