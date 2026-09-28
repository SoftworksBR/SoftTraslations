import { Stack } from 'expo-router';

export default function TradutoresLayout() {
  return (
    <Stack>
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