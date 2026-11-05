
import { Stack } from 'expo-router';

export default function OrcamentosLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="MinhasSolicitacoes"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FazerSolicitacao"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
