import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  closeDialog,
  subscribeToDialog,
} from '@/services/dialog';
import type { DialogRequest } from '@/services/dialog';

export function DialogHost() {
  const [dialog, setDialog] = useState<DialogRequest | null>(null);

  useEffect(() => subscribeToDialog(setDialog), []);

  if (!dialog) {
    return null;
  }

  const isConfirmation = Boolean(dialog.onConfirm);

  return (
    <Modal
      animationType="fade"
      transparent
      visible
      onRequestClose={() => closeDialog(false)}
    >
      <View style={styles.backdrop}>
        <View
          accessibilityRole="alert"
          accessibilityViewIsModal
          style={styles.card}
        >
          <Text style={styles.title}>{dialog.title}</Text>
          <Text style={styles.message}>{dialog.message}</Text>
          <View style={styles.actions}>
            {isConfirmation ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => closeDialog(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              onPress={() => closeDialog(true)}
              style={styles.confirmButton}
            >
              <Text style={styles.confirmText}>
                {dialog.confirmText ?? 'OK'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(11, 34, 57, 0.42)',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    padding: 22,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    elevation: 8,
  },
  title: { color: '#0B2239', fontSize: 18, fontWeight: '800' },
  message: { marginTop: 10, color: '#526575', fontSize: 14, lineHeight: 21 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 22,
  },
  cancelButton: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderRadius: 8,
  },
  cancelText: { color: '#526575', fontWeight: '700' },
  confirmButton: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#087F8C',
  },
  confirmText: { color: '#FFFFFF', fontWeight: '700' },
});
