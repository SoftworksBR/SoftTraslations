
import { Drawer } from 'expo-router/drawer';
import { router } from 'expo-router';
import { useTradutor } from '@/context/TradutorContext';

import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';

function CustomDrawerContent() {
  const { tradutorAtual } = useTradutor();

  function deslogar() {
    router.replace('/');
  }

  return (
    <View style={styles.drawerContent}>
      <View>
        <Text style={styles.titulo}>
          Menu Tradutor
        </Text>

        {tradutorAtual?.status === 'autorizado' && (
          <Pressable
            style={styles.itemMenu}
            onPress={() =>
              router.push(
                `/tradutor/servicos?id=${tradutorAtual.id}`
              )
            }
          >
            <Text style={styles.label}>
              Serviços
            </Text>
          </Pressable>
        )}
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

export default function TradutorLayout() {
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
          title: 'Área do Tradutor',
        }}
      />

      <Drawer.Screen
        name="completar-perfil"
        options={{
          title: 'Completar Perfil',
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="servicos"
        options={{
          drawerLabel: 'Serviços',
          title: 'Serviços',
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
