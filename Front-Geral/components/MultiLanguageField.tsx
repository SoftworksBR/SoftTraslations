import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

// inactive é opcional: só quem monta o catálogo com idiomas desativados usa.
export type LanguageOption = { label: string; value: number; inactive?: boolean };

export function MultiLanguageField({
  label,
  placeholder,
  options,
  value,
  onSelect,
  required,
  error,
}: {
  label: string;
  placeholder: string;
  options: LanguageOption[];
  value: number[];
  onSelect: (value: number) => void;
  required: boolean;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selectedNames = optionNames(options, value);
  const normalizedSearch = normalizeSearch(search);
  const filteredOptions = options.filter((option) =>
    normalizeSearch(option.label).includes(normalizedSearch),
  );

  return (
    <View style={[styles.field, open && styles.fieldOpen]}>
      <Text style={styles.fieldLabel}>
        {label}{required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <View style={styles.selectAnchor}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${value.length ? selectedNames : placeholder}`}
          accessibilityState={{ expanded: open }}
          onPress={() => {
            setOpen((current) => !current);
            setSearch('');
          }}
          style={[styles.select, error && styles.inputError]}
        >
          <Text style={[styles.selectText, !value.length && styles.selectPlaceholder]}>
            {value.length ? selectedNames : placeholder}
          </Text>
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color="#627485" />
        </Pressable>
        {open ? (
          <View style={styles.selectOptions}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Pesquisar idioma..."
              placeholderTextColor="#9AA8B2"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.searchInput}
            />
            <ScrollView
              style={styles.optionsList}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => {
                  const selected = value.includes(option.value);
                  return (
                    <Pressable
                      key={option.value}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected }}
                      onPress={() => onSelect(option.value)}
                      style={styles.selectOption}
                    >
                      <Text style={[styles.selectOptionText, option.inactive && styles.inactiveOptionText]}>
                        {option.label}
                      </Text>
                      {selected ? (
                        <Ionicons name="checkmark" size={16} color="#087F8C" />
                      ) : null}
                    </Pressable>
                  );
                })
              ) : (
                <Text style={styles.noOptionsText}>Nenhum idioma encontrado.</Text>
              )}
            </ScrollView>
          </View>
        ) : null}
      </View>
      {error ? <Text accessibilityRole="alert" style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

// Acrescenta ao catálogo os ids selecionados que não vieram na lista de ativos.
export function withInactiveLanguages(options: LanguageOption[], selectedIds: number[]) {
  const missing = selectedIds.filter((id) => !options.some((option) => option.value === id));
  return [
    ...options,
    ...missing.map((id) => ({ label: `Idioma desativado (nº ${id})`, value: id, inactive: true })),
  ];
}

export function toggleLanguageId(ids: number[], id: number) {
  return ids.includes(id) ? ids.filter((current) => current !== id) : [...ids, id];
}

function optionNames(options: LanguageOption[], values: number[]) {
  return values
    .map((value) => options.find((option) => option.value === value)?.label ?? '—')
    .join(', ');
}

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
}

const styles = StyleSheet.create({
  field: { flex: 1, minWidth: 200, marginBottom: 2 },
  fieldOpen: { zIndex: 10, elevation: 10 },
  fieldLabel: { marginBottom: 7, color: '#172B3A', fontSize: 12, fontWeight: '700' },
  required: { color: '#B33A3A' },
  inputError: { borderColor: '#B33A3A', backgroundColor: '#FFF8F8' },
  fieldError: { marginTop: 5, color: '#B33A3A', fontSize: 10, lineHeight: 15 },
  select: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderWidth: 1, borderColor: '#CAD6DD', borderRadius: 9, backgroundColor: '#FFFFFF' },
  selectText: { color: '#172B3A', fontSize: 13 },
  selectPlaceholder: { color: '#9AA8B2' },
  selectAnchor: { position: 'relative', zIndex: 1 },
  selectOptions: { position: 'absolute', top: 49, left: 0, right: 0, zIndex: 20, maxHeight: 240, borderWidth: 1, borderColor: '#DFE7EC', borderRadius: 9, backgroundColor: '#FFFFFF', elevation: 12, shadowColor: '#0B2239', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.16, shadowRadius: 12 },
  searchInput: {
    minHeight: 42,
    paddingHorizontal: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#DFE7EC',
    color: '#172B3A',
    fontSize: 12,
  },
  optionsList: { maxHeight: 190 },
  noOptionsText: {
    padding: 12,
    color: '#627485',
    fontSize: 12,
    textAlign: 'center',
  },
  selectOption: { minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 11, borderBottomWidth: 1, borderBottomColor: '#EDF1F3' },
  selectOptionText: { color: '#172B3A', fontSize: 12 },
  inactiveOptionText: { color: '#8A99A5', fontStyle: 'italic' },
});
