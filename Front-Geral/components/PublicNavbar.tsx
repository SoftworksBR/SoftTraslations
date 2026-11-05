import { router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Brand } from '@/components/Brand';

export function PublicNavbar() {
  const pathname = usePathname();
  const isRequestPage = pathname === '/orcamentos/FazerSolicitacao';
  const { width } = useWindowDimensions();
  const showRequestButton = width > 820;

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="SoftTranslations, voltar ao início"
        onPress={() => router.replace('/landingPage')}
      >
        <Brand />
      </Pressable>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push('/login')}
          style={styles.loginButton}
        >
          <Text style={styles.loginText}>Entrar</Text>
        </Pressable>
        {showRequestButton ? (
          <Pressable
            accessibilityRole="link"
            accessibilityState={{ selected: isRequestPage }}
            onPress={() => {
              if (!isRequestPage) router.push('/orcamentos/FazerSolicitacao');
            }}
            style={styles.requestButton}
          >
            <Text style={styles.requestText}>Fazer uma solicitação</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    maxWidth: 1200,
    minHeight: 74,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  loginButton: { minHeight: 42, justifyContent: 'center', paddingHorizontal: 13 },
  loginText: { color: '#627485', fontSize: 13, fontWeight: '600' },
  requestButton: {
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: 17,
    borderRadius: 9,
    backgroundColor: '#087F8C',
  },
  requestText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
});
