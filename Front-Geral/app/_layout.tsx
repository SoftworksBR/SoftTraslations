import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

export default function RootLayout() {
  return (
    <>
      <Stack>

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
          name="modal"
          options={{
            presentation: 'modal',
          }}
        />

      </Stack>

      <StatusBar style="auto" />
    </>
  );
}