import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useHydrated } from '@/hooks/use-hydrated';
import { useAuth } from '@/context/AuthContext';
import { Brand } from '@/components/Brand';

const colors = {
  navy: '#0B2239',
  teal: '#087F8C',
  tealSoft: '#E8F6F7',
  ink: '#172B3A',
  muted: '#627485',
  line: '#DFE7EC',
  canvas: '#F5F8FA',
  white: '#FFFFFF',
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const { signIn, status, employee } = useAuth();
  const { width } = useWindowDimensions();
  const isHydrated = useHydrated();
  const wide = isHydrated && width >= 850;

  async function fazerLogin() {
    if (!email.trim() || !senha) {
      Alert.alert('Campos obrigatórios', 'Preencha seu e-mail e sua senha para continuar.');
      return;
    }

    setEnviando(true);
    try {
      const authenticatedEmployee = await signIn(email.trim(), senha);
      switch (authenticatedEmployee.role) {
        case 'admin':
          router.replace('/drawer');
          break;
        case 'projetos':
          router.replace('/gestor');
          break;
        case 'atendimento':
          router.replace('/atendente');
          break;
        case 'freelancer':
          router.replace('/tradutor');
          break;
        default:
          router.replace('/landingPage');
      }
    } catch (error) {
      Alert.alert(
        'Não foi possível entrar',
        error instanceof Error
          ? error.message
          : 'Ocorreu um erro inesperado durante a autenticação.',
      );
    } finally {
      setEnviando(false);
    }
  }

  if (status === 'authenticated' && employee) {
    switch (employee.role) {
      case 'admin':
        return <Redirect href="/drawer" />;
      case 'projetos':
        return <Redirect href="/gestor" />;
      case 'atendimento':
        return <Redirect href="/atendente" />;
      case 'freelancer':
        return <Redirect href="/tradutor" />;
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={[styles.scrollContent, wide && styles.wideContent]}>
          {wide && (
            <View style={styles.brandPanel}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.replace('/landingPage')}
                style={styles.backLink}
              >
                <Ionicons name="arrow-back" size={17} color="#AFC1CE" />
                <Text style={styles.backText}>Voltar ao início</Text>
              </Pressable>
              <Brand />
              <View style={styles.brandMessage}>
                <Text style={styles.eyebrow}>OPERAÇÃO CONECTADA</Text>
                <Text style={styles.brandTitle}>
                  O trabalho certo, para a pessoa certa, na etapa certa.
                </Text>
                <Text style={styles.brandDescription}>
                  Gerencie solicitações, projetos e traduções em um ambiente organizado.
                </Text>
              </View>
              <Text style={styles.panelCaption}>SoftTranslations · Plataforma de gestão</Text>
            </View>
          )}

          <View style={styles.formPanel}>
            {!wide && (
              <View style={styles.mobileHeader}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.replace('/landingPage')}
                  style={styles.mobileBack}
                >
                  <Ionicons name="arrow-back" size={18} color={colors.muted} />
                  <Text style={styles.mobileBackText}>Voltar ao início</Text>
                </Pressable>
                <Brand />
              </View>
            )}

            <View style={styles.form}>
              <View style={styles.formIcon}>
                <Ionicons name="lock-closed-outline" size={21} color={colors.teal} />
              </View>
              <Text style={styles.title}>Boas-vindas</Text>
              <Text style={styles.subtitle}>
                Entre com seus dados para acessar a plataforma.
              </Text>

              <View style={styles.field}>
                <Text style={styles.label}>E-mail</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="mail-outline" size={18} color="#8293A0" />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="nome@empresa.com.br"
                    placeholderTextColor="#98A7B1"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                    style={styles.input}
                    accessibilityLabel="E-mail"
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Senha</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="key-outline" size={18} color="#8293A0" />
                  <TextInput
                    value={senha}
                    onChangeText={setSenha}
                    placeholder="Digite sua senha"
                    placeholderTextColor="#98A7B1"
                    secureTextEntry
                    autoComplete="password"
                    textContentType="password"
                    style={styles.input}
                    accessibilityLabel="Senha"
                  />
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={fazerLogin}
                disabled={enviando}
                style={({ pressed }) => [
                  styles.submitButton,
                  pressed && styles.pressed,
                  enviando && styles.submitButtonDisabled,
                ]}
              >
                <Text style={styles.submitText}>{enviando ? 'Validando...' : 'Entrar'}</Text>
                <Ionicons name="arrow-forward" size={18} color={colors.white} />
              </Pressable>

              <View style={styles.securityNote}>
                <Ionicons name="shield-checkmark-outline" size={16} color={colors.muted} />
                <Text style={styles.securityText}>
                  Seus dados são protegidos e usados apenas para acesso.
                </Text>
              </View>

              <View style={styles.support}>
                <Text style={styles.supportText}>Ainda não tem uma solicitação?</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push('/orcamentos/FazerSolicitacao')}
                >
                  <Text style={styles.supportLink}>Fale com nossa equipe</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: colors.white,
  },
  wideContent: {
    minHeight: '100%',
    flexDirection: 'row',
  },
  brandPanel: {
    width: '42%',
    minHeight: '100%',
    paddingHorizontal: 46,
    paddingVertical: 35,
    justifyContent: 'space-between',
    backgroundColor: colors.navy,
  },
  backLink: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 8,
  },
  backText: {
    color: '#AFC1CE',
    fontSize: 12,
    fontWeight: '600',
  },
  brandMessage: {
    marginVertical: 45,
  },
  eyebrow: {
    color: '#56D2DD',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  brandTitle: {
    marginTop: 13,
    color: colors.white,
    fontSize: 35,
    lineHeight: 43,
    fontWeight: '800',
    letterSpacing: -1,
  },
  brandDescription: {
    maxWidth: 400,
    marginTop: 13,
    color: '#AFC1CE',
    fontSize: 14,
    lineHeight: 22,
  },
  panelCaption: {
    color: '#718A9C',
    fontSize: 10,
  },
  formPanel: {
    flex: 1,
    minHeight: '100%',
    justifyContent: 'center',
    paddingHorizontal: 25,
    paddingVertical: 34,
    backgroundColor: colors.white,
  },
  mobileHeader: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    gap: 25,
    marginBottom: 34,
  },
  mobileBack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  mobileBackText: {
    color: colors.muted,
    fontSize: 12,
  },
  form: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  formIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.tealSoft,
  },
  title: {
    marginTop: 20,
    color: colors.navy,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.9,
  },
  subtitle: {
    marginTop: 5,
    marginBottom: 25,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 7,
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
  },
  inputWrap: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: '#CAD6DD',
    borderRadius: 9,
    backgroundColor: colors.white,
  },
  input: {
    flex: 1,
    minHeight: 46,
    padding: 0,
    color: colors.ink,
    fontSize: 13,
  },
  formOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 1,
    marginBottom: 20,
  },
  remember: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  checkbox: {
    width: 15,
    height: 15,
    borderWidth: 1,
    borderColor: '#BAC8D0',
    borderRadius: 4,
  },
  rememberText: {
    color: colors.muted,
    fontSize: 11,
  },
  forgotText: {
    color: colors.teal,
    fontSize: 11,
    fontWeight: '700',
  },
  submitButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 9,
    backgroundColor: colors.teal,
  },
  pressed: {
    opacity: 0.83,
  },
  submitButtonDisabled: {
    opacity: 0.65,
  },
  submitText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 17,
  },
  securityText: {
    color: colors.muted,
    fontSize: 10,
  },
  support: {
    alignItems: 'center',
    marginTop: 28,
    paddingTop: 19,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  supportText: {
    color: colors.muted,
    fontSize: 11,
  },
  supportLink: {
    marginTop: 6,
    color: colors.teal,
    fontSize: 12,
    fontWeight: '700',
  },
});
