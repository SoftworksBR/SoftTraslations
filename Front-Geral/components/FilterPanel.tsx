import { Ionicons } from '@expo/vector-icons';
import { useState, type ReactNode } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

export type FilterOption<Value extends string> = {
  label: string;
  value: Value;
};

export function FilterPanel({
  children,
  onApply,
  onClear,
  onOpen,
}: {
  children: ReactNode;
  onApply: () => void;
  onClear: () => void;
  onOpen?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { width } = useWindowDimensions();

  function toggle() {
    if (!open) onOpen?.();
    setOpen((current) => !current);
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={toggle}
        style={[styles.trigger, open && styles.triggerOpen]}
      >
        <Ionicons name="settings-outline" size={17} color={open ? '#087F8C' : '#172B3A'} />
        <Text style={[styles.triggerText, open && styles.triggerTextOpen]}>Filtros</Text>
        <Ionicons
          name="chevron-down"
          size={15}
          color={open ? '#087F8C' : '#627485'}
          style={open && styles.chevronOpen}
        />
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.overlay}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar filtros"
            onPress={() => setOpen(false)}
            style={styles.scrim}
          />
          <View
            style={[
              styles.content,
              width < 720 && styles.contentNarrow,
              { width: Math.min(width - 32, 680) },
            ]}
          >
            <View style={styles.fields}>{children}</View>
            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                onPress={onClear}
                style={styles.clearButton}
              >
                <Text style={styles.clearText}>Limpar filtros</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  onApply();
                  setOpen(false);
                }}
                style={styles.applyButton}
              >
                <Text style={styles.applyText}>Aplicar filtros</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

export function FilterSelect<Value extends string>({
  label,
  value,
  options,
  open,
  onToggle,
  onSelect,
}: {
  label: string;
  value: Value;
  options: FilterOption<Value>[];
  open: boolean;
  onToggle: () => void;
  onSelect: (value: Value) => void;
}) {
  const selected = options.find((option) => option.value === value);

  return (
    <View style={[styles.field, open && styles.fieldOpen]}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={onToggle}
        style={styles.select}
      >
        <Text numberOfLines={1} style={styles.selectText}>
          {selected?.label}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={15} color="#627485" />
      </Pressable>
      {open ? (
        <View style={styles.options}>
          {options.map((option) => (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected: option.value === value }}
              onPress={() => onSelect(option.value)}
              style={styles.option}
            >
              <Text style={styles.optionText}>{option.label}</Text>
              {option.value === value ? (
                <Ionicons name="checkmark" size={15} color="#087F8C" />
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
  },
  triggerOpen: { borderColor: '#087F8C', backgroundColor: '#E8F6F7' },
  triggerText: { color: '#172B3A', fontSize: 12, fontWeight: '700' },
  triggerTextOpen: { color: '#087F8C' },
  chevronOpen: { transform: [{ rotate: '180deg' }] },
  overlay: { flex: 1, alignItems: 'flex-end', paddingTop: 96, paddingHorizontal: 16 },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(11,34,57,0.12)',
  },
  content: {
    zIndex: 1,
    padding: 18,
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    elevation: 14,
    shadowColor: '#0B2239',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
  },
  contentNarrow: { alignSelf: 'center', marginTop: 8 },
  fields: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  field: { flex: 1, minWidth: 180, position: 'relative' },
  fieldOpen: { zIndex: 2, elevation: 2 },
  label: { marginBottom: 6, color: '#627485', fontSize: 10, fontWeight: '700' },
  select: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  selectText: { flex: 1, color: '#172B3A', fontSize: 11 },
  options: {
    position: 'absolute',
    zIndex: 10,
    top: 64,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    elevation: 12,
  },
  option: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF1F3',
  },
  optionText: { color: '#172B3A', fontSize: 11 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    paddingTop: 16,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EDF1F3',
  },
  clearButton: { minHeight: 38, justifyContent: 'center', paddingHorizontal: 8 },
  clearText: { color: '#627485', fontSize: 12, fontWeight: '600' },
  applyButton: {
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#087F8C',
  },
  applyText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
});
