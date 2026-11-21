import { Ionicons } from '@expo/vector-icons';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Toast = { id: number; message: string };

const SuccessToastContext = createContext<((message: string) => void) | null>(null);

export function SuccessToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const nextId = useRef(0);
  const [progress] = useState(() => new Animated.Value(0));

  const showSuccess = useCallback((message: string) => {
    nextId.current += 1;
    setToast({ id: nextId.current, message });
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    progress.setValue(0);
    const animation = Animated.sequence([
      Animated.timing(progress, { toValue: 1, duration: 300, useNativeDriver: Platform.OS !== 'web' }),
      Animated.delay(4000),
      Animated.timing(progress, { toValue: 0, duration: 300, useNativeDriver: Platform.OS !== 'web' }),
    ]);
    animation.start(({ finished }) => {
      if (finished) {
        setToast(null);
      }
    });

    return () => animation.stop();
  }, [progress, toast]);

  return (
    <SuccessToastContext.Provider value={showSuccess}>
      <View style={styles.root}>
        {children}
        {toast ? (
          <SafeAreaView edges={['top']} style={styles.overlay}>
            <Animated.View
              accessibilityLiveRegion="polite"
              style={[
                styles.toast,
                {
                  opacity: progress,
                  transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-200, 0] }) }],
                },
              ]}
            >
              <Ionicons name="checkmark-circle" size={24} color="#20845A" />
              <Text style={styles.message}>{toast.message}</Text>
            </Animated.View>
          </SafeAreaView>
        ) : null}
      </View>
    </SuccessToastContext.Provider>
  );
}

export function useSuccessToast() {
  const showSuccess = useContext(SuccessToastContext);
  if (!showSuccess) {
    throw new Error('useSuccessToast precisa estar dentro de SuccessToastProvider.');
  }
  return showSuccess;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', zIndex: 100, elevation: 100, pointerEvents: 'none' },
  toast: {
    maxWidth: '90%',
    minHeight: 56,
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#B8E3CA',
    borderRadius: 12,
    backgroundColor: '#E8F5EE',
    elevation: 8,
  },
  message: { flexShrink: 1, color: '#20845A', fontSize: 15, fontWeight: '700' },
});
