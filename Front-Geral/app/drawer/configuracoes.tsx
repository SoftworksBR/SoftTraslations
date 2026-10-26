import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  createLanguage,
  createService,
  createTranslationPrice,
  listLanguages,
  listServices,
  listTranslationPrices,
  updateLanguage,
  updateService,
  updateTranslationPrice,
} from '@/services/settings';
import type {
  Language,
  Service,
  TranslationPrice,
} from '@/services/settings';

type SettingsTab = 'languages' | 'services' | 'prices';
type FormKind = SettingsTab | null;

const tabs: { id: SettingsTab; title: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'languages', title: 'Idiomas', icon: 'globe-outline' },
  { id: 'services', title: 'Serviços', icon: 'language-outline' },
  { id: 'prices', title: 'Preços', icon: 'pricetag-outline' },
];

export default function Configuracoes() {
  const [tab, setTab] = useState<SettingsTab>('languages');
  const [languages, setLanguages] = useState<Language[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [prices, setPrices] = useState<TranslationPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<FormKind>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [sourceLanguageId, setSourceLanguageId] = useState<number | null>(null);
  const [targetLanguageId, setTargetLanguageId] = useState<number | null>(null);
  const [pricePerWord, setPricePerWord] = useState('');

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [languageList, serviceList, priceList] = await Promise.all([
        listLanguages(),
        listServices(),
        listTranslationPrices(),
      ]);
      setLanguages(languageList);
      setServices(serviceList);
      setPrices(priceList);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar as configurações.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadSettings();
    }, [loadSettings]),
  );

  const activeLanguages = useMemo(
    () => languages.filter((item) => item.is_active),
    [languages],
  );
  const activeServices = useMemo(
    () => services.filter((item) => item.is_active),
    [services],
  );

  function openNewForm(kind: SettingsTab) {
    setEditingId(null);
    setName('');
    setCode('');
    setDescription('');
    setPricePerWord('');
    setServiceId(activeServices[0]?.id ?? null);
    setSourceLanguageId(activeLanguages[0]?.id ?? null);
    setTargetLanguageId(activeLanguages.find((item) => item.id !== activeLanguages[0]?.id)?.id ?? null);
    setFormError(null);
    setForm(kind);
  }

  function openLanguageForm(language?: Language) {
    openNewForm('languages');
    if (language) {
      setEditingId(language.id);
      setName(language.name);
      setCode(language.code ?? '');
    }
  }

  function openServiceForm(service?: Service) {
    openNewForm('services');
    if (service) {
      setEditingId(service.id);
      setName(service.name);
      setDescription(service.description ?? '');
    }
  }

  function openPriceForm(price?: TranslationPrice) {
    openNewForm('prices');
    if (price) {
      setEditingId(price.id);
      setServiceId(price.service_id);
      setSourceLanguageId(price.source_language_id);
      setTargetLanguageId(price.target_language_id);
      setPricePerWord(String(price.price_per_word).replace('.', ','));
    }
  }

  async function saveForm() {
    setSaving(true);
    setFormError(null);
    try {
      if (form === 'languages') {
        if (!name.trim()) {
          setFormError('Informe o nome do idioma.');
          return;
        }
        const payload = { name: name.trim(), code: code.trim() || null };
        if (editingId) {
          await updateLanguage(editingId, payload);
        } else {
          await createLanguage(payload);
        }
      } else if (form === 'services') {
        if (!name.trim()) {
          setFormError('Informe o nome do serviço.');
          return;
        }
        const payload = { name: name.trim(), description: description.trim() || null };
        if (editingId) {
          await updateService(editingId, payload);
        } else {
          await createService(payload);
        }
      } else if (form === 'prices') {
        const normalizedPrice = pricePerWord.trim().replace(',', '.');
        const parsedPrice = Number(normalizedPrice);
        if (!serviceId || !sourceLanguageId || !targetLanguageId) {
          setFormError('Cadastre e ative um serviço e pelo menos dois idiomas antes de definir preços.');
          return;
        }
        if (sourceLanguageId === targetLanguageId) {
          setFormError('Os idiomas de origem e destino devem ser diferentes.');
          return;
        }
        if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
          setFormError('Informe um preço por palavra maior que zero.');
          return;
        }
        const payload = {
          service_id: serviceId,
          source_language_id: sourceLanguageId,
          target_language_id: targetLanguageId,
          price_per_word: parsedPrice.toFixed(4),
        };
        if (editingId) {
          await updateTranslationPrice(editingId, payload);
        } else {
          await createTranslationPrice(payload);
        }
      }
      setForm(null);
      await loadSettings();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'Não foi possível salvar as alterações.');
    } finally {
      setSaving(false);
    }
  }

  async function setActive(kind: SettingsTab, id: number, isActive: boolean) {
    setError(null);
    try {
      if (kind === 'languages') {
        await updateLanguage(id, { is_active: isActive });
      } else if (kind === 'services') {
        await updateService(id, { is_active: isActive });
      } else {
        await updateTranslationPrice(id, { is_active: isActive });
      }
      await loadSettings();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível atualizar a situação.');
    }
  }

  const pageHeading = tab === 'languages'
    ? 'Idiomas disponíveis'
    : tab === 'services'
      ? 'Serviços prestados'
      : 'Preços por combinação';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>ADMINISTRAÇÃO</Text>
        <Text style={styles.title}>Configurações</Text>
        <Text style={styles.description}>
          Cadastre idiomas e serviços e defina o preço por palavra para cada combinação.
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
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{item.title}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.sectionHeader}>
        <View style={styles.sectionCopy}>
          <Text style={styles.sectionTitle}>{pageHeading}</Text>
          <Text style={styles.sectionDescription}>
            {tab === 'prices'
              ? 'Os valores são aplicados por palavra e par de idiomas.'
              : 'Itens inativos permanecem salvos e podem ser reativados.'}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => openNewForm(tab)}
          style={styles.addButton}
        >
          <Ionicons name="add" size={17} color="#FFFFFF" />
          <Text style={styles.addButtonText}>
            {tab === 'languages' ? 'Novo idioma' : tab === 'services' ? 'Novo serviço' : 'Novo preço'}
          </Text>
        </Pressable>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable accessibilityRole="button" onPress={() => void loadSettings()}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#087F8C" />
          <Text style={styles.emptyDescription}>Carregando configurações...</Text>
        </View>
      ) : tab === 'languages' ? (
        <View style={styles.list}>
          {languages.map((language) => (
            <View key={language.id} style={styles.itemCard}>
              <View style={styles.itemIcon}>
                <Ionicons name="globe-outline" size={19} color="#087F8C" />
              </View>
              <View style={styles.itemCopy}>
                <Text style={styles.itemTitle}>{language.name}</Text>
                <Text style={styles.itemDetail}>{language.code || 'Sem código'}</Text>
              </View>
              <StatusBadge active={language.is_active} />
              <ItemAction icon="create-outline" label={`Editar ${language.name}`} onPress={() => openLanguageForm(language)} />
              <ItemAction
                icon={language.is_active ? 'pause-circle-outline' : 'play-circle-outline'}
                label={language.is_active ? `Desativar ${language.name}` : `Ativar ${language.name}`}
                onPress={() => void setActive('languages', language.id, !language.is_active)}
              />
            </View>
          ))}
          {languages.length === 0 ? <EmptyState title="Nenhum idioma cadastrado" /> : null}
        </View>
      ) : tab === 'services' ? (
        <View style={styles.list}>
          {services.map((service) => (
            <View key={service.id} style={styles.itemCard}>
              <View style={styles.itemIcon}>
                <Ionicons name="language-outline" size={19} color="#087F8C" />
              </View>
              <View style={styles.itemCopy}>
                <Text style={styles.itemTitle}>{service.name}</Text>
                <Text style={styles.itemDetail}>{service.description || 'Sem descrição'}</Text>
              </View>
              <StatusBadge active={service.is_active} />
              <ItemAction icon="create-outline" label={`Editar ${service.name}`} onPress={() => openServiceForm(service)} />
              <ItemAction
                icon={service.is_active ? 'pause-circle-outline' : 'play-circle-outline'}
                label={service.is_active ? `Desativar ${service.name}` : `Ativar ${service.name}`}
                onPress={() => void setActive('services', service.id, !service.is_active)}
              />
            </View>
          ))}
          {services.length === 0 ? <EmptyState title="Nenhum serviço cadastrado" /> : null}
        </View>
      ) : (
        <View style={styles.list}>
          {prices.map((price) => (
            <View key={price.id} style={styles.itemCard}>
              <View style={styles.itemIcon}>
                <Ionicons name="pricetag-outline" size={19} color="#087F8C" />
              </View>
              <View style={styles.itemCopy}>
                <Text style={styles.itemTitle}>
                  {services.find((item) => item.id === price.service_id)?.name ?? 'Serviço removido'}
                </Text>
                <Text style={styles.itemDetail}>
                  {languages.find((item) => item.id === price.source_language_id)?.name ?? 'Idioma removido'}
                  {' → '}
                  {languages.find((item) => item.id === price.target_language_id)?.name ?? 'Idioma removido'}
                </Text>
                <Text style={styles.priceValue}>
                  {Number(price.price_per_word).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/palavra
                </Text>
              </View>
              <StatusBadge active={price.is_active} />
              <ItemAction icon="create-outline" label="Editar preço" onPress={() => openPriceForm(price)} />
              <ItemAction
                icon={price.is_active ? 'pause-circle-outline' : 'play-circle-outline'}
                label={price.is_active ? 'Desativar preço' : 'Ativar preço'}
                onPress={() => void setActive('prices', price.id, !price.is_active)}
              />
            </View>
          ))}
          {prices.length === 0 ? <EmptyState title="Nenhum preço cadastrado" /> : null}
        </View>
      )}

      <Modal
        visible={form !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setForm(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <View style={styles.formHeaderCopy}>
                <Text style={styles.formTitle}>
                  {editingId ? 'Editar' : 'Cadastrar'} {form === 'languages' ? 'idioma' : form === 'services' ? 'serviço' : 'preço'}
                </Text>
                <Text style={styles.formDescription}>
                  {form === 'prices' ? 'Defina o valor em reais por palavra.' : 'Preencha os dados para salvar no catálogo.'}
                </Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Fechar" onPress={() => setForm(null)}>
                <Ionicons name="close" size={22} color="#627485" />
              </Pressable>
            </View>

            <ScrollView style={styles.formBody} keyboardShouldPersistTaps="handled">
              {form === 'languages' ? (
                <>
                  <FormField label="Nome do idioma" value={name} onChangeText={setName} placeholder="Ex.: Português" />
                  <FormField label="Código (opcional)" value={code} onChangeText={setCode} placeholder="Ex.: pt-BR" autoCapitalize="none" />
                </>
              ) : form === 'services' ? (
                <>
                  <FormField label="Nome do serviço" value={name} onChangeText={setName} placeholder="Ex.: Tradução técnica" />
                  <FormField label="Descrição (opcional)" value={description} onChangeText={setDescription} placeholder="Descreva o serviço" multiline />
                </>
              ) : (
                <>
                  <ChoiceField
                    label="Serviço"
                    items={activeServices.map((item) => ({ id: item.id, label: item.name }))}
                    value={serviceId}
                    onChange={setServiceId}
                  />
                  <ChoiceField
                    label="Idioma de origem"
                    items={activeLanguages.map((item) => ({ id: item.id, label: item.name }))}
                    value={sourceLanguageId}
                    onChange={setSourceLanguageId}
                  />
                  <ChoiceField
                    label="Idioma de destino"
                    items={activeLanguages.map((item) => ({ id: item.id, label: item.name }))}
                    value={targetLanguageId}
                    onChange={setTargetLanguageId}
                  />
                  <FormField
                    label="Preço por palavra (R$)"
                    value={pricePerWord}
                    onChangeText={setPricePerWord}
                    placeholder="Ex.: 0,25"
                    keyboardType="decimal-pad"
                  />
                </>
              )}
              {formError ? <Text style={styles.formError}>{formError}</Text> : null}
              <Pressable
                accessibilityRole="button"
                disabled={saving}
                onPress={() => void saveForm()}
                style={[styles.saveButton, saving && styles.disabled]}
              >
                {saving
                  ? <ActivityIndicator color="#FFFFFF" />
                  : <Text style={styles.saveButtonText}>Salvar</Text>}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  autoCapitalize,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'decimal-pad';
  multiline?: boolean;
}) {
  return (
    <View style={styles.formField}>
      <Text style={styles.formLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#98A7B1"
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[styles.input, multiline && styles.multilineInput]}
      />
    </View>
  );
}

function ChoiceField({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: { id: number; label: string }[];
  value: number | null;
  onChange: (id: number) => void;
}) {
  return (
    <View style={styles.formField}>
      <Text style={styles.formLabel}>{label}</Text>
      <View style={styles.choices}>
        {items.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityState={{ selected: value === item.id }}
            onPress={() => onChange(item.id)}
            style={[styles.choice, value === item.id && styles.choiceSelected]}
          >
            <Text style={[styles.choiceText, value === item.id && styles.choiceTextSelected]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
        {items.length === 0 ? <Text style={styles.itemDetail}>Nenhuma opção ativa cadastrada.</Text> : null}
      </View>
    </View>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <View style={[styles.statusBadge, active ? styles.statusActive : styles.statusInactive]}>
      <Text style={[styles.statusText, active ? styles.statusActiveText : styles.statusInactiveText]}>
        {active ? 'Ativo' : 'Inativo'}
      </Text>
    </View>
  );
}

function ItemAction({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.iconButton}>
      <Ionicons name={icon} size={19} color="#627485" />
    </Pressable>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <View style={styles.emptyCard}>
      <Ionicons name="file-tray-outline" size={24} color="#087F8C" />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>Use o botão acima para adicionar o primeiro item.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F8FA' },
  content: { width: '100%', maxWidth: 1200, alignSelf: 'center', padding: 24, paddingBottom: 40 },
  heading: { marginBottom: 20 },
  eyebrow: { color: '#087F8C', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  title: { marginTop: 5, color: '#0B2239', fontSize: 30, fontWeight: '800', letterSpacing: -0.9 },
  description: { marginTop: 6, color: '#627485', fontSize: 13, lineHeight: 20 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 22, borderBottomWidth: 1, borderBottomColor: '#DFE7EC' },
  tab: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#087F8C' },
  tabText: { color: '#627485', fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: '#087F8C', fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginBottom: 15 },
  sectionCopy: { flex: 1 },
  sectionTitle: { color: '#172B3A', fontSize: 16, fontWeight: '700' },
  sectionDescription: { marginTop: 4, color: '#627485', fontSize: 11, lineHeight: 17 },
  addButton: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#087F8C' },
  addButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  list: { gap: 9 },
  itemCard: { minHeight: 72, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, padding: 12, borderWidth: 1, borderColor: '#DFE7EC', borderRadius: 10, backgroundColor: '#FFFFFF' },
  itemIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: '#E8F6F7' },
  itemCopy: { flex: 1, minWidth: 80 },
  itemTitle: { color: '#172B3A', fontSize: 12, fontWeight: '700' },
  itemDetail: { marginTop: 4, color: '#627485', fontSize: 10, lineHeight: 15 },
  priceValue: { marginTop: 4, color: '#087F8C', fontSize: 11, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 20 },
  statusActive: { backgroundColor: '#E8F5EE' },
  statusInactive: { backgroundColor: '#F3F5F6' },
  statusText: { fontSize: 9, fontWeight: '700' },
  statusActiveText: { color: '#20845A' },
  statusInactiveText: { color: '#627485' },
  iconButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#F5F8FA' },
  loading: { minHeight: 150, alignItems: 'center', justifyContent: 'center', gap: 10 },
  errorBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12, padding: 13, borderRadius: 8, backgroundColor: '#FFF1F0' },
  errorText: { flex: 1, color: '#B42318', fontSize: 11, lineHeight: 17 },
  retryText: { color: '#087F8C', fontSize: 11, fontWeight: '700' },
  emptyCard: { alignItems: 'center', padding: 26, borderWidth: 1, borderColor: '#DFE7EC', borderRadius: 10, backgroundColor: '#FFFFFF' },
  emptyTitle: { marginTop: 10, color: '#172B3A', fontSize: 13, fontWeight: '700' },
  emptyDescription: { marginTop: 5, color: '#627485', fontSize: 11, textAlign: 'center' },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: 18, backgroundColor: 'rgba(11,34,57,0.55)' },
  formCard: { width: '100%', maxWidth: 560, maxHeight: '90%', alignSelf: 'center', padding: 20, borderRadius: 13, backgroundColor: '#FFFFFF' },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 14 },
  formHeaderCopy: { flex: 1 },
  formTitle: { color: '#172B3A', fontSize: 18, fontWeight: '800' },
  formDescription: { marginTop: 5, color: '#627485', fontSize: 11 },
  formBody: { marginTop: 10 },
  formField: { marginTop: 13 },
  formLabel: { marginBottom: 6, color: '#172B3A', fontSize: 11, fontWeight: '700' },
  input: { minHeight: 42, paddingHorizontal: 11, borderWidth: 1, borderColor: '#DFE7EC', borderRadius: 8, color: '#172B3A', fontSize: 12 },
  multilineInput: { minHeight: 80, paddingTop: 10, textAlignVertical: 'top' },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  choice: { minHeight: 34, justifyContent: 'center', paddingHorizontal: 10, borderWidth: 1, borderColor: '#DFE7EC', borderRadius: 8, backgroundColor: '#FFFFFF' },
  choiceSelected: { borderColor: '#087F8C', backgroundColor: '#E8F6F7' },
  choiceText: { color: '#627485', fontSize: 10, fontWeight: '600' },
  choiceTextSelected: { color: '#087F8C' },
  formError: { marginTop: 12, color: '#B42318', fontSize: 11, lineHeight: 17 },
  saveButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 20, borderRadius: 8, backgroundColor: '#087F8C' },
  saveButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  disabled: { opacity: 0.6 },
});
