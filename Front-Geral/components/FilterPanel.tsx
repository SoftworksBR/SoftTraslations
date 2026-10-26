import { Ionicons } from '@expo/vector-icons';
import { useRef, useState, type ReactNode } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
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
  const selectRef = useRef<View>(null);
  const [anchor, setAnchor] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const dropdownHeight = Math.min(options.length * 39, screenHeight - 32);
  const placeAbove = anchor
    ? anchor.y + anchor.height + dropdownHeight + 6 > screenHeight - 16 &&
      anchor.y > dropdownHeight + 16
    : false;
  const dropdownTop = anchor
    ? placeAbove
      ? Math.max(16, anchor.y - dropdownHeight - 6)
      : Math.min(screenHeight - dropdownHeight - 16, anchor.y + anchor.height + 6)
    : 0;
  const dropdownWidth = anchor ? Math.min(anchor.width, screenWidth - 32) : 0;
  const dropdownLeft = anchor
    ? Math.max(16, Math.min(anchor.x, screenWidth - dropdownWidth - 16))
    : 0;

  function toggleOptions() {
    if (open) {
      onToggle();
      return;
    }
    selectRef.current?.measureInWindow((x, y, measuredWidth, height) => {
      setAnchor({ x, y, width: measuredWidth, height });
      onToggle();
    });
  }

  return (
    <>
      <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
        <View ref={selectRef} collapsable={false}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: open }}
            onPress={toggleOptions}
            style={styles.select}
          >
            <Text numberOfLines={1} style={styles.selectText}>
              {selected?.label}
            </Text>
            <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={15} color="#627485" />
          </Pressable>
        </View>
      </View>
      <Modal
        visible={open && anchor !== null}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={onToggle}
      >
        <View style={styles.dropdownOverlay}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Fechar opções de ${label}`}
            onPress={onToggle}
            style={styles.dropdownScrim}
          />
          <ScrollView
            keyboardShouldPersistTaps="always"
            style={[
              styles.options,
              {
                top: dropdownTop,
                left: dropdownLeft,
                width: dropdownWidth,
                maxHeight: dropdownHeight,
              },
            ]}
          >
          {options.map((option) => (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected: option.value === value }}
              onPress={() => {
                onSelect(option.value);
                setAnchor(null);
              }}
              style={styles.option}
            >
              <Text style={styles.optionText}>{option.label}</Text>
              {option.value === value ? (
                <Ionicons name="checkmark" size={15} color="#087F8C" />
              ) : null}
            </Pressable>
          ))}
          </ScrollView>
        </View>
      </Modal>
    </>
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
  field: { flex: 1, minWidth: 180 },
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
  dropdownOverlay: { flex: 1 },
  dropdownScrim: { ...StyleSheet.absoluteFill },
  options: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    elevation: 24,
    shadowColor: '#0B2239',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
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
