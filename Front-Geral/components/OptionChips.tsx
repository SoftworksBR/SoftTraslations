import { Pressable, StyleSheet, Text, View } from 'react-native';

type Option = { id: number; label: string };

type Props = {
  options: Option[];
  /** ids selecionados */
  selected: number[];
  onToggle: (id: number) => void;
  emptyText?: string;
};

/** Seletor por "chips": uma escolha (use onToggle trocando o array) ou várias. */
export function OptionChips({ options, selected, onToggle, emptyText }: Props) {
  if (options.length === 0) {
    return <Text style={styles.empty}>{emptyText ?? 'Nenhuma opção.'}</Text>;
  }

  return (
    <View style={styles.row}>
      {options.map((option) => {
        const active = selected.includes(option.id);
        return (
          <Pressable
            key={option.id}
            onPress={() => onToggle(option.id)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.text, active && styles.textActive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  text: {
    color: '#333',
    fontSize: 14,
  },
  textActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  empty: {
    color: '#888',
    marginBottom: 15,
  },
});
