import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { FilterPanel, FilterSelect } from '@/components/FilterPanel';
import type { FilterOption } from '@/components/FilterPanel';
import { deleteEmployee, getEmployees } from '@/services/employees';
import type { Employee, EmployeeRole } from '@/services/employees';

const roleLabels: Record<EmployeeRole, string> = {
  admin: 'Administrador',
  projetos: 'Projetos',
  atendimento: 'Atendimento',
  freelancer: 'Freelancer',
};

const roleFilters: FilterOption<EmployeeRole | 'all'>[] = [
  { label: 'Todos os perfis', value: 'all' },
  { label: 'Administradores', value: 'admin' },
  { label: 'Atendimento', value: 'atendimento' },
  { label: 'Projetos', value: 'projetos' },
  { label: 'Freelancers', value: 'freelancer' },
];

const statusFilters: FilterOption<Employee['status'] | 'all'>[] = [
  { label: 'Todas as situações', value: 'all' },
  { label: 'Disponível', value: 'available' },
  { label: 'Ocupado', value: 'busy' },
  { label: 'Pendente', value: 'pending' },
];

const creatableRoles: EmployeeRole[] = ['admin', 'atendimento', 'projetos'];

const statusStyles = {
  available: { backgroundColor: '#E8F5EE', color: '#20845A', label: 'Disponível' },
  busy: { backgroundColor: '#F3EFFB', color: '#7357A8', label: 'Ocupado' },
  pending: { backgroundColor: '#FFF5E3', color: '#A46B12', label: 'Pendente' },
} satisfies Record<Employee['status'], { backgroundColor: string; color: string; label: string }>;

export function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<EmployeeRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<Employee['status'] | 'all'>('all');
  const [draftRoleFilter, setDraftRoleFilter] = useState<EmployeeRole | 'all'>('all');
  const [draftStatusFilter, setDraftStatusFilter] = useState<Employee['status'] | 'all'>('all');
  const [openFilter, setOpenFilter] = useState<'role' | 'status' | null>(null);
  const [chooseRoleOpen, setChooseRoleOpen] = useState(false);
  const { width } = useWindowDimensions();
  const wide = width >= 720;
  const filteredEmployees = employees.filter((employee) => {
    const search = query.trim().toLocaleLowerCase();
    const matchesRole = roleFilter === 'all' || employee.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;
    return matchesRole && matchesStatus && (!search ||
      employee.username.toLocaleLowerCase().includes(search) ||
      employee.email.toLocaleLowerCase().includes(search));
  });

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

  useFocusEffect(
    useCallback(() => {
      void loadEmployees();
    }, [loadEmployees]),
  );

  function openForm(employee?: Employee, selectedRole?: EmployeeRole) {
    const role = employee?.role ?? selectedRole;
    if (!role) {
      setChooseRoleOpen(true);
      return;
    }
    setChooseRoleOpen(false);
    router.push({
      pathname: '/modal',
      params: {
        tipo: role,
        ...(employee ? { id: String(employee.id) } : {}),
      },
    });
  }

  function confirmDelete(employee: Employee) {
    Alert.alert(
      'Excluir funcionário',
      `Deseja excluir ${employee.username}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEmployee(employee.id);
              await loadEmployees();
            } catch (cause) {
              Alert.alert(
                'Não foi possível excluir',
                cause instanceof Error ? cause.message : 'Ocorreu um erro inesperado.',
              );
            }
          },
        },
      ],
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, !wide && styles.headerNarrow]}>
        <View style={styles.headingCopy}>
          <Text style={styles.eyebrow}>GESTÃO DE ACESSOS</Text>
          <Text style={styles.title}>Funcionários</Text>
          <Text style={styles.description}>
            Gerencie administradores, atendimento, projetos e freelancers em uma única página.
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => openForm()}
          style={styles.addButton}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Cadastrar funcionário</Text>
        </Pressable>
      </View>

      <View style={[styles.listTools, !wide && styles.listToolsNarrow]}>
        <View style={[styles.tools, !wide && styles.toolsNarrow]}>
          <Ionicons name="search-outline" size={18} color="#627485" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar por nome ou e-mail"
            placeholderTextColor="#98A7B1"
            accessibilityLabel="Buscar funcionários por nome ou e-mail"
            style={styles.searchInput}
          />
        </View>
        <FilterPanel
          onOpen={() => {
            setDraftRoleFilter(roleFilter);
            setDraftStatusFilter(statusFilter);
            setOpenFilter(null);
          }}
          onClear={() => {
            setDraftRoleFilter('all');
            setDraftStatusFilter('all');
            setRoleFilter('all');
            setStatusFilter('all');
            setOpenFilter(null);
          }}
          onApply={() => {
            setRoleFilter(draftRoleFilter);
            setStatusFilter(draftStatusFilter);
            setOpenFilter(null);
          }}
        >
          <FilterSelect
            label="Perfil"
            value={draftRoleFilter}
            options={roleFilters}
            open={openFilter === 'role'}
            onToggle={() => setOpenFilter(openFilter === 'role' ? null : 'role')}
            onSelect={(value) => {
              setDraftRoleFilter(value);
              setOpenFilter(null);
            }}
          />
          <FilterSelect
            label="Situação"
            value={draftStatusFilter}
            options={statusFilters}
            open={openFilter === 'status'}
            onToggle={() => setOpenFilter(openFilter === 'status' ? null : 'status')}
            onSelect={(value) => {
              setDraftStatusFilter(value);
              setOpenFilter(null);
            }}
          />
        </FilterPanel>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#087F8C" />
          <Text style={styles.message}>Carregando funcionários...</Text>
        </View>
      ) : error ? (
        <View style={styles.empty}>
          <Text style={styles.message}>Não foi possível carregar os funcionários: {error}</Text>
          <Pressable onPress={() => void loadEmployees()} style={styles.retry}>
            <Text style={styles.addButtonText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredEmployees}
          keyExtractor={(employee) => String(employee.id)}
          contentContainerStyle={styles.list}
          ListHeaderComponent={wide ? (
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeading, styles.nameColumn]}>Funcionário</Text>
              <Text style={styles.profileColumn}>Perfil</Text>
              <Text style={[styles.tableHeading, styles.statusColumn]}>Status</Text>
              <Text style={styles.tableHeading}>Ações</Text>
            </View>
          ) : null}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="people-outline" size={25} color="#087F8C" />
              </View>
              <Text style={styles.emptyTitle}>
                {query ? 'Nenhum resultado encontrado' : 'Nenhum funcionário cadastrado'}
              </Text>
              <Text style={styles.emptyDescription}>
                {query
                  ? 'Tente buscar usando outro nome ou endereço de e-mail.'
                  : roleFilter !== 'all' || statusFilter !== 'all'
                    ? 'Tente ajustar ou limpar os filtros aplicados.'
                    : 'Os funcionários cadastrados aparecerão aqui.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.card, !wide && styles.cardNarrow]}>
              <View style={styles.info}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.username.trim().slice(0, 1).toLocaleUpperCase()}
                  </Text>
                </View>
                <View style={styles.identity}>
                  <Text style={styles.name}>{item.username}</Text>
                  <Text style={styles.email}>{item.email}</Text>
                </View>
              </View>
              <Text style={styles.profileValue}>{roleLabels[item.role]}</Text>
              <View style={styles.rowActions}>
                <View style={[styles.statusPill, { backgroundColor: statusStyles[item.status].backgroundColor }]}>
                  <Text style={[styles.statusText, { color: statusStyles[item.status].color }]}>
                    {statusStyles[item.status].label}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Editar ${item.username}`}
                  style={styles.actionButton}
                  onPress={() => openForm(item)}
                >
                  <Ionicons name="create-outline" size={19} color="#627485" />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Excluir ${item.username}`}
                  style={styles.actionButton}
                  onPress={() => confirmDelete(item)}
                >
                  <Ionicons name="trash-outline" size={19} color="#B33A3A" />
                </Pressable>
              </View>
            </View>
          )}
        />
      )}

      <Modal
        visible={chooseRoleOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setChooseRoleOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.roleModal}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fechar seleção de perfil"
              onPress={() => setChooseRoleOpen(false)}
              style={styles.modalClose}
            >
              <Ionicons name="close" size={22} color="#627485" />
            </Pressable>
            <Text style={styles.modalTitle}>Cadastrar funcionário</Text>
            <Text style={styles.modalDescription}>
              Selecione o perfil para continuar com o cadastro.
            </Text>
            {creatableRoles.map((employeeRole) => (
              <Pressable
                key={employeeRole}
                accessibilityRole="button"
                onPress={() => openForm(undefined, employeeRole)}
                style={styles.roleOption}
              >
                <View style={styles.roleOptionIcon}>
                  <Ionicons
                    name={employeeRole === 'admin'
                      ? 'shield-outline'
                      : employeeRole === 'atendimento'
                        ? 'headset-outline'
                        : 'briefcase-outline'}
                    size={18}
                    color="#087F8C"
                  />
                </View>
                <Text style={styles.roleOptionText}>{roleLabels[employeeRole]}</Text>
                <Ionicons name="chevron-forward" size={17} color="#8293A0" />
              </Pressable>
            ))}
            <Text style={styles.freelancerNote}>
              Freelancers são pré-cadastrados pela equipe de Projetos.
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F8FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 20,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 18,
  },
  headerNarrow: { flexDirection: 'column', alignItems: 'stretch', gap: 14 },
  headingCopy: { flex: 1 },
  title: {
    marginTop: 5,
    color: '#0B2239',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.9,
  },
  eyebrow: { color: '#087F8C', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  description: { marginTop: 6, color: '#627485', fontSize: 13 },
  listTools: {
    position: 'relative',
    zIndex: 5,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginHorizontal: 24,
    marginBottom: 16,
  },
  listToolsNarrow: { flexDirection: 'column', alignItems: 'stretch' },
  tools: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
  },
  toolsNarrow: { flex: 0 },
  searchInput: { flex: 1, minHeight: 42, color: '#172B3A', fontSize: 13 },
  list: { paddingHorizontal: 24, paddingBottom: 24, gap: 0, flexGrow: 1 },
  tableHeader: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: '#F9FBFC',
  },
  tableHeading: { width: 110, color: '#627485', fontSize: 10, fontWeight: '700' },
  nameColumn: { flex: 1 },
  profileColumn: { width: 115, color: '#627485', fontSize: 10, fontWeight: '700' },
  statusColumn: { width: 125 },
  card: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderTopWidth: 0,
  },
  cardNarrow: {
    borderTopWidth: 1,
    borderRadius: 10,
    marginBottom: 9,
    paddingHorizontal: 12,
  },
  info: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11 },
  avatar: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#E8F6F7',
  },
  avatarText: { color: '#087F8C', fontSize: 12, fontWeight: '800' },
  identity: { flex: 1 },
  name: { color: '#172B3A', fontSize: 13, fontWeight: '700' },
  email: { marginTop: 4, color: '#627485', fontSize: 11 },
  profileValue: { width: 115, color: '#627485', fontSize: 11 },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  statusPill: { minWidth: 86, alignItems: 'center', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: '700' },
  actionButton: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F5F8FA',
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  message: { padding: 24, color: '#627485', textAlign: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyCard: {
    alignItems: 'center',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 520,
    marginTop: 28,
    padding: 26,
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  emptyIcon: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    backgroundColor: '#E8F6F7',
  },
  emptyTitle: { marginTop: 14, color: '#172B3A', fontSize: 15, fontWeight: '700' },
  emptyDescription: { marginTop: 5, color: '#627485', fontSize: 12, textAlign: 'center' },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    minHeight: 42,
    paddingHorizontal: 16,
    backgroundColor: '#087F8C',
    borderRadius: 9,
  },
  retry: { marginTop: 12, padding: 12, backgroundColor: '#087F8C', borderRadius: 9 },
  addButtonText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(6,22,36,0.62)' },
  roleModal: { width: '100%', maxWidth: 480, alignSelf: 'center', padding: 24, borderRadius: 14, backgroundColor: '#FFFFFF' },
  modalClose: { position: 'absolute', top: 12, right: 12, padding: 5 },
  modalTitle: { color: '#172B3A', fontSize: 20, fontWeight: '800' },
  modalDescription: { marginTop: 6, marginBottom: 17, color: '#627485', fontSize: 12 },
  roleOption: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: '#EDF1F3' },
  roleOptionIcon: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#E8F6F7' },
  roleOptionText: { flex: 1, color: '#172B3A', fontSize: 12, fontWeight: '700' },
  freelancerNote: { marginTop: 12, color: '#627485', fontSize: 10, lineHeight: 15 },
});