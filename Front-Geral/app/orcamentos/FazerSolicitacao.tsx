import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
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

import { PublicNavbar } from '@/components/PublicNavbar';
import { createRequest } from '@/services/requests';
import type { TranslationLanguage } from '@/services/requests';

const languages: { label: string; value: TranslationLanguage }[] = [
  { label: 'Português', value: 'portuguese' },
  { label: 'Inglês', value: 'english' },
  { label: 'Espanhol', value: 'spanish' },
  { label: 'Alemão', value: 'german' },
  { label: 'Italiano', value: 'italian' },
  { label: 'Francês', value: 'french' },
  { label: 'Outro', value: 'other' },
];

type RequestForm = {
  name: string;
  email: string;
  phone: string;
  company: string;
  from: TranslationLanguage | null;
  to: TranslationLanguage | null;
  description: string;
};

type RequestField = 'name' | 'email' | 'phone' | 'from' | 'to';
type FormErrors = Partial<Record<RequestField, string>>;

const initialForm: RequestForm = {
  name: '',
  email: '',
  phone: '',
  company: '',
  from: null,
  to: null,
  description: '',
};

export default function FazerSolicitacao() {
  const [form, setForm] = useState<RequestForm>(initialForm);
  const [step, setStep] = useState<1 | 2>(1);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const { width } = useWindowDimensions();
  const wide = width >= 760;

  function update<K extends keyof RequestForm>(key: K, value: RequestForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    const errorField = (['name', 'email', 'phone', 'from', 'to'] as const)
      .find((field) => field === key);
    if (errorField) {
      setErrors((current) => {
        if (!(errorField in current)) return current;
        const next = { ...current };
        delete next[errorField];
        return next;
      });
    }
  }

  function validateForm() {
    const nextErrors: FormErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Informe seu nome completo.';
    if (!form.email.trim()) {
      nextErrors.email = 'Informe seu e-mail.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = 'Informe um endereço de e-mail válido.';
    }
    if (!form.phone.trim()) nextErrors.phone = 'Informe seu telefone.';
    if (!form.from) nextErrors.from = 'Selecione o idioma de origem.';
    if (!form.to) nextErrors.to = 'Selecione o idioma de destino.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function submitRequest() {
    if (!form.from || !form.to) return;

    setSending(true);
    try {
      await createRequest({
        username: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        company: form.company.trim() || null,
        translate_from: form.from,
        translate_to: form.to,
        observations: form.description.trim(),
      });
      setSent(true);
    } catch (cause) {
      Alert.alert(
        'Não foi possível enviar',
        cause instanceof Error ? cause.message : 'Ocorreu um erro inesperado ao enviar a solicitação.',
      );
    } finally {
      setSending(false);
    }
  }

  function requestAnother() {
    setForm(initialForm);
    setErrors({});
    setStep(1);
    setSent(false);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.page}>
          <PublicNavbar />

          {sent ? (
            <View style={styles.successPage}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark" size={34} color="#20845A" />
              </View>
              <View style={styles.successBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#20845A" />
                <Text style={styles.successBadgeText}>Solicitação enviada</Text>
              </View>
              <Text style={styles.successTitle}>Recebemos sua solicitação</Text>
              <Text style={styles.successDescription}>
                Nossa equipe vai analisar as informações e entrar em contato pelo e-mail informado.
              </Text>
              <Pressable onPress={() => router.replace('/landingPage')} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Voltar ao início</Text>
              </Pressable>
              <Pressable onPress={requestAnother} style={styles.newRequestButton}>
                <Text style={styles.newRequestText}>Enviar outra solicitação</Text>
              </Pressable>
            </View>
          ) : (
            <View style={[styles.requestContainer, wide && styles.requestContainerWide]}>
              <View style={styles.progress}>
                <ProgressStep active={step === 1} done={step === 2} number="1" label="Dados da solicitação" />
                <View style={styles.progressLine} />
                <ProgressStep active={step === 2} done={false} number="2" label="Revisão" />
              </View>

              {step === 1 ? (
                <>
                  <PageHeading
                    eyebrow="SOLICITAÇÃO DE TRADUÇÃO"
                    title="Conte o que você precisa traduzir"
                    description="Preencha os dados abaixo. Na próxima etapa, você poderá revisar tudo antes de enviar."
                  />
                  <View style={styles.formSections}>
                    <View style={styles.formSection}>
                      <SectionHeading
                        number="01"
                        title="Seus dados"
                        description="Usaremos estas informações para entrar em contato."
                      />
                      <View style={[styles.formGrid, wide && styles.formGridWide]}>
                        <InputField
                          label="Nome completo"
                          value={form.name}
                          onChangeText={(value) => update('name', value)}
                          placeholder="Digite seu nome"
                          required
                          autoComplete="name"
                          error={errors.name}
                        />
                        <InputField
                          label="E-mail"
                          value={form.email}
                          onChangeText={(value) => update('email', value)}
                          placeholder="voce@empresa.com.br"
                          required
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoComplete="email"
                          error={errors.email}
                        />
                        <InputField
                          label="Telefone"
                          value={form.phone}
                          onChangeText={(value) => update('phone', value)}
                          placeholder="(00) 00000-0000"
                          required
                          keyboardType="phone-pad"
                          error={errors.phone}
                        />
                        <InputField
                          label="Empresa"
                          value={form.company}
                          onChangeText={(value) => update('company', value)}
                          placeholder="Nome da empresa (opcional)"
                        />
                      </View>
                    </View>

                    <View style={styles.formSection}>
                      <SectionHeading
                        number="02"
                        title="Necessidade de tradução"
                        description="Informe o par de idiomas e o contexto do material."
                      />
                      <View style={[styles.formGrid, wide && styles.formGridWide]}>
                        <LanguageField
                          label="Idioma de origem"
                          value={form.from}
                          onSelect={(value) => update('from', value)}
                          required
                          error={errors.from}
                        />
                        <LanguageField
                          label="Idioma de destino"
                          value={form.to}
                          onSelect={(value) => update('to', value)}
                          required
                          error={errors.to}
                        />
                        <View style={wide && styles.spanTwo}>
                          <InputField
                            label="Descrição da necessidade e observações"
                            value={form.description}
                            onChangeText={(value) => update('description', value)}
                            placeholder="Ex.: Precisamos traduzir um manual de produto com linguagem técnica..."
                            multiline
                            hint="Inclua contexto, público e prazo desejado, se houver."
                          />
                        </View>
                      </View>
                    </View>

                    <View style={styles.formActions}>
                      <Pressable onPress={() => router.replace('/landingPage')} style={styles.secondaryButton}>
                        <Text style={styles.secondaryButtonText}>Cancelar</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          if (validateForm()) setStep(2);
                        }}
                        style={styles.primaryButton}
                      >
                        <Text style={styles.primaryButtonText}>Revisar solicitação</Text>
                        <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  </View>
                </>
              ) : (
                <>
                  <PageHeading
                    eyebrow="ETAPA 2 DE 2"
                    title="Revise antes de enviar"
                    description="Confira se todas as informações estão corretas."
                  />
                  <View style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewHeading}>Dados de contato</Text>
                      <Pressable onPress={() => setStep(1)} style={styles.editButton}>
                        <Ionicons name="create-outline" size={16} color="#087F8C" />
                        <Text style={styles.editText}>Editar</Text>
                      </Pressable>
                    </View>
                    <View style={[styles.reviewGrid, wide && styles.formGridWide]}>
                      <ReviewValue label="Nome" value={form.name} />
                      <ReviewValue label="E-mail" value={form.email} />
                      <ReviewValue label="Telefone" value={form.phone} />
                      <ReviewValue label="Empresa" value={form.company || '—'} />
                    </View>
                    <View style={[styles.reviewHeader, styles.reviewHeaderBorder]}>
                      <Text style={styles.reviewHeading}>Necessidade de tradução</Text>
                    </View>
                    <View style={[styles.reviewGrid, wide && styles.formGridWide]}>
                      <ReviewValue label="Idioma de origem" value={languageName(form.from)} />
                      <ReviewValue label="Idioma de destino" value={languageName(form.to)} />
                      <View style={wide && styles.spanTwo}>
                        <ReviewValue label="Descrição e observações" value={form.description} />
                      </View>
                    </View>
                  </View>
                  <View style={styles.formActions}>
                    <Pressable onPress={() => setStep(1)} style={styles.secondaryButton}>
                      <Text style={styles.secondaryButtonText}>Voltar</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => void submitRequest()}
                      disabled={sending}
                      style={[styles.primaryButton, sending && styles.disabledButton]}
                    >
                      {sending ? <ActivityIndicator size="small" color="#FFFFFF" /> : null}
                      <Text style={styles.primaryButtonText}>
                        {sending ? 'Enviando...' : 'Confirmar e enviar'}
                      </Text>
                      {!sending ? <Ionicons name="checkmark" size={17} color="#FFFFFF" /> : null}
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.pageHeading}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

function SectionHeading({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.sectionNumber}>
        <Text style={styles.sectionNumberText}>{number}</Text>
      </View>
      <View style={styles.sectionCopy}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionDescription}>{description}</Text>
      </View>
    </View>
  );
}

function ProgressStep({
  active,
  done,
  number,
  label,
}: {
  active: boolean;
  done: boolean;
  number: string;
  label: string;
}) {
  return (
    <View style={[styles.progressStep, (active || done) && styles.progressStepActive]}>
      <View style={[styles.progressNumber, (active || done) && styles.progressNumberActive]}>
        {done ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : (
          <Text style={[styles.progressNumberText, active && styles.progressNumberTextActive]}>
            {number}
          </Text>
        )}
      </View>
      <Text style={[styles.progressLabel, (active || done) && styles.progressLabelActive]}>
        {label}
      </Text>
    </View>
  );
}

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  required = false,
  multiline = false,
  hint,
  keyboardType,
  autoCapitalize,
  autoComplete,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  required?: boolean;
  multiline?: boolean;
  hint?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: 'name' | 'email';
  error?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label}{required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9AA8B2"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        accessibilityHint={error}
        style={[styles.input, multiline && styles.textarea, error && styles.inputError]}
      />
      {error ? <Text accessibilityRole="alert" style={styles.fieldError}>{error}</Text> : null}
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
    </View>
  );
}

function LanguageField({
  label,
  value,
  onSelect,
  required,
  error,
}: {
  label: string;
  value: TranslationLanguage | null;
  onSelect: (value: TranslationLanguage) => void;
  required: boolean;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label}{required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ? languageName(value) : 'Selecione o idioma'}`}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((current) => !current)}
        style={[styles.select, error && styles.inputError]}
      >
        <Text style={[styles.selectText, !value && styles.selectPlaceholder]}>
          {value ? languageName(value) : 'Selecione o idioma'}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color="#627485" />
      </Pressable>
      {error ? <Text accessibilityRole="alert" style={styles.fieldError}>{error}</Text> : null}
      {open ? (
        <View style={styles.selectOptions}>
          {languages.map((language) => (
            <Pressable
              key={language.value}
              onPress={() => {
                onSelect(language.value);
                setOpen(false);
              }}
              style={styles.selectOption}
            >
              <Text style={styles.selectOptionText}>{language.label}</Text>
              {value === language.value ? (
                <Ionicons name="checkmark" size={16} color="#087F8C" />
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function ReviewValue({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.reviewValue}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewText}>{value}</Text>
    </View>
  );
}

function languageName(value: TranslationLanguage | null) {
  return languages.find((language) => language.value === value)?.label ?? '—';
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  keyboard: { flex: 1 },
  page: { flexGrow: 1, backgroundColor: '#FFFFFF' },
  requestContainer: { width: '100%', maxWidth: 850, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 34, paddingBottom: 70 },
  requestContainerWide: { maxWidth: 1120, paddingTop: 55 },
  progress: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 45 },
  progressStep: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressStepActive: {},
  progressNumber: { width: 25, height: 25, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#E5EAED' },
  progressNumberActive: { backgroundColor: '#087F8C' },
  progressNumberText: { color: '#8A99A5', fontSize: 11, fontWeight: '700' },
  progressNumberTextActive: { color: '#FFFFFF' },
  progressLabel: { color: '#8A99A5', fontSize: 11 },
  progressLabelActive: { color: '#087F8C', fontWeight: '700' },
  progressLine: { width: 90, height: 1, marginHorizontal: 12, backgroundColor: '#DFE7EC' },
  pageHeading: { marginBottom: 24 },
  eyebrow: { color: '#087F8C', fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  title: { marginTop: 5, color: '#0B2239', fontSize: 30, lineHeight: 38, fontWeight: '800', letterSpacing: -0.9 },
  description: { marginTop: 6, color: '#627485', fontSize: 13, lineHeight: 20 },
  formSections: { gap: 20 },
  formSection: { padding: 28, borderWidth: 1, borderColor: '#DFE7EC', borderRadius: 14, backgroundColor: '#FFFFFF' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 18, marginBottom: 18, borderBottomWidth: 1, borderBottomColor: '#EDF1F3' },
  sectionNumber: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#E8F6F7' },
  sectionNumberText: { color: '#087F8C', fontSize: 10, fontWeight: '800' },
  sectionCopy: { flex: 1 },
  sectionTitle: { color: '#172B3A', fontSize: 15, fontWeight: '700' },
  sectionDescription: { marginTop: 3, color: '#627485', fontSize: 11 },
  formGrid: { gap: 18 },
  formGridWide: { flexDirection: 'row', flexWrap: 'wrap' },
  spanTwo: { width: '100%' },
  field: { flex: 1, minWidth: 200, marginBottom: 2 },
  fieldLabel: { marginBottom: 7, color: '#172B3A', fontSize: 12, fontWeight: '700' },
  required: { color: '#B33A3A' },
  input: { minHeight: 44, paddingHorizontal: 12, borderWidth: 1, borderColor: '#CAD6DD', borderRadius: 9, backgroundColor: '#FFFFFF', color: '#172B3A', fontSize: 13 },
  inputError: { borderColor: '#B33A3A', backgroundColor: '#FFF8F8' },
  fieldError: { marginTop: 5, color: '#B33A3A', fontSize: 10, lineHeight: 15 },
  textarea: { minHeight: 105, paddingTop: 11, textAlignVertical: 'top' },
  fieldHint: { marginTop: 6, color: '#627485', fontSize: 10, lineHeight: 15 },
  select: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderWidth: 1, borderColor: '#CAD6DD', borderRadius: 9, backgroundColor: '#FFFFFF' },
  selectText: { color: '#172B3A', fontSize: 13 },
  selectPlaceholder: { color: '#9AA8B2' },
  selectOptions: { marginTop: 5, borderWidth: 1, borderColor: '#DFE7EC', borderRadius: 9, backgroundColor: '#FFFFFF' },
  selectOption: { minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 11, borderBottomWidth: 1, borderBottomColor: '#EDF1F3' },
  selectOptionText: { color: '#172B3A', fontSize: 12 },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 9, marginTop: 2 },
  secondaryButton: { minHeight: 42, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 15, borderWidth: 1, borderColor: '#DFE7EC', borderRadius: 9, backgroundColor: '#FFFFFF' },
  secondaryButtonText: { color: '#172B3A', fontSize: 12, fontWeight: '700' },
  primaryButton: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16, borderRadius: 9, backgroundColor: '#087F8C' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  disabledButton: { opacity: 0.6 },
  reviewCard: { overflow: 'hidden', borderWidth: 1, borderColor: '#DFE7EC', borderRadius: 14, backgroundColor: '#FFFFFF' },
  reviewHeader: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, borderBottomWidth: 1, borderBottomColor: '#EDF1F3' },
  reviewHeaderBorder: { borderTopWidth: 1, borderTopColor: '#EDF1F3' },
  reviewHeading: { color: '#172B3A', fontSize: 13, fontWeight: '700' },
  editButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  editText: { color: '#087F8C', fontSize: 11, fontWeight: '700' },
  reviewGrid: { padding: 22, gap: 16 },
  reviewValue: { flex: 1, minWidth: 200 },
  reviewLabel: { color: '#627485', fontSize: 10 },
  reviewText: { marginTop: 4, color: '#172B3A', fontSize: 12, fontWeight: '600', lineHeight: 18 },
  successPage: { minHeight: 550, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 45 },
  successIcon: { width: 66, height: 66, alignItems: 'center', justifyContent: 'center', borderRadius: 33, backgroundColor: '#E8F5EE' },
  successBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 18, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: '#E8F5EE' },
  successBadgeText: { color: '#20845A', fontSize: 11, fontWeight: '700' },
  successTitle: { marginTop: 14, color: '#0B2239', fontSize: 27, fontWeight: '800', textAlign: 'center' },
  successDescription: { maxWidth: 520, marginTop: 8, marginBottom: 22, color: '#627485', fontSize: 13, lineHeight: 21, textAlign: 'center' },
  newRequestButton: { marginTop: 10, padding: 8 },
  newRequestText: { color: '#087F8C', fontSize: 12, fontWeight: '700' },
});
