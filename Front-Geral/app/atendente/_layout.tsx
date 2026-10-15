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
          Menu Atendente
        </Text>

        <Pressable
          style={styles.itemMenu}
          onPress={() => router.push('/atendente/requisicoes')}
        >
          <Text style={styles.label}>
            Requisições
          </Text>
        </Pressable>

        <Pressable
          style={styles.itemMenu}
          onPress={() => router.push('/atendente/orcamentos')}
        >
          <Text style={styles.label}>
            Orçamentos
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


export default function AtendenteLayout() {

  return (
    <Drawer
      drawerContent={(props) => (
        <CustomDrawerContent {...props} />
      )}

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
        name="requisicoes"
        options={{
          drawerLabel: 'Requisições',
          title: 'Requisições',
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
        name="novo-orcamento"
        options={{
          drawerItemStyle: {
            display: 'none',
          },
          title: 'Novo Orçamento',
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

	itemMenu: {
	  paddingHorizontal: 16,
	  paddingVertical: 14,
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
