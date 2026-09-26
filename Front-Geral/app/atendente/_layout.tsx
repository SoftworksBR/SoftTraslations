import { Drawer } from 'expo-router/drawer';
import { router } from 'expo-router';

import {
  DrawerContentScrollView,
  DrawerItem,
} from '@react-navigation/drawer';

import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

function CustomDrawerContent(props: any) {

  function deslogar() {
    router.replace('/');
  }

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.drawerContent}
    >

      <View>

        <Text style={styles.titulo}>
          Menu Atendente
        </Text>

        <DrawerItem
          label="Requisições"
          onPress={() =>
            router.push('/atendente/requisicoes')
          }
          labelStyle={styles.label}
        />

        <DrawerItem
          label="Orçamentos"
          onPress={() =>
            router.push('/atendente/orcamentos')
          }
          labelStyle={styles.label}
        />

      </View>

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