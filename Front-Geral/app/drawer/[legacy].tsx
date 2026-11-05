import { Redirect, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function LegacyAdminRoute() {
  const { legacy } = useLocalSearchParams<{ legacy: string }>();

  if (legacy === 'index') {
    return <Redirect href="/drawer" />;
  }
  if (['GerenciarAdministracao', 'GerenciarAtendimento', 'GerenciarGestor'].includes(legacy)) {
    return <Redirect href="/drawer/funcionarios" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Página não encontrada</Text>
      <Text style={styles.message}>A página administrativa solicitada não existe.</Text>
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
  title: { color: '#0B2239', fontSize: 20, fontWeight: '700' },
  message: { marginTop: 8, color: '#627485', textAlign: 'center' },
});
