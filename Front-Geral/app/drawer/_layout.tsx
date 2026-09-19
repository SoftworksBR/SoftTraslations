import { Drawer } from 'expo-router/drawer';
import { router } from 'expo-router';
import {
  DrawerContentScrollView,
  DrawerItem,
} from '@react-navigation/drawer';
import { View, Text, StyleSheet } from 'react-native';

function CustomDrawerContent(props: any) {
  function deslogar() {
    // Futuramente podemos limpar o token/sessão aqui

    router.replace('/');
  }

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.drawerContent}
    >
      {/* Opções do menu */}
      <View>
        <Text style={styles.titulo}>Menu</Text>

        <DrawerItem
          label="Gerenciar Atendimento"
          onPress={() =>
            router.push('/drawer/GerenciarAtendimento')
          }
          labelStyle={styles.label}
        />

        <DrawerItem
          label="Gerenciar Administradores"
          onPress={() =>
            router.push('/drawer/GerenciarAdministracao')
          }
          labelStyle={styles.label}
        />

        <DrawerItem
          label="Gerenciar Gestores"
          onPress={() =>
            router.push('/drawer/GerenciarGestor')
          }
          labelStyle={styles.label}
        />
      </View>

      {/* Deslogar */}
      <View style={styles.rodape}>
        <DrawerItem
          label="Deslogar"
          onPress={deslogar}
          labelStyle={styles.deslogar}
        />
      </View>
    </DrawerContentScrollView>
  );
}

export default function DrawerLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
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

const styles = StyleSheet.create({
  drawerContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },

  titulo: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
  },

  label: {
    color: '#fff',
    fontSize: 16,
  },

  rodape: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 10,
    paddingBottom: 10,
  },

  deslogar: {
    color: '#ff5555',
    fontSize: 16,
    fontWeight: 'bold',
  },
});