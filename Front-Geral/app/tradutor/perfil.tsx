import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '@/context/AuthContext';

const statusLabels = {
  available: 'Disponível',
  busy: 'Ocupado',
  pending: 'Pendente',
} as const;

export default function MeuPerfil() {
  const { employee } = useAuth();

  if (!employee) {
    return <Redirect href="/login" />;
  }
  if (employee.status === 'pending') {
    return <Redirect href="/tradutor/completar-perfil" />;
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>MEU CADASTRO</Text>
        <Text style={styles.title}>Meu perfil</Text>
        <Text style={styles.description}>
          Consulte as informações associadas à sua conta de tradutor.
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.icon}>
            <Ionicons name="person-outline" size={20} color="#087F8C" />
          </View>
          <View style={styles.cardHeaderCopy}>
            <Text style={styles.cardTitle}>Dados do perfil</Text>
            <Text style={styles.cardDescription}>
              Informações recebidas do cadastro da plataforma.
            </Text>
          </View>
        </View>

        <View style={styles.fields}>
          <ProfileValue label="Nome" value={employee?.username} />
          <ProfileValue label="E-mail" value={employee?.email} />
          <ProfileValue label="Perfil" value="Freelancer" />
          <ProfileValue
            label="Situação"
            value={employee ? statusLabels[employee.status] : undefined}
          />
        </View>

        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={18} color="#397BC5" />
          <Text style={styles.noteText}>
            O cadastro atual não armazena telefone ou CPF e não oferece edição de perfil
            para contas já concluídas. Por isso, esses dados não são solicitados nem
            apresentados como se fossem persistidos.
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/tradutor/servicos')}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Voltar para serviços</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

function ProfileValue({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueBox}>
        <Text style={[styles.value, !value && styles.placeholder]}>{value ?? 'Não informado'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 32, backgroundColor: '#F5F8FA' },
  header: { paddingTop: 28, paddingBottom: 20 },
  eyebrow: { color: '#087F8C', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  title: { marginTop: 5, color: '#0B2239', fontSize: 30, fontWeight: '800', letterSpacing: -0.9 },
  description: { marginTop: 6, color: '#627485', fontSize: 13, lineHeight: 20 },
  card: {
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
    padding: 22,
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  icon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#E8F6F7' },
  cardHeaderCopy: { flex: 1 },
  cardTitle: { color: '#172B3A', fontSize: 14, fontWeight: '700' },
  cardDescription: { marginTop: 4, color: '#627485', fontSize: 11 },
  fields: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 22 },
  field: { flexGrow: 1, flexBasis: '45%', minWidth: 210 },
  label: { marginBottom: 6, color: '#172B3A', fontSize: 11, fontWeight: '700' },
  valueBox: { minHeight: 42, justifyContent: 'center', paddingHorizontal: 11, borderWidth: 1, borderColor: '#DFE7EC', borderRadius: 8, backgroundColor: '#F9FBFC' },
  value: { color: '#415462', fontSize: 12 },
  placeholder: { color: '#98A7B1' },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginTop: 20, padding: 13, borderRadius: 9, backgroundColor: '#EEF6FC' },
  noteText: { flex: 1, color: '#527582', fontSize: 10, lineHeight: 16 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20, paddingTop: 17, borderTopWidth: 1, borderTopColor: '#EDF1F3' },
  primaryButton: { minHeight: 40, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 15, borderRadius: 8, backgroundColor: '#087F8C' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
});
