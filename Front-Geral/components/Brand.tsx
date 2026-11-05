import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <View style={styles.brand}>
      <View style={styles.mark}>
        <Ionicons name="language-outline" size={21} color="#FFFFFF" />
      </View>
      <Text style={[styles.name, light && styles.lightName]}>
        Soft<Text style={[styles.accent, light && styles.lightAccent]}>Translations</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mark: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#087F8C',
  },
  name: {
    color: '#0B2239',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  lightName: {
    color: '#FFFFFF',
  },
  accent: {
    color: '#087F8C',
  },
  lightAccent: {
    color: '#56D2DD',
  },
});
