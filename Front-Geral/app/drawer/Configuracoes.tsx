import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type SettingsTab = 'languages' | 'services' | 'prices';

const tabs: { id: SettingsTab; title: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'languages', title: 'Idiomas', icon: 'globe-outline' },
  { id: 'services', title: 'Serviços', icon: 'language-outline' },
  { id: 'prices', title: 'Preços', icon: 'pricetag-outline' },
];

const tabContent: Record<SettingsTab, { heading: string; explanation: string }> = {
  languages: {
    heading: 'Idiomas',
    explanation: 'Os idiomas disponíveis para os trabalhos de tradução seriam gerenciados nesta seção.',
  },
  services: {
    heading: 'Serviços prestados',
    explanation: 'Os tipos de serviço oferecidos pela plataforma seriam gerenciados nesta seção.',
  },
  prices: {
    heading: 'Preços por combinação',
    explanation: 'As tarifas relacionadas a serviços e pares de idiomas seriam gerenciadas nesta seção.',
  },
};

export default function AdminSettings() {
  const [tab, setTab] = useState<SettingsTab>('languages');
  const activeContent = tabContent[tab];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>ADMINISTRAÇÃO</Text>
        <Text style={styles.title}>Configurações</Text>
        <Text style={styles.description}>
          Idiomas, serviços e preços que estruturam os trabalhos de tradução.
        </Text>
      </View>

      <View style={styles.tabs}>
        {tabs.map((item) => {
          const active = item.id === tab;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setTab(item.id)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Ionicons name={item.icon} size={16} color={active ? '#087F8C' : '#627485'} />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {item.title}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.sectionHeader}>
        <View style={styles.sectionCopy}>
          <Text style={styles.sectionTitle}>{activeContent.heading}</Text>
          <Text style={styles.sectionDescription}>{activeContent.explanation}</Text>
        </View>
      </View>

      <View style={styles.noticeCard}>
        <View style={styles.noticeIcon}>
          <Ionicons name="information-circle-outline" size={25} color="#087F8C" />
        </View>
        <Text style={styles.noticeTitle}>Integração ainda indisponível</Text>
        <Text style={styles.noticeDescription}>
          A API atual não oferece endpoints para consultar ou alterar {activeContent.heading.toLocaleLowerCase()}.
          Esta área permanece sem dados e sem ações de gravação para não apresentar cadastros fictícios.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F8FA' },
  content: { width: '100%', maxWidth: 1200, alignSelf: 'center', padding: 24, paddingBottom: 40 },
  heading: { marginBottom: 20 },
  eyebrow: { color: '#087F8C', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  title: { marginTop: 5, color: '#0B2239', fontSize: 30, fontWeight: '800', letterSpacing: -0.9 },
  description: { marginTop: 6, color: '#627485', fontSize: 13, lineHeight: 20 },
  tabs: { flexDirection: 'row', gap: 6, marginBottom: 22, borderBottomWidth: 1, borderBottomColor: '#DFE7EC' },
  tab: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#087F8C' },
  tabText: { color: '#627485', fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: '#087F8C', fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 20, marginBottom: 15 },
  sectionCopy: { flex: 1 },
  sectionTitle: { color: '#172B3A', fontSize: 16, fontWeight: '700' },
  sectionDescription: { marginTop: 4, color: '#627485', fontSize: 11, lineHeight: 17 },
  noticeCard: {
    alignItems: 'center',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 560,
    marginTop: 22,
    padding: 28,
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  noticeIcon: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 26, backgroundColor: '#E8F6F7' },
  noticeTitle: { marginTop: 15, color: '#172B3A', fontSize: 15, fontWeight: '700' },
  noticeDescription: { marginTop: 7, color: '#627485', fontSize: 12, lineHeight: 19, textAlign: 'center' },
});
