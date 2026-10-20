
import { Drawer } from 'expo-router/drawer';
import { router } from 'expo-router';

import { logout } from '@/services/auth';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';

function CustomDrawerContent() {
  async function deslogar() {
    try {
      await logout();
    } finally {
      router.replace('/');
    }
  }

  return (
    <View style={styles.drawerContent}>
      <View>
        <Text style={styles.titulo}>Menu</Text>

        <Pressable
          style={styles.itemMenu}
          onPress={() =>
            router.push('/drawer/GerenciarAtendimento')
          }
        >
          <Text style={styles.label}>
            Gerenciar Atendimento
          </Text>
        </Pressable>

        <Pressable
          style={styles.itemMenu}
          onPress={() =>
            router.push('/drawer/GerenciarAdministracao')
          }
        >
          <Text style={styles.label}>
            Gerenciar Administradores
          </Text>
        </Pressable>

        <Pressable
          style={styles.itemMenu}
          onPress={() =>
            router.push('/drawer/GerenciarGestor')
          }
        >
          <Text style={styles.label}>
            Gerenciar Gestores
          </Text>
        </Pressable>

        <Pressable
          style={styles.itemMenu}
          onPress={() =>
            router.push('/drawer/Configuracoes')
          }
        >
          <Text style={styles.label}>
            Configurações
          </Text>
        </Pressable>

      </View>

      <View style={styles.rodape}>
        <Pressable
          style={styles.itemMenu}
          onPress={deslogar}
        >
          <Text style={styles.deslogar}>
            Deslogar
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function DrawerLayout() {
  return (
    <Drawer
      drawerContent={() => <CustomDrawerContent />}
      screenOptions={{
        drawerStyle: {
          backgroundColor: '#000',
          width: 280,
        },
        drawerActiveTintColor: '#fff',
        drawerInactiveTintColor: '#aaa',
        drawerLabelStyle: {
          color: '#fff',
          fontSize: 16,
        },
        headerStyle: {
          backgroundColor: '#000',
        },
        headerTintColor: '#fff',
      }}
    >
      <Drawer.Screen
        name="GerenciarAtendimento"
        options={{
          drawerLabel: 'Gerenciar Atendentes',
          title: 'Gerenciar Atendimento',
        }}
      />

      <Drawer.Screen
        name="GerenciarAdministracao"
        options={{
          drawerLabel: 'Administradores',
          title: 'Gerenciar Administradores',
        }}
      />

      <Drawer.Screen
        name="GerenciarGestor"
        options={{
          drawerLabel: 'Gerenciar Gestores',
          title: 'Gerenciar Gestores',
        }}
      />

      <Drawer.Screen
      name="configuracoes"
      options={{
        title: 'Configurações',
        drawerLabel: 'Configurações',
      }}
      />

    </Drawer>

  );
}

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: '#000',
    paddingTop: 20,
  },

  titulo: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
  },

  itemMenu: {
    paddingHorizontal: 16,
    paddingVertical: 14,
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
