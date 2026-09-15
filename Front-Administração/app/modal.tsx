import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function Modal() {
  const params = useLocalSearchParams<{
    id?: string;
    modo?: string;
  }>();

  const editando = !!params.id;

  const [nome, setNome] = useState(
    editando ? 'Caio Romano' : ''
  );

  const [email, setEmail] = useState('');

  const [senha, setSenha] = useState('');

  function salvar() {
    const administrador = {
      id: params.id,
      nome,
      email,
      senha,
    };

    console.log('Administrador:', administrador);

    // Futuramente:
    //
    // Se editando:
    // PUT /administradores/:id
    //
    // Se novo:
    // POST /administradores

    router.back();
  }

  return (
    <View style={styles.container}>

      <View style={styles.modal}>

        {/* CABEÇALHO */}
        <View style={styles.header}>

          <Text style={styles.title}>
            {editando
              ? 'Editar Usuário'
              : 'Novo Usuário'}
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
            placeholder="Digite a senha"
            secureTextEntry
            style={styles.input}
          />

          {/* SALVAR */}
          <Pressable
            style={styles.saveButton}
            onPress={salvar}
          >
            <Text style={styles.saveText}>
              SALVAR
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