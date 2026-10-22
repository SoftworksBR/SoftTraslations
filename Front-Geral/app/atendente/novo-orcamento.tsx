import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function NovoOrcamento() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Novo orçamento</Text>
      <Text style={styles.description}>
        Não é possível criar ou salvar um orçamento: o backend atual não possui uma API
        para essa operação. Nenhum dado de demonstração foi carregado.
      </Text>
      <Pressable style={styles.button} onPress={() => router.back()}>
        <Text style={styles.buttonText}>Voltar às solicitações</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F5F8FA',
  },
  title: { color: '#0B2239', fontSize: 24, fontWeight: '800', textAlign: 'center' },
  description: {
    maxWidth: 560,
    marginTop: 12,
    color: '#627485',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  button: { marginTop: 22, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 8, backgroundColor: '#087F8C' },
  buttonText: { color: '#FFFFFF', fontWeight: '700' },
});
