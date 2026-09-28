import { Stack } from 'expo-router';

export default function WorkflowLayout() {
  return (
    <Stack
  screenOptions={{
    headerShown: false,
  }}
>
  <Stack.Screen name="index" />
  <Stack.Screen name="quadros" />
  <Stack.Screen name="trilhas" />
  <Stack.Screen name="nova-trilha" />
</Stack>
  );
}