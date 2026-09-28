import { router } from 'expo-router';

import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';

import { useState } from 'react';

export default function NovoTradutor() {

  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');

  function salvar() {

    const tradutor = {
      nome,
      senha,
      status: 'aguardando_perfil',
    };

    console.log('Pré-cadastro do tradutor:', tradutor);

    router.back();
  }

  return (
    <View style={styles.container}>

      <View style={styles.form}>

        <Text style={styles.title}>
          Pré-cadastro de Tradutor
        </Text>

        <ScrollView>

          <Text style={styles.label}>
            Nome
          </Text>

          <TextInput
            value={nome}
            onChangeText={setNome}
            placeholder="Digite o nome"
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
          >
            <Text style={styles.botaoText}>
              PRÉ-CADASTRAR
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