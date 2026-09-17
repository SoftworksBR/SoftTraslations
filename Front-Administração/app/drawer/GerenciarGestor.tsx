import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// aqui é pra puxar do banco
const gestores = [
  {
    id: 8,
    nome: 'Dweyne',
  },
];

export default function GerenciamentoGestor() {
  // Abrir ficha do grstor
  function abrirGestor(id: number) {
    router.push({
      pathname: '/modal',
      params: {
        id: id.toString(),
      },
    });
  }

  // Abrir formulário para adicionar
  function adicionarGestor() {
    router.push('/modal');
  }

  // Abrir formulário para editar
  function editarGestor(id: number) {
    router.push({
      pathname: '/modal',
      params: {
        id: id.toString(),
        modo: 'editar',
      },
    });
  }

  // Excluir gestor
  function excluirGestor(id: number) {
    console.log('Excluir gestor:', id);

    // Futuramente:
    // chamar DELETE na API
  }

  return (
    <View style={styles.container}>

      {/* LISTA */}
      <FlatList
        data={gestores}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (

          <View style={styles.card}>

            {/* ÁREA DO NOME E ID */}
            <Pressable
              style={styles.info}
              onPress={() => abrirGestor(item.id)}
            >
              <Text style={styles.name}>
                {item.nome}
              </Text>

              <Text style={styles.id}>
                ID: {item.id}
              </Text>
            </Pressable>

            {/* EDITAR */}
            <Pressable
              style={styles.actionButton}
              onPress={() => editarGestor(item.id)}
            >
              <Ionicons
                name="pencil-outline"
                size={24}
                color="#000"
              />
            </Pressable>

            {/* EXCLUIR */}
            <Pressable
              style={styles.actionButton}
              onPress={() => excluirGestor(item.id)}
            >
              <Ionicons
                name="close-outline"
                size={30}
                color="#000"
              />
            </Pressable>

          </View>
        )}
      />

      {/* BOTÃO ADICIONAR */}
      <Pressable
        style={styles.addButton}
        onPress={adicionarGestor}
      >
        <Text style={styles.addButtonText}>
          ADICIONAR GESTOR
        </Text>
      </Pressable>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 10,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },

  list: {
    padding: 20,
    gap: 12,
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