import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

export default function Orcamentos() {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>GESTÃO DE PROJETOS</Text>
      <Text style={styles.title}>Orçamentos</Text>
      <View style={styles.card}>
        <View style={styles.icon}>
          <Ionicons name="information-circle-outline" size={25} color="#087F8C" />
        </View>
        <Text style={styles.cardTitle}>Consulta indisponível</Text>
        <Text style={styles.description}>
          O backend conectado não oferece uma API de orçamentos. Esta tela não exibe
          solicitações ou valores fictícios.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#F5F8FA' },
  eyebrow: { color: '#087F8C', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  title: { marginTop: 7, color: '#0B2239', fontSize: 29, fontWeight: '800' },
  card: {
    width: '100%',
    maxWidth: 560,
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 36,
    padding: 28,
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  icon: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 27,
    backgroundColor: '#E8F6F7',
  },
  cardTitle: { marginTop: 16, color: '#172B3A', fontSize: 17, fontWeight: '700' },
  description: { marginTop: 8, color: '#627485', fontSize: 13, lineHeight: 20, textAlign: 'center' },
});
