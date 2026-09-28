import { router } from 'expo-router';

import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';

export default function Workflow() {

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        Workflow
      </Text>

      <Text style={styles.description}>
        Crie quadros e monte trilhas de trabalho.
      </Text>

      <Pressable
        style={styles.card}
        onPress={() =>
          router.push('/gestor/workflow/quadros')
        }
      >
        <Text style={styles.cardTitle}>
          Quadros
        </Text>

        <Text style={styles.cardDescription}>
          Criar, editar e excluir etapas de trabalho.
        </Text>
      </Pressable>

      <Pressable
        style={styles.card}
        onPress={() =>
          router.push('/gestor/workflow/trilhas')
        }
      >
        <Text style={styles.cardTitle}>
          Trilhas
        </Text>

        <Text style={styles.cardDescription}>
          Montar sequências usando os quadros.
        </Text>
      </Pressable>

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
  },

  description: {
    marginTop: 8,
    marginBottom: 25,
    color: '#666',
    fontSize: 16,
  },

  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 20,
    marginBottom: 15,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },

  cardDescription: {
    marginTop: 8,
    color: '#666',
  },
});