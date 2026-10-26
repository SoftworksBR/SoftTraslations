import { createElement } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

type Props = {
  files: File[];
  onChange: (files: File[]) => void;
};

/** Seleção de anexos (somente web). No app nativo mostra um aviso. */
export function WebFilePicker({ files, onChange }: Props) {
  if (Platform.OS !== 'web') {
    return (
      <Text style={styles.note}>
        O envio de anexos está disponível na versão web.
      </Text>
    );
  }

  return (
    <View style={styles.box}>
      {createElement('input', {
        type: 'file',
        multiple: true,
        accept: '.pdf,.doc,.docx,.odt,.txt,.rtf,.xls,.xlsx,.png,.jpg,.jpeg',
        onChange: (event: { target: { files: FileList | null } }) =>
          onChange(Array.from(event.target.files ?? [])),
      })}
      {files.map((file) => (
        <Text key={file.name} style={styles.name}>
          📎 {file.name}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { marginBottom: 15 },
  name: { marginTop: 6, color: '#333' },
  note: { color: '#888', marginBottom: 15 },
});
