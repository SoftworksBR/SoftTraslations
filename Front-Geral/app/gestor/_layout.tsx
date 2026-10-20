
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
        <Text style={styles.titulo}>
          Menu Gestor
        </Text>

        <Pressable
          style={styles.itemMenu}
          onPress={() => router.push('/gestor/orcamentos')}
        >
          <Text style={styles.label}>Orçamentos</Text>
        </Pressable>

        <Pressable
          style={styles.itemMenu}
          onPress={() => router.push('/gestor/projetos')}
        >
          <Text style={styles.label}>Projetos</Text>
        </Pressable>

        <Pressable
          style={styles.itemMenu}
          onPress={() => router.push('/gestor/tradutores')}
        >
          <Text style={styles.label}>Tradutores</Text>
        </Pressable>

        <Pressable
          style={styles.itemMenu}
          onPress={() => router.push('/gestor/workflow')}
        >
          <Text style={styles.label}>Workflow</Text>
        </Pressable>
      </View>

      <View style={styles.rodape}>
        <Pressable
          style={styles.itemMenu}
          onPress={deslogar}
        >
          <Text style={styles.deslogar}>Deslogar</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function GestorLayout() {
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
        name="index"
        options={{
          drawerItemStyle: { display: 'none' },
          title: 'Área do Gestor',
        }}
      />

      <Drawer.Screen
        name="orcamentos"
        options={{
          drawerLabel: 'Orçamentos',
          title: 'Orçamentos',
        }}
      />

      <Drawer.Screen
        name="projetos"
        options={{
          drawerLabel: 'Projetos',
          title: 'Projetos',
        }}
      />

      <Drawer.Screen
        name="tradutores"
        options={{
          drawerLabel: 'Tradutores',
          title: 'Tradutores',
        }}
      />

      <Drawer.Screen
        name="workflow"
        options={{
          drawerLabel: 'Workflow',
          title: 'Workflow',
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

