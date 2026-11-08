import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider } from '@/context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>

      <Stack
        screenOptions={{
          contentStyle: {
            backgroundColor: '#F5F8FA',
          },
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerTintColor: '#0B2239',
          headerTitleStyle: {
            fontWeight: '700',
          },
        }}
      >

        <Stack.Screen
          name="landingPage"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="login"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="drawer"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="gestor"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="atendente"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="orcamentos"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="modal"
          options={{
            presentation: 'modal',
          }}
        />

      </Stack>

      <StatusBar style="auto" />

    </AuthProvider>
  );
}
