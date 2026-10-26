import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { getEmployees } from '@/services/employees';
import type { Employee } from '@/services/employees';

export default function AdminDashboard() {
  const { employee } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getEmployees();
      setEmployees(result.employees);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao carregar funcionários.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void loadEmployees();
  }, [loadEmployees]));

  const counts = {
    admin: employees.filter((item) => item.role === 'admin').length,
    atendimento: employees.filter((item) => item.role === 'atendimento').length,
    projetos: employees.filter((item) => item.role === 'projetos').length,
    freelancer: employees.filter((item) => item.role === 'freelancer').length,
    available: employees.filter((item) => item.status === 'available').length,
    busy: employees.filter((item) => item.status === 'busy').length,
    pending: employees.filter((item) => item.status === 'pending').length,
  };
  const rolesTotal = counts.admin + counts.atendimento + counts.projetos + counts.freelancer;
  const greeting = employee?.username?.trim().split(/\s+/)[0] ?? 'Administração';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>VISÃO GERAL</Text>
        <Text style={styles.title}>Olá, {greeting}. Aqui está sua visão administrativa.</Text>
        <Text style={styles.description}>
          Resumo dos funcionários cadastrados na plataforma.
        </Text>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#087F8C" />
          <Text style={styles.loadingText}>Carregando indicadores...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle-outline" size={22} color="#B33A3A" />
          <Text style={styles.errorText}>Não foi possível carregar os indicadores: {error}</Text>
        </View>
      ) : (
        <>
          <View style={styles.stats}>
            <StatCard
              icon="people-outline"
              label="Funcionários"
              value={String(employees.length)}
              note="Registros retornados pela plataforma"
              tint="teal"
            />
            <StatCard
              icon="checkmark-circle-outline"
              label="Disponíveis"
              value={String(counts.available)}
              note="Funcionários com status disponível"
              tint="green"
            />
            <StatCard
              icon="time-outline"
              label="Ocupados"
              value={String(counts.busy)}
              note="Funcionários com status ocupado"
              tint="amber"
            />
            <StatCard
              icon="hourglass-outline"
              label="Pendentes"
              value={String(counts.pending)}
              note="Perfis aguardando conclusão"
              tint="purple"
            />
          </View>
          <View style={styles.dashboardGrid}>
            <View style={styles.dashboardCard}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.cardTitle}>Situação da equipe</Text>
                  <Text style={styles.cardDescription}>Distribuição dos registros reais.</Text>
                </View>
              </View>
              <StatusBar label="Disponível" count={counts.available} total={employees.length} color="#20845A" />
              <StatusBar label="Ocupado" count={counts.busy} total={employees.length} color="#C58B26" />
              <StatusBar label="Pendente" count={counts.pending} total={employees.length} color="#7357A8" />
              {employees.length === 0 ? (
                <Text style={styles.noEmployees}>Nenhum funcionário retornado pela API.</Text>
              ) : null}
            </View>
            <View style={styles.dashboardCard}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.cardTitle}>Acessos rápidos</Text>
                  <Text style={styles.cardDescription}>Gerencie as áreas administrativas.</Text>
                </View>
              </View>
              <DashboardLink
                icon="people-outline"
                title="Funcionários"
                detail={`${rolesTotal} cadastrados em todos os perfis`}
                onPress={() => router.push('/drawer/funcionarios')}
              />
              <DashboardLink
                icon="settings-outline"
                title="Configurações"
                detail="Idiomas, serviços e preços"
                onPress={() => router.push('/drawer/configuracoes')}
              />
              <Text style={styles.roleTotal}>
                {rolesTotal} registros distribuídos entre todos os perfis.
              </Text>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

function StatCard({
  icon,
  label,
  value,
  note,
  tint,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  note: string;
  tint: 'teal' | 'green' | 'amber' | 'purple';
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, styles[`icon_${tint}`]]}>
        <Ionicons name={icon} size={20} color={tintColors[tint]} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statNote}>{note}</Text>
    </View>
  );
}

function StatusBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  return (
    <View style={styles.statusRow}>
      <View style={styles.statusHeading}>
        <Text style={styles.statusLabel}>{label}</Text>
        <Text style={styles.statusCount}>{count}</Text>
      </View>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            { width: `${total ? Math.round((count / total) * 100) : 0}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

function DashboardLink({
  icon,
  title,
  detail,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  detail: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.linkRow}>
      <View style={styles.linkIcon}>
        <Ionicons name={icon} size={17} color="#087F8C" />
      </View>
      <View style={styles.linkCopy}>
        <Text style={styles.linkTitle}>{title}</Text>
        <Text style={styles.linkDetail}>{detail}</Text>
      </View>
      <Ionicons name="chevron-forward" size={17} color="#9AA8B2" />
    </Pressable>
  );
}

const tintColors = {
  teal: '#087F8C',
  green: '#20845A',
  amber: '#A46B12',
  purple: '#7357A8',
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F8FA' },
  content: { width: '100%', maxWidth: 1240, alignSelf: 'center', padding: 24, paddingBottom: 38 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 22 },
  eyebrow: { color: '#087F8C', fontSize: 10, fontWeight: '800', letterSpacing: 1.3 },
  title: { marginTop: 6, color: '#0B2239', fontSize: 27, lineHeight: 34, fontWeight: '800', letterSpacing: -0.7 },
  description: { marginTop: 6, color: '#627485', fontSize: 13 },
  loading: { minHeight: 220, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 10, color: '#627485', fontSize: 12 },
  errorCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderWidth: 1, borderColor: '#F0CECE', borderRadius: 10, backgroundColor: '#FFF0F0' },
  errorText: { flex: 1, color: '#B33A3A', fontSize: 12, lineHeight: 18 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { flexBasis: 230, flexGrow: 1, minHeight: 156, padding: 17, borderWidth: 1, borderColor: '#DFE7EC', borderRadius: 12, backgroundColor: '#FFFFFF' },
  statIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  icon_teal: { backgroundColor: '#E8F6F7' },
  icon_green: { backgroundColor: '#E8F5EE' },
  icon_amber: { backgroundColor: '#FFF5E3' },
  icon_purple: { backgroundColor: '#F3EFFB' },
  statLabel: { marginTop: 12, color: '#627485', fontSize: 11, fontWeight: '600' },
  statValue: { marginTop: 3, color: '#0B2239', fontSize: 25, fontWeight: '800' },
  statNote: { marginTop: 3, color: '#8293A0', fontSize: 10, lineHeight: 15 },
  dashboardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 16 },
  dashboardCard: { flexBasis: 350, flexGrow: 1, padding: 18, borderWidth: 1, borderColor: '#DFE7EC', borderRadius: 12, backgroundColor: '#FFFFFF' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 17 },
  cardTitle: { color: '#172B3A', fontSize: 15, fontWeight: '700' },
  cardDescription: { marginTop: 4, color: '#627485', fontSize: 11 },
  statusRow: { marginBottom: 16 },
  statusHeading: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  statusLabel: { color: '#172B3A', fontSize: 11, fontWeight: '600' },
  statusCount: { color: '#627485', fontSize: 10 },
  barTrack: { height: 7, overflow: 'hidden', borderRadius: 5, backgroundColor: '#EEF2F4' },
  barFill: { height: 7, borderRadius: 5 },
  noEmployees: { color: '#8293A0', fontSize: 11, textAlign: 'center' },
  linkRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: '#EDF1F3' },
  linkIcon: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#E8F6F7' },
  linkCopy: { flex: 1 },
  linkTitle: { color: '#172B3A', fontSize: 11, fontWeight: '700' },
  linkDetail: { marginTop: 3, color: '#8293A0', fontSize: 9 },
  roleTotal: { marginTop: 10, color: '#8293A0', fontSize: 10, lineHeight: 15 },
});
