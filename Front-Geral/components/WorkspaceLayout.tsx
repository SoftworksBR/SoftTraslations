import { Ionicons } from '@expo/vector-icons';
import { Slot, router, usePathname, type Href } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { Brand } from '@/components/Brand';
import { RequireRole } from '@/components/RequireRole';
import { useAuth } from '@/context/AuthContext';
import { useHydrated } from '@/hooks/use-hydrated';
import type { EmployeeRole } from '@/services/employees';

type NavItem = {
  label: string;
  href: Href;
  icon: keyof typeof Ionicons.glyphMap;
  section?: string;
};

const roleLabels: Record<EmployeeRole, string> = {
  admin: 'Administrador',
  projetos: 'Gestor de projetos',
  atendimento: 'Atendimento',
  freelancer: 'Tradutor',
};

const navigation: Record<EmployeeRole, NavItem[]> = {
  admin: [
    { label: 'Visão geral', href: '/drawer', icon: 'home-outline' },
    { label: 'Funcionários', href: '/drawer/funcionarios', icon: 'people-outline', section: 'Equipe' },
    { label: 'Empresas', href: '/drawer/empresas', icon: 'business-outline', section: 'Cadastros' },
    { label: 'Configurações', href: '/drawer/configuracoes', icon: 'settings-outline', section: 'Cadastros' },
  ],
  atendimento: [
    { label: 'Requisições', href: '/atendente/requisicoes', icon: 'document-text-outline' },
    { label: 'Orçamentos', href: '/atendente/orcamentos', icon: 'wallet-outline' },
    { label: 'Empresas', href: '/atendente/empresas', icon: 'business-outline' },
  ],
  projetos: [
    { label: 'Projetos', href: '/gestor/projetos', icon: 'folder-outline' },
    { label: 'Orçamentos', href: '/gestor/orcamentos', icon: 'document-text-outline' },
    { label: 'Tradutores', href: '/gestor/tradutores', icon: 'people-outline' },
    { label: 'Workflow', href: '/gestor/workflow', icon: 'git-branch-outline' },
  ],
  freelancer: [
    { label: 'Serviços', href: '/tradutor/servicos', icon: 'language-outline' },
    { label: 'Meu perfil', href: '/tradutor/perfil' as Href, icon: 'person-outline' },
  ],
};

const titles: Record<string, string> = {
  '/drawer': 'Visão geral',
  '/drawer/index': 'Visão geral',
  '/drawer/funcionarios': 'Funcionários',
  '/drawer/empresas': 'Empresas',
  '/drawer/configuracoes': 'Configurações',
  '/atendente/empresas': 'Empresas',
  '/atendente': 'Visão geral',
  '/atendente/requisicoes': 'Requisições',
  '/atendente/orcamentos': 'Orçamentos',
  '/atendente/novo-orcamento': 'Novo orçamento',
  '/gestor': 'Visão geral',
  '/gestor/orcamentos': 'Orçamentos',
  '/gestor/projetos': 'Projetos',
  '/gestor/novo-projeto': 'Novo projeto',
  '/gestor/tradutores': 'Tradutores',
  '/gestor/tradutores/novo': 'Pré-cadastrar tradutor',
  '/gestor/workflow': 'Workflow',
  '/gestor/workflow/quadros': 'Quadros e etapas',
  '/gestor/workflow/trilhas': 'Trilhas',
  '/gestor/workflow/nova-trilha': 'Criar trilha',
  '/tradutor': 'Visão geral',
  '/tradutor/servicos': 'Serviços',
  '/tradutor/completar-perfil': 'Meu perfil',
  '/tradutor/perfil': 'Meu perfil',
};

export function WorkspaceLayout({ role }: { role: EmployeeRole }) {
  const { employee, signOut } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { width } = useWindowDimensions();
  const hydrated = useHydrated();
  const wide = hydrated && width > 820;
  const title = titles[pathname] ?? 'Plataforma';

  async function logout() {
    try {
      await signOut();
      router.replace('/landingPage');
    } catch (cause) {
      Alert.alert(
        'Não foi possível sair',
        cause instanceof Error ? cause.message : 'Ocorreu um erro inesperado.',
      );
    }
  }

  function renderSidebar(mobile = false) {
    return (
      <View style={[styles.sidebar, mobile && styles.mobileSidebar]}>
        <Brand light />
        <View style={styles.rolePill}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(employee?.username ?? 'U').trim().slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <View style={styles.roleText}>
            <Text style={styles.roleHint}>PERFIL ATIVO</Text>
            <Text style={styles.roleName}>{roleLabels[role]}</Text>
          </View>
        </View>
        <ScrollView style={styles.nav}>
          {navigation[role]
            .filter((item) => role !== 'freelancer' || employee?.status !== 'pending' || item.label !== 'Serviços')
            .map((item, index, items) => {
            const itemPath = String(item.href).replace(/\/index$/, '');
            const active = pathname === itemPath ||
              (itemPath !== '/drawer' && pathname.startsWith(`${itemPath}/`));
            return (
              <View key={String(item.href)}>
                {item.section && items[index - 1]?.section !== item.section ? (
                  <Text style={styles.navSection}>{item.section.toLocaleUpperCase()}</Text>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    router.push(item.href);
                    setMenuOpen(false);
                  }}
                  style={[styles.navItem, active && styles.navItemActive]}
                >
                  <Ionicons
                    name={item.icon}
                    size={19}
                    color={active ? '#FFFFFF' : '#9EB1C0'}
                  />
                  <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
        <View style={styles.sidebarBottom}>
          <Pressable accessibilityRole="button" onPress={() => void logout()} style={styles.navItem}>
            <Ionicons name="log-out-outline" size={19} color="#9EB1C0" />
            <Text style={styles.navLabel}>Sair</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <RequireRole allowedRoles={[role]}>
      <View style={styles.shell}>
        {wide ? renderSidebar() : null}
        <View style={styles.appArea}>
          <View style={styles.topbar}>
            {!wide ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Abrir menu"
                onPress={() => setMenuOpen(true)}
                style={styles.menuButton}
              >
                <Ionicons name="menu-outline" size={24} color="#172B3A" />
              </Pressable>
            ) : null}
            {wide ? (
              <View style={styles.breadcrumb}>
                <Text style={styles.breadcrumbText}>SoftTranslations</Text>
                <Ionicons name="chevron-forward" size={14} color="#8293A0" />
                <Text style={styles.breadcrumbCurrent}>{roleLabels[role]}</Text>
                <Ionicons name="chevron-forward" size={14} color="#8293A0" />
                <Text style={styles.breadcrumbCurrent}>{title}</Text>
              </View>
            ) : <Text style={styles.mobileTitle}>{title}</Text>}
            <View style={styles.topUser}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(employee?.username ?? 'U').trim().slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.userName}>{employee?.username ?? 'Conta'}</Text>
                <Text style={styles.userEmail}>{employee?.email}</Text>
              </View>
            </View>
          </View>
          <View style={styles.content}>
            <Slot />
          </View>
        </View>
        {!wide && menuOpen ? (
          <View style={styles.mobileOverlay}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fechar menu"
              onPress={() => setMenuOpen(false)}
              style={styles.scrim}
            />
            {renderSidebar(true)}
          </View>
        ) : null}
      </View>
    </RequireRole>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, flexDirection: 'row', backgroundColor: '#F5F8FA' },
  sidebar: {
    width: 250,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 18,
    backgroundColor: '#0B2239',
  },
  mobileSidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 2,
    width: 280,
    elevation: 12,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 28,
    marginBottom: 22,
    padding: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  avatar: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 17,
    backgroundColor: '#D8EEF1',
  },
  avatarText: { color: '#066773', fontSize: 12, fontWeight: '800' },
  roleText: { flex: 1 },
  roleHint: { color: '#8FA6B7', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  roleName: { marginTop: 3, color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  nav: { flex: 1 },
  navSection: { marginTop: 18, marginBottom: 8, paddingHorizontal: 12, color: '#72899A', fontSize: 9, fontWeight: '800', letterSpacing: 1.3 },
  navItem: {
    minHeight: 43,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  navItemActive: { backgroundColor: '#135066', borderLeftWidth: 3, borderLeftColor: '#40C5D1' },
  navLabel: { color: '#9EB1C0', fontSize: 13, fontWeight: '600' },
  navLabelActive: { color: '#FFFFFF' },
  sidebarBottom: { paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  appArea: { flex: 1, minWidth: 0, backgroundColor: '#F5F8FA' },
  topbar: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#DFE7EC',
    backgroundColor: '#FFFFFF',
  },
  breadcrumb: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  breadcrumbText: { color: '#627485', fontSize: 11 },
  breadcrumbCurrent: { color: '#172B3A', fontSize: 11, fontWeight: '700' },
  mobileTitle: { flex: 1, color: '#172B3A', fontSize: 15, fontWeight: '700' },
  menuButton: { padding: 5 },
  topUser: { flexDirection: 'row', alignItems: 'center', gap: 9, maxWidth: '65%' },
  userName: { color: '#172B3A', fontSize: 11, fontWeight: '700' },
  userEmail: { marginTop: 2, color: '#627485', fontSize: 9 },
  content: { flex: 1, minHeight: 0 },
  mobileOverlay: {
    position: 'absolute',
    zIndex: 5,
    backgroundColor: 'rgba(6,22,36,0.55)',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  scrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
});
