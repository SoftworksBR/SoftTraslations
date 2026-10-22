import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { createCompany, getCompanies } from '@/services/companies';
import type { Company } from '@/services/companies';

export function CompanyManagement() {
  const { employee } = useAuth();
  const { width } = useWindowDimensions();
  const compact = width < 680;
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [legalName, setLegalName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const isAtendimento = employee?.role === 'atendimento';

  const filteredCompanies = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return companies.filter((company) =>
      `${company.name} ${company.tax_id ?? ''}`.toLocaleLowerCase().includes(search),
    );
  }, [companies, query]);

  const loadCompanies = useCallback(async () => {
    if (!isAtendimento) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getCompanies();
      setCompanies(result);
      setSelectedCompany((current) =>
        current ? result.find((company) => company.id === current.id) ?? null : null,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao carregar empresas.');
    } finally {
      setLoading(false);
    }
  }, [isAtendimento]);

  useFocusEffect(
    useCallback(() => {
      void loadCompanies();
    }, [loadCompanies]),
  );

  async function saveCompany() {
    if (!legalName.trim() || !email.trim() || !phone.trim()) {
      Alert.alert('Campos obrigatórios', 'Informe a razão social, o e-mail e o telefone.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const created = await createCompany({
        name: legalName.trim(),
        primary_email: email.trim(),
        primary_phone: phone.trim(),
        tax_id: cnpj.trim() || null,
      });
      setCompanies((current) => [...current, created]);
      setSelectedCompany(created);
      setLegalName('');
      setCnpj('');
      setEmail('');
      setPhone('');
      setCreateOpen(false);
    } catch (cause) {
      Alert.alert(
        'Não foi possível cadastrar a empresa',
        cause instanceof Error ? cause.message : 'Ocorreu um erro inesperado.',
      );
    } finally {
      setSaving(false);
    }
  }

  if (!isAtendimento) {
    return (
      <View style={styles.screen}>
        <PageHeading
          eyebrow="ADMINISTRAÇÃO"
          title="Empresas"
          description="Empresas, departamentos e contatos da plataforma."
        />
        <Notice
          title="Acesso não disponível para este perfil"
          message="A API atual permite consultar e cadastrar empresas apenas para o perfil de Atendimento. Nenhum dado fictício será exibido."
          icon="lock-closed-outline"
        />
      </View>
    );
  }

  const contacts = selectedCompany?.employees ?? [];

  return (
    <View style={styles.screen}>
      <PageHeading
        eyebrow="ADMINISTRAÇÃO"
        title={selectedCompany ? selectedCompany.name : 'Empresas'}
        description={
          selectedCompany
            ? [selectedCompany.tax_id ? `CNPJ ${selectedCompany.tax_id}` : null, selectedCompany.primary_email, selectedCompany.primary_phone].filter(Boolean).join(' · ') || 'Dados de contato não informados.'
            : 'Consulte as empresas e suas estruturas cadastradas.'
        }
        action={selectedCompany ? undefined : (
          <Pressable
            accessibilityRole="button"
            onPress={() => setCreateOpen(true)}
            style={styles.primaryButton}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Cadastrar empresa</Text>
          </Pressable>
        )}
      />

      {selectedCompany ? (
        <View style={styles.detailWrap}>
          <Pressable onPress={() => setSelectedCompany(null)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={16} color="#087F8C" />
            <Text style={styles.backText}>Voltar para empresas</Text>
          </Pressable>
          <View style={styles.detailCard}>
            <SectionTitle
              title="Contatos"
              description="Pessoas de contato vinculadas a esta empresa."
            />
            {contacts.length ? contacts.map((contact) => (
              <View key={contact.id} style={styles.contactCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {contact.first_name.trim().slice(0, 1).toLocaleUpperCase()}
                  </Text>
                </View>
                <View style={styles.entityCopy}>
                  <Text style={styles.entityName}>{contact.first_name} {contact.last_name}</Text>
                  <Text style={styles.entityCaption}>{[contact.email, contact.phone].filter(Boolean).join(' · ')}</Text>
                </View>
              </View>
            )) : <Text style={styles.subtleEmpty}>Nenhum contato cadastrado.</Text>}
          </View>
        </View>
      ) : (
        <>
          <View style={styles.search}>
            <Ionicons name="search-outline" size={18} color="#627485" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar por razão social ou CNPJ"
              placeholderTextColor="#98A7B1"
              accessibilityLabel="Buscar empresas por razão social ou CNPJ"
              style={styles.searchInput}
            />
          </View>
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color="#087F8C" />
              <Text style={styles.loadingText}>Carregando empresas...</Text>
            </View>
          ) : error ? (
            <Notice
              title="Não foi possível carregar empresas"
              message={error}
              icon="alert-circle-outline"
              action={<RetryButton onPress={() => void loadCompanies()} />}
            />
          ) : (
            <FlatList
              data={filteredCompanies}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.list}
              ListHeaderComponent={!compact ? (
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeading, styles.companyColumn]}>Razão social</Text>
                  <Text style={styles.tableHeading}>CNPJ</Text>
                  <Text style={styles.tableHeading}>Contatos</Text>
                  <View style={styles.actionColumn} />
                </View>
                ) : null}
              ListEmptyComponent={(
                <View style={styles.emptyCard}>
                  <View style={styles.emptyIcon}>
                    <Ionicons name="business-outline" size={25} color="#087F8C" />
                  </View>
                  <Text style={styles.emptyTitle}>
                    {query ? 'Nenhuma empresa encontrada' : 'Nenhuma empresa cadastrada'}
                  </Text>
                  <Text style={styles.emptyDescription}>
                    {query
                      ? 'Tente buscar por outra razão social ou CNPJ.'
                      : 'Empresas cadastradas aparecerão nesta lista.'}
                  </Text>
                </View>
              )}
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Abrir empresa ${item.name}`}
                  onPress={() => setSelectedCompany(item)}
                  style={[styles.companyRow, compact && styles.companyRowCompact]}
                >
                  <View style={[styles.companyIdentity, compact && styles.companyIdentityCompact]}>
                    <View style={styles.entityIcon}>
                      <Ionicons name="business-outline" size={18} color="#087F8C" />
                    </View>
                    <Text style={styles.entityName}>{item.name}</Text>
                  </View>
                  <Text style={[styles.companyValue, compact && styles.companyValueCompact]}>{item.tax_id ?? '—'}</Text>
                  <Text style={[styles.companyValue, compact && styles.companyValueCompact]}>
                    {item.employees.length} {item.employees.length === 1 ? 'contato' : 'contatos'}
                  </Text>
                  <View style={[styles.actionColumn, compact && styles.actionColumnCompact]}>
                    <Ionicons name="chevron-forward" size={17} color="#8293A0" />
                  </View>
                </Pressable>
              )}
            />
          )}
        </>
      )}

      <Modal
        visible={createOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fechar cadastro"
              onPress={() => setCreateOpen(false)}
              style={styles.modalClose}
            >
              <Ionicons name="close" size={22} color="#627485" />
            </Pressable>
            <View style={styles.modalIcon}>
              <Ionicons name="business-outline" size={21} color="#087F8C" />
            </View>
            <Text style={styles.modalTitle}>Cadastrar empresa</Text>
            <Text style={styles.modalDescription}>
              A empresa será salva na plataforma.
            </Text>
            <Field label="Razão social" value={legalName} onChangeText={setLegalName} placeholder="Razão social da empresa" />
            <Field label="CNPJ" value={cnpj} onChangeText={setCnpj} placeholder="00.000.000/0000-00 (opcional)" />
            <Field label="E-mail" value={email} onChangeText={setEmail} placeholder="contato@empresa.com.br" />
            <Field label="Telefone" value={phone} onChangeText={setPhone} placeholder="(00) 00000-0000" />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setCreateOpen(false)} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={() => void saveCompany()}
                disabled={saving}
                style={[styles.primaryButton, saving && styles.disabledButton]}
              >
                {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : null}
                <Text style={styles.primaryButtonText}>{saving ? 'Salvando...' : 'Salvar empresa'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={[styles.pageHeading, action ? styles.pageHeadingWithAction : undefined]}>
      <View style={styles.headingCopy}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      {action}
    </View>
  );
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionHeading}>{title}</Text>
      <Text style={styles.sectionDescription}>{description}</Text>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#98A7B1"
        style={styles.fieldInput}
      />
    </View>
  );
}

function Notice({
  title,
  message,
  icon,
  action,
}: {
  title: string;
  message: string;
  icon: keyof typeof Ionicons.glyphMap;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.notice}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={24} color="#087F8C" />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{message}</Text>
      {action}
    </View>
  );
}

function RetryButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.primaryButton}>
      <Text style={styles.primaryButtonText}>Tentar novamente</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F8FA' },
  pageHeading: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 20,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 18,
  },
  pageHeadingWithAction: { flexWrap: 'wrap' },
  headingCopy: { flex: 1, minWidth: 220 },
  eyebrow: { color: '#087F8C', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  title: { marginTop: 5, color: '#0B2239', fontSize: 30, fontWeight: '800', letterSpacing: -0.9 },
  description: { marginTop: 6, color: '#627485', fontSize: 13, lineHeight: 20 },
  primaryButton: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 15,
    borderRadius: 9,
    backgroundColor: '#087F8C',
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  search: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginHorizontal: 24,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
  },
  searchInput: { flex: 1, minHeight: 42, color: '#172B3A', fontSize: 13 },
  list: { paddingHorizontal: 24, paddingBottom: 24, flexGrow: 1 },
  tableHeader: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: '#F9FBFC',
  },
  tableHeading: { width: 145, color: '#627485', fontSize: 10, fontWeight: '700' },
  companyColumn: { flex: 1 },
  actionColumn: { width: 28, alignItems: 'center' },
  companyRow: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#DFE7EC',
    backgroundColor: '#FFFFFF',
  },
  companyRowCompact: { position: 'relative', flexWrap: 'wrap', gap: 7, marginBottom: 9, paddingVertical: 12, borderTopWidth: 1, borderRadius: 10 },
  companyIdentity: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  companyIdentityCompact: { width: '100%', flexGrow: 0, flexShrink: 0 },
  entityIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: '#E8F6F7',
  },
  entityCopy: { flex: 1 },
  entityName: { color: '#172B3A', fontSize: 12, fontWeight: '700' },
  entityCaption: { marginTop: 4, color: '#627485', fontSize: 10, lineHeight: 15 },
  companyValue: { width: 145, color: '#627485', fontSize: 11 },
  companyValueCompact: { width: '100%', paddingLeft: 44 },
  actionColumnCompact: { position: 'absolute', right: 12, top: 13 },
  emptyCard: {
    alignItems: 'center',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 520,
    marginTop: 26,
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
  emptyTitle: { marginTop: 14, color: '#172B3A', fontSize: 15, fontWeight: '700', textAlign: 'center' },
  emptyDescription: { marginTop: 6, color: '#627485', fontSize: 12, lineHeight: 18, textAlign: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { marginTop: 10, color: '#627485', fontSize: 12 },
  detailWrap: { flex: 1, paddingHorizontal: 24, paddingBottom: 24 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', marginBottom: 14 },
  backText: { color: '#087F8C', fontSize: 12, fontWeight: '700' },
  detailCard: { marginBottom: 14, padding: 18, borderWidth: 1, borderColor: '#DFE7EC', borderRadius: 12, backgroundColor: '#FFFFFF' },
  sectionTitle: { marginBottom: 13 },
  sectionHeading: { color: '#172B3A', fontSize: 15, fontWeight: '700' },
  sectionDescription: { marginTop: 4, color: '#627485', fontSize: 11 },
  departmentCard: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#EDF1F3' },
  contactCard: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#EDF1F3' },
  avatar: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: '#E8F6F7' },
  avatarText: { color: '#087F8C', fontSize: 12, fontWeight: '800' },
  subtleEmpty: { paddingVertical: 12, color: '#627485', fontSize: 12 },
  notice: {
    alignItems: 'center',
    alignSelf: 'center',
    width: '90%',
    maxWidth: 560,
    marginTop: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(6,22,36,0.62)' },
  modal: { width: '100%', maxWidth: 500, alignSelf: 'center', padding: 25, borderRadius: 14, backgroundColor: '#FFFFFF' },
  modalClose: { position: 'absolute', top: 14, right: 14, padding: 5 },
  modalIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#E8F6F7' },
  modalTitle: { marginTop: 16, color: '#172B3A', fontSize: 20, fontWeight: '800' },
  modalDescription: { marginTop: 6, marginBottom: 20, color: '#627485', fontSize: 12, lineHeight: 18 },
  field: { marginBottom: 14 },
  fieldLabel: { marginBottom: 7, color: '#172B3A', fontSize: 12, fontWeight: '700' },
  fieldInput: { minHeight: 44, paddingHorizontal: 12, borderWidth: 1, borderColor: '#CAD6DD', borderRadius: 9, color: '#172B3A', fontSize: 13 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 9, marginTop: 8 },
  secondaryButton: { minHeight: 42, justifyContent: 'center', paddingHorizontal: 15, borderWidth: 1, borderColor: '#DFE7EC', borderRadius: 9 },
  secondaryButtonText: { color: '#172B3A', fontSize: 12, fontWeight: '700' },
  disabledButton: { opacity: 0.6 },
});
