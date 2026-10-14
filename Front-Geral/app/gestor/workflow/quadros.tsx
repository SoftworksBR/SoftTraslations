import { useState } from 'react';
import { router } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';

export default function Quadros() {

  const [quadros, setQuadros] = useState([
    {
      id: 1,
      nome: 'Receber arquivos',
    },
    {
      id: 2,
      nome: 'Traduzir arquivos',
    },
    {
      id: 3,
      nome: 'Emitir fatura',
    },
  ]);

  const [nome, setNome] = useState('');
  const [editandoId, setEditandoId] =
    useState<number | null>(null);

  function salvarQuadro() {

    if (!nome.trim()) {
      Alert.alert(
        'Atenção',
        'Digite o nome do quadro.'
      );

      return;
    }

    if (editandoId !== null) {

      setQuadros((lista) =>
        lista.map((quadro) =>
          quadro.id === editandoId
            ? {
                ...quadro,
                nome: nome.trim(),
              }
            : quadro
        )
      );

      setEditandoId(null);

    } else {

      const novo = {
        id: Date.now(),
        nome: nome.trim(),
      };

      setQuadros((lista) => [
        ...lista,
        novo,
      ]);
    }

    setNome('');
  }

  function editarQuadro(
    id: number,
    nomeAtual: string
  ) {
    setEditandoId(id);
    setNome(nomeAtual);
  }

  function excluirQuadro(id: number) {

    Alert.alert(
      'Excluir quadro',
      'Deseja realmente excluir este quadro?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          onPress: () => {
            setQuadros((lista) =>
              lista.filter(
                (quadro) => quadro.id !== id
              )
            );
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>

      <Pressable
        style={styles.voltar}
        onPress={() => router.back()}
      >
        <Text style={styles.voltarText}>
          ← Voltar
        </Text>
      </Pressable>

      <Text style={styles.title}>
        Quadros
      </Text>

      <View style={styles.form}>

        <TextInput
          value={nome}
          onChangeText={setNome}
          placeholder="Nome do quadro"
          style={styles.input}
        />

        <Pressable
          style={styles.botao}
          onPress={salvarQuadro}
        >
          <Text style={styles.botaoText}>
            {editandoId !== null
              ? 'SALVAR ALTERAÇÃO'
              : 'ADICIONAR QUADRO'}
          </Text>
        </Pressable>

      </View>

      <FlatList
        data={quadros}
        keyExtractor={(item) =>
          item.id.toString()
        }
        renderItem={({ item }) => (

          <View style={styles.card}>

            <Text style={styles.nome}>
              {item.nome}
            </Text>

            <View style={styles.acoes}>

              <Pressable
                onPress={() =>
                  editarQuadro(
                    item.id,
                    item.nome
                  )
                }
              >
                <Text style={styles.editar}>
                  ✎
                </Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  excluirQuadro(item.id)
                }
              >
                <Text style={styles.excluir}>
                  ×
                </Text>
              </Pressable>

            </View>

          </View>

        )}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  form: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 6,
    paddingHorizontal: 12,
  },

  botao: {
    height: 48,
    backgroundColor: '#000',
    borderRadius: 6,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  botaoText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    minHeight: 70,
    marginBottom: 12,
    paddingLeft: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },

  nome: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
  },

  acoes: {
    flexDirection: 'row',
    height: '100%',
  },

  editar: {
    fontSize: 27,
    paddingHorizontal: 20,
  },

  excluir: {
    fontSize: 30,
    paddingHorizontal: 20,
  },
  voltar: {
    marginBottom: 15,
  },

  voltarText: {
    fontSize: 16,
    fontWeight: '600',
  },
});