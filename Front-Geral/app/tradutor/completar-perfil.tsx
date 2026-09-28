import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';

import { tradutores } from '@/data/tradutores';

export default function CompletarPerfil() {

  const params = useLocalSearchParams<{
    id?: string;
  }>();

  const id = Number(params.id ?? 1);

  const tradutor = tradutores.find(
    (item) => item.id === id
  );

  const [email, setEmail] = useState(
    tradutor?.email ?? ''
  );

  const [telefone, setTelefone] = useState(
    tradutor?.telefone ?? ''
  );

  const [cpf, setCpf] = useState(
    tradutor?.cpf ?? ''
  );

  if (!tradutor) {
    return (
      <View style={styles.erro}>
        <Text>
          Tradutor não encontrado.
        </Text>
      </View>
    );
  }

  function enviarFormulario() {

    if (
      !email.trim() ||
      !telefone.trim() ||
      !cpf.trim()
    ) {
      Alert.alert(
        'Atenção',
        'Preencha todos os campos.'
      );

      return;
    }

    tradutor.email = email;
    tradutor.telefone = telefone;
    tradutor.cpf = cpf;

    tradutor.status =
      'aguardando_aprovacao';

    Alert.alert(
      'Formulário enviado',
      'Seu cadastro foi enviado para aprovação.',
      [
        {
          text: 'OK',
          onPress: () =>
            router.replace(
              `/tradutor/completar-perfil?id=${id}`
            ),
        },
      ]
    );
  }

  const aguardando =
    tradutor.status ===
    'aguardando_aprovacao';

  if (aguardando) {
    return (
      <View style={styles.aguardando}>

        <Text style={styles.aguardandoTitulo}>
          Cadastro enviado
        </Text>

        <Text style={styles.aguardandoTexto}>
          Seu perfil está aguardando aprovação
          do gestor.
        </Text>

      </View>
    );
  }

  return (
    <View style={styles.container}>

      <View style={styles.form}>

        <Text style={styles.title}>
          Completar Perfil
        </Text>

        <Text style={styles.subtitulo}>
          Olá, {tradutor.nome}
        </Text>

        <Text style={styles.informacao}>
          Complete seus dados para enviar seu
          cadastro para aprovação.
        </Text>

        <ScrollView>

          <Text style={styles.label}>
            Nome
          </Text>

          <TextInput
            value={tradutor.nome}
            editable={false}
            style={[
              styles.input,
              styles.disabled,
            ]}
          />

          <Text style={styles.label}>
            E-mail
          </Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Digite seu e-mail"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />

          <Text style={styles.label}>
            Telefone
          </Text>

          <TextInput
            value={telefone}
            onChangeText={setTelefone}
            placeholder="Digite seu telefone"
            keyboardType="phone-pad"
            style={styles.input}
          />

          <Text style={styles.label}>
            CPF
          </Text>

          <TextInput
            value={cpf}
            onChangeText={setCpf}
            placeholder="Digite seu CPF"
            keyboardType="numeric"
            style={styles.input}
          />

          <Pressable
            style={styles.botao}
            onPress={enviarFormulario}
          >
            <Text style={styles.botaoTexto}>
              ENVIAR PARA APROVAÇÃO
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