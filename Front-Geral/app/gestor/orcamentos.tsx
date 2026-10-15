import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

export default function Orcamentos() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Orçamentos
      </Text>

      <Text style={styles.text}>
        Área de orçamentos em desenvolvimento.
      </Text>
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
    marginBottom: 15,
  },

  text: {
    fontSize: 16,
    color: '#666',
  },
});