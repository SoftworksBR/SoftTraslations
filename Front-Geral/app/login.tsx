import { router } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  function fazerLogin() {
    if (!email || !senha) {
      alert('Preencha todos os campos');
      return;
    }

    console.log('Login:', { email, senha });

    // Futuramente: chamar API de login
    // Se autenticado, redirecionar:
    router.replace('/drawer/GerenciarAdministracao');
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* LOGO/TÍTULO */}
        <Text style={styles.title}>SoftTranslations</Text>
        <Text style={styles.subtitle}>Gerenciador de Tradução</Text>

        {/* FORMULÁRIO */}
        <View style={styles.form}>
          {/* EMAIL */}
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Digite seu e-mail"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />

          {/* SENHA */}
          <Text style={styles.label}>Senha</Text>
          <TextInput
            value={senha}
            onChangeText={setSenha}
            placeholder="Digite sua senha"
            secureTextEntry
            style={styles.input}
          />

          {/* BOTÃO LOGIN */}
          <Pressable
            style={styles.loginButton}
            onPress={fazerLogin}
          >
            <Text style={styles.loginText}>ENTRAR</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    minHeight: '100%',
  },

  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },

  form: {
    width: '100%',
    maxWidth: 400,
  },

  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    marginTop: 16,
  },

  input: {
    height: 48,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 6,
    fontSize: 16,
    backgroundColor: '#fff',
  },

  loginButton: {
    height: 50,
    marginTop: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    borderRadius: 6,
  },

  loginText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});