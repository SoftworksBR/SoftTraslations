import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Brand } from '@/components/Brand';
import { PublicNavbar } from '@/components/PublicNavbar';
import { useHydrated } from '@/hooks/use-hydrated';

const colors = {
  navy: '#0B2239',
  navyLight: '#102D49',
  teal: '#087F8C',
  tealDark: '#066773',
  tealSoft: '#E8F6F7',
  ink: '#172B3A',
  muted: '#627485',
  line: '#DFE7EC',
  canvas: '#F5F8FA',
  white: '#FFFFFF',
  green: '#20845A',
};

const benefits = [
  {
    number: '01',
    title: 'Solicitações organizadas',
    description:
      'Envie os detalhes do seu trabalho e mantenha o contexto centralizado desde o primeiro contato.',
    icon: 'document-text-outline' as const,
  },
  {
    number: '02',
    title: 'Equipe conectada',
    description:
      'Atendimento, gestores e tradutores colaboram com responsabilidades bem definidas.',
    icon: 'people-outline' as const,
  },
  {
    number: '03',
    title: 'Etapas acompanhadas',
    description:
      'Tenha mais clareza sobre as etapas, responsáveis e prazos de cada projeto.',
    icon: 'git-branch-outline' as const,
  },
] as const;

function ActionButton({
  label,
  onPress,
  secondary = false,
  icon,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        secondary && styles.secondaryButton,
        pressed && styles.buttonPressed,
      ]}
    >
      {icon && (
        <Ionicons name={icon} size={18} color={secondary ? colors.ink : colors.white} />
      )}
      <Text style={[styles.actionButtonText, secondary && styles.secondaryButtonText]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function LandingPage() {
  const { width } = useWindowDimensions();
  const isHydrated = useHydrated();
  const wide = isHydrated && width >= 900;
  const medium = isHydrated && width >= 640;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <PublicNavbar />

        <View style={[styles.hero, wide && styles.heroWide]}>
          <View style={[styles.heroCopy, wide && styles.heroCopyWide]}>
            <View style={styles.eyebrowPill}>
              <Ionicons name="sparkles-outline" size={15} color={colors.teal} />
              <Text style={styles.eyebrow}>GESTÃO DE TRADUÇÕES</Text>
            </View>
            <Text style={[styles.heroTitle, wide && styles.heroTitleWide]}>
              Traduções fluem melhor quando tudo está no mesmo lugar.
            </Text>
            <Text style={styles.heroDescription}>
              Conte à nossa equipe o que você precisa traduzir e receba um retorno
              sobre o seu orçamento.
            </Text>
            <View style={styles.heroActions}>
              <ActionButton
                label="Fazer uma solicitação"
                icon="arrow-forward"
                onPress={() => router.push('/orcamentos/FazerSolicitacao')}
              />
              <ActionButton
                label="Acessar plataforma"
                secondary
                onPress={() => router.push('/login')}
              />
            </View>
            <View style={styles.trustRow}>
              {['Processo transparente', 'Equipe coordenada', 'Dados organizados'].map((item) => (
                <View key={item} style={styles.trustItem}>
                  <Ionicons name="checkmark-circle" size={17} color={colors.green} />
                  <Text style={styles.trustText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.heroArt, wide && styles.heroArtWide]}>
            <View style={styles.artGlow} />
            <View style={styles.translationCard}>
              <View style={styles.translationCardHeader}>
                <View style={styles.documentIcon}>
                  <Ionicons name="document-text-outline" size={22} color={colors.teal} />
                </View>
                <View style={styles.projectTitleWrap}>
                  <Text style={styles.projectCaption}>COMO FUNCIONA</Text>
                  <Text style={styles.projectTitle}>Da solicitação à tradução</Text>
                </View>
              </View>

              <View style={styles.languagePath}>
                <View style={styles.languageBox}>
                  <Text style={styles.languageCode}>01</Text>
                  <Text style={styles.languageName}>Solicitação</Text>
                </View>
                <View style={styles.languageArrow}>
                  <Ionicons name="arrow-forward" size={18} color={colors.teal} />
                </View>
                <View style={styles.languageBox}>
                  <Text style={styles.languageCode}>02</Text>
                  <Text style={styles.languageName}>Orçamento</Text>
                </View>
              </View>

              <View style={styles.progressHeading}>
                <Text style={styles.progressLabel}>
                  Nossa equipe analisa os detalhes enviados.
                </Text>
              </View>
            </View>
            <View style={styles.floatingNote}>
              <View style={styles.noteIcon}>
                <Ionicons name="checkmark" size={17} color={colors.green} />
              </View>
              <View>
                <Text style={styles.noteTitle}>Atendimento especializado</Text>
                <Text style={styles.noteCaption}>Retorno sobre o orçamento</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.howSection}>
          <View style={styles.sectionHeading}>
            <Text style={styles.eyebrow}>UM FLUXO MAIS SIMPLES</Text>
            <Text style={styles.sectionTitle}>Da necessidade ao trabalho concluído</Text>
            <Text style={styles.sectionDescription}>
              Compartilhe as informações necessárias para avaliarmos sua solicitação.
            </Text>
          </View>
          <View style={[styles.benefitsGrid, medium && styles.benefitsGridMedium]}>
            {benefits.map((benefit) => (
              <View key={benefit.number} style={styles.benefitCard}>
                <View style={styles.benefitTop}>
                  <View style={styles.benefitIcon}>
                    <Ionicons name={benefit.icon} size={21} color={colors.teal} />
                  </View>
                  <Text style={styles.benefitNumber}>{benefit.number}</Text>
                </View>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitDescription}>{benefit.description}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.rolesSection, wide && styles.rolesSectionWide]}>
          <View style={styles.rolesCopy}>
            <Text style={styles.eyebrowLight}>ACESSO DA EQUIPE</Text>
            <Text style={styles.rolesTitle}>Acesso à plataforma interna</Text>
            <Text style={styles.rolesDescription}>
              A equipe da SoftTranslations pode entrar com suas credenciais de funcionário.
            </Text>
            <ActionButton
              label="Entrar"
              secondary
              onPress={() => router.push('/login')}
            />
          </View>
        </View>

        <View style={[styles.finalCta, medium && styles.finalCtaMedium]}>
          <View style={styles.finalCtaCopy}>
            <Text style={styles.finalCtaTitle}>Pronto para organizar sua próxima tradução?</Text>
            <Text style={styles.finalCtaDescription}>
              Envie os detalhes da sua necessidade. É rápido e direto.
            </Text>
          </View>
          <ActionButton
            label="Fazer uma solicitação"
            icon="arrow-forward"
            onPress={() => router.push('/orcamentos/FazerSolicitacao')}
          />
        </View>

        <View style={styles.footer}>
          <Brand light />
          <Text style={styles.footerDescription}>
            Plataforma para gestão de solicitações e projetos de tradução.
          </Text>
          <Text style={styles.footerCopyright}>© 2025 SoftTranslations</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  page: {
    flexGrow: 1,
    backgroundColor: colors.white,
  },
  header: {
    width: '100%',
    maxWidth: 1248,
    alignSelf: 'center',
    minHeight: 78,
    paddingHorizontal: 24,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    flexWrap: 'wrap',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  headerLink: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  headerLinkText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  actionButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 17,
    borderRadius: 9,
    backgroundColor: colors.teal,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  buttonPressed: {
    opacity: 0.82,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: colors.ink,
  },
  hero: {
    width: '100%',
    paddingHorizontal: 24,
    paddingVertical: 58,
    backgroundColor: '#F1F9FA',
    gap: 35,
    overflow: 'hidden',
  },
  heroWide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '7%',
    paddingVertical: 68,
  },
  heroCopy: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  heroCopyWide: {
    width: '52%',
    alignSelf: 'auto',
  },
  eyebrowPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#DFF1F3',
  },
  eyebrow: {
    color: colors.teal,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  heroTitle: {
    marginTop: 19,
    color: colors.navy,
    fontSize: 39,
    lineHeight: 47,
    fontWeight: '800',
    letterSpacing: -1.5,
  },
  heroTitleWide: {
    fontSize: 51,
    lineHeight: 57,
  },
  heroDescription: {
    maxWidth: 570,
    marginTop: 13,
    color: colors.muted,
    fontSize: 16,
    lineHeight: 25,
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 24,
  },
  trustRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginTop: 24,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  trustText: {
    color: colors.muted,
    fontSize: 11,
  },
  heroArt: {
    width: '100%',
    maxWidth: 490,
    minHeight: 350,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  heroArtWide: {
    width: '44%',
    flexShrink: 1,
  },
  artGlow: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 250,
    backgroundColor: '#DDF1F2',
    opacity: 0.75,
    transform: [{ scale: 0.9 }],
  },
  translationCard: {
    zIndex: 1,
    padding: 22,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.96)',
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.13,
    shadowRadius: 28,
    elevation: 6,
  },
  translationCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  documentIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectTitleWrap: {
    flex: 1,
  },
  projectCaption: {
    color: colors.muted,
    fontSize: 9,
    letterSpacing: 0.7,
    fontWeight: '700',
  },
  projectTitle: {
    marginTop: 4,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  statusPill: {
    borderRadius: 20,
    backgroundColor: '#E4F4F6',
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  statusText: {
    color: colors.tealDark,
    fontSize: 9,
    fontWeight: '700',
  },
  languagePath: {
    marginTop: 23,
    marginBottom: 20,
    padding: 13,
    borderRadius: 12,
    backgroundColor: colors.canvas,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: 10,
  },
  languageBox: {
    minWidth: 94,
    minHeight: 66,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  languageCode: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '800',
  },
  languageName: {
    marginTop: 3,
    color: colors.muted,
    fontSize: 9,
  },
  languageArrow: {
    width: 33,
    height: 33,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.tealSoft,
  },
  progressHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    color: colors.muted,
    fontSize: 10,
  },
  progressValue: {
    color: colors.ink,
    fontSize: 10,
    fontWeight: '700',
  },
  progressTrack: {
    height: 7,
    overflow: 'hidden',
    borderRadius: 9,
    backgroundColor: '#E8EEF1',
  },
  progressFill: {
    width: '66%',
    height: '100%',
    borderRadius: 9,
    backgroundColor: colors.teal,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
  },
  avatar: {
    width: 29,
    height: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    borderRadius: 18,
  },
  avatarOne: {
    backgroundColor: '#D7EAF0',
  },
  avatarTwo: {
    marginLeft: -7,
    backgroundColor: '#E7DDF3',
  },
  avatarThree: {
    marginLeft: -7,
    backgroundColor: '#F4E4D4',
  },
  avatarText: {
    color: colors.navy,
    fontSize: 8,
    fontWeight: '800',
  },
  teamCaption: {
    marginLeft: 9,
    color: colors.muted,
    fontSize: 10,
  },
  floatingNote: {
    position: 'absolute',
    zIndex: 2,
    right: -5,
    bottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 11,
    borderRadius: 11,
    backgroundColor: colors.white,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  noteIcon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#E9F7F0',
  },
  noteTitle: {
    color: colors.ink,
    fontSize: 10,
    fontWeight: '700',
  },
  noteCaption: {
    marginTop: 2,
    color: colors.muted,
    fontSize: 9,
  },
  howSection: {
    width: '100%',
    maxWidth: 1248,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 64,
  },
  sectionHeading: {
    alignItems: 'center',
    marginBottom: 30,
  },
  sectionTitle: {
    maxWidth: 650,
    marginTop: 9,
    color: colors.navy,
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  sectionDescription: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
  },
  benefitsGrid: {
    gap: 13,
  },
  benefitsGridMedium: {
    flexDirection: 'row',
  },
  benefitCard: {
    flex: 1,
    minHeight: 190,
    padding: 21,
    borderWidth: 1,
    borderColor: '#EDF2F5',
    borderRadius: 13,
    backgroundColor: colors.canvas,
  },
  benefitTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 17,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: colors.tealSoft,
  },
  benefitNumber: {
    color: colors.teal,
    fontSize: 12,
    fontWeight: '800',
  },
  benefitTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  benefitDescription: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 19,
  },
  rolesSection: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    padding: 25,
    gap: 25,
    borderRadius: 18,
    backgroundColor: colors.navy,
  },
  rolesSectionWide: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 50,
    gap: 50,
  },
  rolesCopy: {
    flex: 1,
  },
  eyebrowLight: {
    color: '#56D2DD',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  rolesTitle: {
    marginTop: 11,
    color: colors.white,
    fontSize: 30,
    lineHeight: 37,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  rolesDescription: {
    marginTop: 10,
    marginBottom: 20,
    color: '#AABCCB',
    fontSize: 13,
    lineHeight: 21,
  },
  staffGrid: {
    flex: 1,
    gap: 9,
  },
  staffGridMedium: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  staffCard: {
    minHeight: 78,
    flexBasis: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 13,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  staffCardPressed: {
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  staffIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: 'rgba(86,210,221,0.12)',
  },
  staffText: {
    flex: 1,
  },
  staffTitle: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  staffDescription: {
    marginTop: 4,
    color: '#AABCCB',
    fontSize: 10,
  },
  finalCta: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    marginTop: 42,
    marginBottom: 42,
    padding: 23,
    gap: 18,
    borderRadius: 15,
    backgroundColor: colors.tealSoft,
  },
  finalCtaMedium: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 35,
  },
  finalCtaCopy: {
    flex: 1,
  },
  finalCtaTitle: {
    color: colors.navy,
    fontSize: 21,
    lineHeight: 28,
    fontWeight: '800',
  },
  finalCtaDescription: {
    marginTop: 5,
    color: colors.muted,
    fontSize: 12,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 27,
    gap: 12,
    backgroundColor: colors.navy,
  },
  footerDescription: {
    color: '#AABCCB',
    fontSize: 11,
  },
  footerCopyright: {
    color: '#718A9C',
    fontSize: 10,
  },
} as const);
