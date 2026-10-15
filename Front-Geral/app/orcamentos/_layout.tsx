
import { Drawer } from 'expo-router/drawer';
import { router } from 'expo-router';

import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';

function CustomDrawerContent() {
  function deslogar() {
    router.replace('/');
  }

  return (
    <View style={styles.drawerContent}>
      <View>
        <Text style={styles.titulo}>
          Menu Cliente
        </Text>

        <Pressable
          style={styles.itemMenu}
          onPress={() =>
            router.push('/orcamentos/MinhasSolicitacoes')
          }
        >
          <Text style={styles.label}>
            Minhas Solicitações
          </Text>
        </Pressable>

        <Pressable
          style={styles.itemMenu}
          onPress={() =>
            router.push('/orcamentos/FazerSolicitacao')
          }
        >
          <Text style={styles.label}>
            Fazer Solicitação
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

export default function ClienteLayout() {
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
        name="MinhasSolicitacoes"
        options={{
          drawerLabel: 'Minhas Solicitações',
          title: 'Minhas Solicitações',
        }}
      />

      <Drawer.Screen
        name="FazerSolicitacao"
        options={{
          drawerLabel: 'Fazer Solicitação',
          title: 'Fazer Solicitação',
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
