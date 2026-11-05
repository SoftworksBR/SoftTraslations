import { Stack } from 'expo-router';

export default function TradutoresLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
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
        name="index"
        options={{
          title: 'Tradutores',
        }}
      />

      <Stack.Screen
        name="novo"
        options={{
          title: 'Pré-cadastro de Tradutor',
        }}
      />
    </Stack>
  );
}