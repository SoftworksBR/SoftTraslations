import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useHydrated } from '@/hooks/use-hydrated';

const areas = [
  {
    title: 'Requisições',
    description: 'Revise solicitações e acompanhe os dados dos clientes.',
    icon: 'document-text-outline' as const,
    route: '/atendente/requisicoes',
  },
  {
    title: 'Orçamentos',
    description: 'Consulte e acompanhe os orçamentos em andamento.',
    icon: 'wallet-outline' as const,
    route: '/atendente/orcamentos',
  },
  {
    title: 'Nova solicitação',
    description: 'Registre uma necessidade de tradução para um cliente.',
    icon: 'add-circle-outline' as const,
    route: '/orcamentos/FazerSolicitacao',
  },
] as const;

export default function AtendenteHome() {
  const { width } = useWindowDimensions();
  const isHydrated = useHydrated();
  const wide = isHydrated && width >= 720;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>EQUIPE DE ATENDIMENTO</Text>
        <Text style={styles.title}>Vamos organizar as solicitações.</Text>
        <Text style={styles.description}>
          Acesse requisições e orçamentos para dar continuidade a cada atendimento.
        </Text>
      </View>

      <View style={styles.cards}>
        {areas.map((area) => (
          <Pressable
            key={area.title}
            accessibilityRole="button"
            onPress={() => router.push(area.route)}
            style={({ pressed }) => [
              styles.card,
              wide ? styles.cardWide : styles.cardNarrow,
              pressed && styles.cardPressed,
            ]}
          >
            <View style={styles.cardIcon}>
              <Ionicons name={area.icon} size={23} color={colors.teal} />
            </View>
            <View style={styles.cardCopy}>
              <Text style={styles.cardTitle}>{area.title}</Text>
              <Text style={styles.cardDescription}>{area.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        ))}
      </View>

      <View style={styles.note}>
        <Ionicons name="checkmark-circle-outline" size={19} color={colors.green} />
        <Text style={styles.noteText}>
          Mantenha os dados de contato e o contexto do pedido completos para facilitar as próximas etapas.
        </Text>
      </View>
    </ScrollView>
  );
}

const colors = {
  navy: '#0B2239',
  teal: '#087F8C',
  tealSoft: '#E8F6F7',
  ink: '#172B3A',
  muted: '#627485',
  line: '#DFE7EC',
  canvas: '#F5F8FA',
  white: '#FFFFFF',
  green: '#20845A',
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
    padding: 24,
    paddingBottom: 40,
  },
  heading: {
    marginBottom: 25,
  },
  eyebrow: {
    color: colors.teal,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: {
    marginTop: 7,
    color: colors.navy,
    fontSize: 29,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  description: {
    marginTop: 7,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  cards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 13,
  },
  card: {
    minHeight: 112,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  cardWide: {
    flexBasis: '48%',
    flexGrow: 1,
  },
  cardNarrow: {
    width: '100%',
  },
  cardPressed: {
    borderColor: '#A9D4D8',
    backgroundColor: '#FBFEFE',
  },
  cardIcon: {
    width: 45,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.tealSoft,
  },
  cardCopy: {
    flex: 1,
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  cardDescription: {
    marginTop: 5,
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 22,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#E9F7F0',
  },
  noteText: {
    flex: 1,
    color: colors.ink,
    fontSize: 11,
    lineHeight: 17,
  },
});