import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { administradores } from '@/data/administradores';
import { gestores } from '@/data/gestores';
import { atendentes } from '@/data/atendentes';

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
    tipo?: string;
  }>();

  const editando = !!params.id;

  // Descobre qual tipo de usuário está sendo editado
  const tipo = params.tipo ?? 'usuario';

  // Procura o usuário no arquivo correspondente
  let usuario: {
    id: number;
    nome: string;
    email?: string;
    senha?: string | number;
  } | undefined;

  if (tipo === 'administrador') {
    usuario = administradores.find(
      (item) => item.id.toString() === params.id
    );
  }

  if (tipo === 'gestor') {
    usuario = gestores.find(
      (item) => item.id.toString() === params.id
    );
  }

  if (tipo === 'atendente') {
    usuario = atendentes.find(
      (item) => item.id.toString() === params.id
    );
  }

  const [nome, setNome] = useState(usuario?.nome ?? '');
  const [email, setEmail] = useState(usuario?.email ?? '');
  const [senha, setSenha] = useState(
    usuario?.senha?.toString() ?? ''
  );

  function salvar() {
    const usuarioAtualizado = {
      id: params.id,
      nome,
      email,
      senha,
    };

    console.log(`${tipo}:`, usuarioAtualizado);

    // Futuramente:
    //
    // administrador → PUT /administradores/:id
    // gestor        → PUT /gestores/:id
    // atendente     → PUT /atendentes/:id
    //
    // novo usuário:
    // POST /administradores
    // POST /gestores
    // POST /atendentes

    router.back();
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