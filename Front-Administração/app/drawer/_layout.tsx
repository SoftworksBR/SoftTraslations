import { Drawer } from 'expo-router/drawer';

export default function DrawerLayout() {
  return (
    <Drawer
      screenOptions={{
        drawerStyle: {
          backgroundColor: '#000',
          width: 280,
        },

        drawerActiveTintColor: '#fff',
        drawerInactiveTintColor: '#aaa',

        headerStyle: {
          backgroundColor: '#000',
        },

        headerTintColor: '#fff',
      }}
    >
      <Drawer.Screen
        name="GerenciarAtendimento"
        options={{
          drawerLabel: 'Gerenciar Atendimento',
          title: 'Gerenciar Atendimento',
        }}
      />

      <Drawer.Screen
        name="GerenciamentoAdministracao"
        options={{
          drawerLabel: 'Administradores',
          title: 'Administradores',
        }}
      />

      <Drawer.Screen
        name="GerenciarGestor"
        options={{
          drawerLabel: 'Gerenciar Gestores',
          title: 'Gerenciar Gestores',
        }}
      />
    </Drawer>
  );
}